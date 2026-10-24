import crypto from "node:crypto";
import en from "@/i18n/en";
import { fmt } from "@/i18n/format";
import km from "@/i18n/km";
import { getDb } from "./db";
import { isMetalType, METAL_TYPES, metalLabel, type MetalType } from "./metal";
import { formatPrice, parsePrice, unitLabel, type PriceSettings } from "./prices";
import { getSetting, setSetting } from "./settings";
import { tg, type TelegramApi } from "./telegram-api";
import type { Locale } from "./types";

/**
 * Telegram bot for the gold prices. Telegram posts each message and button tap to
 * /api/telegram (see app/api/telegram/route.ts), which hands it to handleUpdate().
 *
 * An owner connects their Telegram account from Dashboard → Account: that creates a one-time
 * code and opens t.me/<bot>?start=<code>. Messages from anyone not connected are refused.
 * Prices are edited step by step (metal → sell → buy) in a draft, and saved on "Publish".
 */

const LINK_MINUTES = 10;
/** An unfinished draft is dropped after this long, so the next edit starts from the website's prices. */
const DRAFT_HOURS = 6;

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME && process.env.TELEGRAM_WEBHOOK_SECRET);
}

const hashCode = (code: string) => crypto.createHash("sha256").update(code).digest("hex");

// ---------- Linking an owner ----------

/** One-time code for t.me/<bot>?start=<code>, valid for a few minutes. */
export function createLinkCode(ownerId: number) {
  const code = crypto.randomBytes(24).toString("base64url");
  const db = getDb();
  db.prepare("DELETE FROM telegram_links WHERE expires_at < ? OR owner_id = ?").run(Date.now(), ownerId);
  db.prepare("INSERT INTO telegram_links (code_hash, owner_id, expires_at) VALUES (?, ?, ?)").run(
    hashCode(code),
    ownerId,
    Date.now() + LINK_MINUTES * 60 * 1000,
  );
  return code;
}

export const LINK_CODE_PATTERN = /^[A-Za-z0-9_-]{32}$/;

export function telegramLinkUrl(code: string) {
  return `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${code}`;
}

export function isTelegramLinked(ownerId: number) {
  const row = getDb().prepare("SELECT telegram_user_id FROM owners WHERE id = ?").get(ownerId) as
    | { telegram_user_id: number | null }
    | undefined;
  return Boolean(row?.telegram_user_id);
}

export function unlinkTelegram(ownerId: number) {
  getDb().prepare("UPDATE owners SET telegram_user_id = NULL WHERE id = ?").run(ownerId);
}

/** Links the Telegram user to the code's owner. False if the code is unknown, used or expired. */
function redeemLinkCode(code: string, telegramUserId: number) {
  const db = getDb();
  return db.transaction(() => {
    const row = db
      .prepare("SELECT owner_id FROM telegram_links WHERE code_hash = ? AND expires_at > ?")
      .get(hashCode(code), Date.now()) as { owner_id: number } | undefined;
    if (!row) return false;
    db.prepare("DELETE FROM telegram_links WHERE owner_id = ?").run(row.owner_id);
    // One Telegram account belongs to one owner.
    db.prepare("UPDATE owners SET telegram_user_id = NULL WHERE telegram_user_id = ?").run(telegramUserId);
    db.prepare("UPDATE owners SET telegram_user_id = ? WHERE id = ?").run(telegramUserId, row.owner_id);
    return true;
  })();
}

function isLinked(telegramUserId: number) {
  return Boolean(getDb().prepare("SELECT 1 FROM owners WHERE telegram_user_id = ?").get(telegramUserId));
}

// ---------- Conversation state ----------

type Rows = PriceSettings["rows"];
type State = { step: "menu" | "sell" | "buy"; metal: MetalType | null; draft: Rows };

function loadState(chatId: number): State | null {
  const row = getDb().prepare("SELECT step, metal, draft, updated_at FROM telegram_state WHERE chat_id = ?").get(chatId) as
    | { step: State["step"]; metal: string | null; draft: string; updated_at: number }
    | undefined;
  if (!row || row.updated_at < Date.now() - DRAFT_HOURS * 60 * 60 * 1000) return null;
  return { step: row.step, metal: isMetalType(row.metal) ? row.metal : null, draft: JSON.parse(row.draft) as Rows };
}

function saveState(chatId: number, state: State) {
  getDb()
    .prepare(
      `INSERT INTO telegram_state (chat_id, step, metal, draft, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(chat_id) DO UPDATE SET step = excluded.step, metal = excluded.metal, draft = excluded.draft,
         updated_at = excluded.updated_at`,
    )
    .run(chatId, state.step, state.metal, JSON.stringify(state.draft), Date.now());
}

function clearState(chatId: number) {
  getDb().prepare("DELETE FROM telegram_state WHERE chat_id = ?").run(chatId);
}

// ---------- Messages ----------

type Update = {
  message?: { chat: { id: number; type: string }; from?: { id: number; language_code?: string }; text?: string };
  callback_query?: {
    id: string;
    from: { id: number; language_code?: string };
    message?: { chat: { id: number; type: string } };
    data?: string;
  };
};

const localeOf = (languageCode?: string): Locale => (languageCode?.startsWith("km") ? "km" : "en");
const dictionaries = { en, km };

/** Handles one update from Telegram. Returns whether prices were published. */
export async function handleUpdate(update: Update, api: TelegramApi = tg): Promise<{ published: boolean }> {
  const msg = update.message;
  const cb = update.callback_query;
  const chat = msg?.chat ?? cb?.message?.chat;
  const from = msg?.from ?? cb?.from;
  if (!chat || !from || chat.type !== "private") return { published: false };

  const locale = localeOf(from.language_code);
  const t = dictionaries[locale].telegram;
  const prices = getSetting("prices");
  const money = (n: number | null | undefined) => (n == null ? "—" : formatPrice(n, prices.currency));
  const send = (text: string, markup?: unknown) =>
    api("sendMessage", { chat_id: chat.id, text, parse_mode: "HTML", ...(markup ? { reply_markup: markup } : {}) });

  if (cb) await api("answerCallbackQuery", { callback_query_id: cb.id }).catch(() => {});

  const text = msg?.text?.trim() ?? "";
  // The link sends "/start <code>"; the owner may also paste the message, or just the code.
  const start = /^\/start(?:\s+(\S+))?$/.exec(text) ?? (LINK_CODE_PATTERN.test(text) ? [text, text] : null);
  const updateKeyboard = { keyboard: [[{ text: t.updateButton }]], resize_keyboard: true, is_persistent: true };

  if (start?.[1]) {
    if (!redeemLinkCode(start[1], from.id)) {
      await send(t.linkInvalid);
      return { published: false };
    }
    await send(t.connected, updateKeyboard);
    return { published: false };
  }
  if (!isLinked(from.id)) {
    await send(t.notConnected);
    return { published: false };
  }

  const rowsText = (rows: Rows, marked = false) =>
    METAL_TYPES.map((m) => {
      const r = rows[m];
      const saved = prices.rows[m];
      const changed = marked && ((r?.sell ?? null) !== (saved?.sell ?? null) || (r?.buy ?? null) !== (saved?.buy ?? null));
      return fmt(t.row, { mark: changed ? "✏️ " : "", metal: metalLabel(m, locale), sell: money(r?.sell), buy: money(r?.buy) });
    }).join("\n");

  const showMenu = async (state: State) => {
    saveState(chat.id, { ...state, step: "menu", metal: null });
    const metalButtons = METAL_TYPES.map((m) => ({ text: metalLabel(m, locale), callback_data: `m:${m}` }));
    await send(fmt(t.menu, { unit: `1 ${unitLabel(prices.unit, locale)}`, rows: rowsText(state.draft, true) }), {
      inline_keyboard: [
        ...Array.from({ length: Math.ceil(metalButtons.length / 2) }, (_, i) => metalButtons.slice(i * 2, i * 2 + 2)),
        [
          { text: t.publish, callback_data: "pub" },
          { text: t.cancel, callback_data: "cancel" },
        ],
      ],
    });
  };

  const ask = async (state: State, step: "sell" | "buy", metal: MetalType) => {
    saveState(chat.id, { ...state, step, metal });
    const current = money(state.draft[metal]?.[step]);
    await send(fmt(step === "sell" ? t.askSell : t.askBuy, { metal: metalLabel(metal, locale), current }), {
      inline_keyboard: [
        [
          { text: fmt(t.keep, { value: current }), callback_data: "keep" },
          { text: t.back, callback_data: "back" },
        ],
      ],
    });
  };

  // A fresh draft starts from the prices on the website.
  const state: State = loadState(chat.id) ?? { step: "menu", metal: null, draft: structuredClone(prices.rows) };

  /** Stores a sell or buy value and moves on: sell → buy → back to the menu. */
  const advance = async (value: number | null | "keep") => {
    const metal = state.metal!;
    const step = state.step as "sell" | "buy";
    if (value !== "keep") {
      const row = { buy: state.draft[metal]?.buy ?? null, sell: state.draft[metal]?.sell ?? null, [step]: value };
      state.draft[metal] = row;
    }
    if (step === "sell") await ask(state, "buy", metal);
    else await showMenu(state);
  };

  if (cb) {
    const data = cb.data ?? "";
    if (data.startsWith("m:") && isMetalType(data.slice(2))) {
      await ask(state, "sell", data.slice(2) as MetalType);
    } else if (data === "keep" && state.step !== "menu" && state.metal) {
      await advance("keep");
    } else if (data === "pub") {
      const rows: Rows = {};
      for (const m of METAL_TYPES) {
        const r = state.draft[m];
        if (r && (r.buy !== null || r.sell !== null)) rows[m] = r;
      }
      setSetting("prices", { ...prices, rows, updatedAt: new Date().toISOString() });
      clearState(chat.id);
      await send(fmt(t.published, { rows: rowsText(rows) }), updateKeyboard);
      return { published: true };
    } else if (data === "cancel") {
      clearState(chat.id);
      await send(t.cancelled, updateKeyboard);
    } else {
      await showMenu(state);
    }
    return { published: false };
  }

  const isMenuRequest = text.startsWith("/") || text === en.telegram.updateButton || text === km.telegram.updateButton;
  if ((state.step === "sell" || state.step === "buy") && state.metal && !isMenuRequest) {
    const value = parsePrice(text.slice(0, 30), prices.currency);
    if (value === null || value === "invalid") await send(t.invalid);
    else await advance(value);
    return { published: false };
  }

  // "/prices", the keyboard button, "/start" or anything else: show the menu.
  await showMenu(state);
  return { published: false };
}

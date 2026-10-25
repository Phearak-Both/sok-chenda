import en from "@/i18n/en";
import { fmt } from "@/i18n/format";
import km from "@/i18n/km";
import { getDb } from "./db";
import { isMetalType, METAL_TYPES, metalLabel, type MetalType } from "./metal";
import { formatPrice, parsePrice, unitLabel, type PriceSettings } from "./prices";
import { getSetting, setSetting } from "./settings";
import { miniAppUrl, tg, type TelegramApi } from "./telegram-api";
import type { Locale } from "./types";

/**
 * Telegram bot for the gold prices. Telegram posts each message and button tap to
 * /api/telegram (see app/api/telegram/route.ts), which hands it to handleUpdate().
 *
 * Only the Telegram users listed in TELEGRAM_OWNER_IDS may use it; anyone else is told their
 * ID so it can be added. The main way to change prices is the form that opens inside Telegram
 * (app/telegram/prices); the chat also offers a step-by-step flow (metal → sell → buy, saved on
 * "Publish") as a fallback.
 */

/** An unfinished draft is dropped after this long, so the next edit starts from the website's prices. */
const DRAFT_HOURS = 6;

/** Whether this Telegram user is listed in TELEGRAM_OWNER_IDS ("123, 456"). */
export function isTelegramOwner(telegramUserId: number) {
  return (process.env.TELEGRAM_OWNER_IDS ?? "")
    .split(/[\s,]+/)
    .filter((id) => /^\d+$/.test(id))
    .map(Number)
    .includes(telegramUserId);
}

type Rows = PriceSettings["rows"];

/** Saves the prices shown in the website's price bar, leaving out metals with no price. */
export function publishPrices(draft: Rows): Rows {
  const rows: Rows = {};
  for (const m of METAL_TYPES) {
    const r = draft[m];
    if (r && (r.buy !== null || r.sell !== null)) rows[m] = { buy: r.buy, sell: r.sell };
  }
  setSetting("prices", { ...getSetting("prices"), rows, updatedAt: new Date().toISOString() });
  return rows;
}

/** One line per metal, e.g. "<b>Kilo gold</b>: sell $488 · buy $473". */
export function priceRowsText(rows: Rows, locale: Locale, changedFrom?: Rows) {
  const t = dictionaries[locale].telegram;
  const { currency } = getSetting("prices");
  const money = (n: number | null | undefined) => (n == null ? "—" : formatPrice(n, currency));
  return METAL_TYPES.map((m) => {
    const r = rows[m];
    const before = changedFrom?.[m];
    const changed =
      changedFrom && ((r?.sell ?? null) !== (before?.sell ?? null) || (r?.buy ?? null) !== (before?.buy ?? null));
    return fmt(t.row, { mark: changed ? "✏️ " : "", metal: metalLabel(m, locale), sell: money(r?.sell), buy: money(r?.buy) });
  }).join("\n");
}

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET);
}

const dictionaries = { en, km };

// ---------- Conversation state ----------

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

export const localeOf = (languageCode?: string): Locale => (languageCode?.startsWith("km") ? "km" : "en");

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
  // The keyboard button opens the price form when the site has an https address, else the chat menu.
  const formUrl = miniAppUrl();
  const updateKeyboard = {
    keyboard: [[formUrl ? { text: t.updateButton, web_app: { url: formUrl } } : { text: t.updateButton }]],
    resize_keyboard: true,
    is_persistent: true,
  };

  if (!isTelegramOwner(from.id)) {
    await send(fmt(t.notAllowed, { id: from.id }));
    return { published: false };
  }
  if (text === "/start" || text.startsWith("/start ")) await send(t.welcome, updateKeyboard);


  const showMenu = async (state: State) => {
    saveState(chat.id, { ...state, step: "menu", metal: null });
    const metalButtons = METAL_TYPES.map((m) => ({ text: metalLabel(m, locale), callback_data: `m:${m}` }));
    await send(fmt(t.menu, { unit: `1 ${unitLabel(prices.unit, locale)}`, rows: priceRowsText(state.draft, locale, prices.rows) }), {
      inline_keyboard: [
        ...(formUrl ? [[{ text: t.openForm, web_app: { url: formUrl } }]] : []),
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
      const rows = publishPrices(state.draft);
      clearState(chat.id);
      await send(fmt(t.published, { rows: priceRowsText(rows, locale) }), updateKeyboard);
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

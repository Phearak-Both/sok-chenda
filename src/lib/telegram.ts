import en from "@/i18n/en";
import { fmt } from "@/i18n/format";
import km from "@/i18n/km";
import { getDb } from "./db";
import { METAL_TYPES, metalLabel } from "./metal";
import { formatPrice, parsePrice, unitLabel, type PriceSettings } from "./prices";
import { getSetting, setSetting } from "./settings";
import { miniAppUrl, tg, type TelegramApi } from "./telegram-api";
import type { Locale } from "./types";

/**
 * Telegram bot for the gold prices. Telegram posts each message and button tap to
 * /api/telegram (see app/api/telegram/route.ts), which hands it to handleUpdate().
 *
 * Only the Telegram users listed in TELEGRAM_OWNER_IDS may use it; anyone else is told their
 * ID so it can be added. Prices are changed either in the form that opens inside Telegram
 * (app/telegram/prices) or by sending them all in one message, e.g. "488 473 / 307 267 / …",
 * which the bot shows as old → new until the owner taps Publish.
 */

/** An unpublished one-message draft is dropped after this long. */
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

/**
 * One line per metal, e.g. "<b>Kilo gold</b>: sell $488 · buy $473". With `changedFrom`, changed
 * prices show as "$488 → <b>$490</b>" and their line is marked ✏️.
 */
export function priceRowsText(rows: Rows, locale: Locale, changedFrom?: Rows) {
  const t = dictionaries[locale].telegram;
  const { currency } = getSetting("prices");
  const money = (n: number | null | undefined) => (n == null ? "—" : formatPrice(n, currency));
  return METAL_TYPES.map((m) => {
    let changed = false;
    const value = (field: "sell" | "buy") => {
      const now = rows[m]?.[field] ?? null;
      const before = changedFrom?.[m]?.[field] ?? null;
      if (!changedFrom || now === before) return money(now);
      changed = true;
      return `${money(before)} → <b>${money(now)}</b>`;
    };
    const sell = value("sell");
    const buy = value("buy");
    return fmt(t.row, { mark: changed ? "✏️ " : "", metal: metalLabel(m, locale), sell, buy });
  }).join("\n");
}

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET);
}

const dictionaries = { en, km };

const KHMER_DIGITS = "០១២៣៤៥៦៧៨៩";

/**
 * Reads all prices from one message: sell then buy for each metal, in METAL_TYPES order,
 * separated by spaces, "/" or new lines. "-" keeps the current price. Khmer digits are accepted.
 * Returns null unless there are exactly two prices per metal and all of them are numbers.
 */
export function parsePriceLine(text: string, current: Rows): Rows | null {
  const { currency } = getSetting("prices");
  const tokens = text
    .replace(/[០-៩]/g, (d) => String(KHMER_DIGITS.indexOf(d)))
    .split(/[\s/|]+/)
    .filter(Boolean);
  if (tokens.length !== METAL_TYPES.length * 2) return null;
  const rows: Rows = {};
  for (const [i, m] of METAL_TYPES.entries()) {
    const value = (token: string, field: "sell" | "buy") => {
      if (/^[-–—]$/.test(token)) return current[m]?.[field] ?? null;
      const n = parsePrice(token.slice(0, 30), currency);
      return n === null || n === "invalid" ? undefined : n;
    };
    const sell = value(tokens[i * 2], "sell");
    const buy = value(tokens[i * 2 + 1], "buy");
    if (sell === undefined || buy === undefined) return null;
    rows[m] = { sell, buy };
  }
  return rows;
}

/** The current prices as a line the owner can copy, edit and send back. */
function priceLine(rows: Rows) {
  return METAL_TYPES.map((m) => `${rows[m]?.sell ?? "-"} ${rows[m]?.buy ?? "-"}`).join(" / ");
}

// ---------- Unpublished draft ----------

function loadDraft(chatId: number): Rows | null {
  const row = getDb().prepare("SELECT step, draft, updated_at FROM telegram_state WHERE chat_id = ?").get(chatId) as
    | { step: string; draft: string; updated_at: number }
    | undefined;
  if (!row || row.step !== "confirm" || row.updated_at < Date.now() - DRAFT_HOURS * 60 * 60 * 1000) return null;
  return JSON.parse(row.draft) as Rows;
}

function saveDraft(chatId: number, draft: Rows) {
  getDb()
    .prepare(
      `INSERT INTO telegram_state (chat_id, step, metal, draft, updated_at) VALUES (?, 'confirm', NULL, ?, ?)
       ON CONFLICT(chat_id) DO UPDATE SET step = excluded.step, metal = NULL, draft = excluded.draft,
         updated_at = excluded.updated_at`,
    )
    .run(chatId, JSON.stringify(draft), Date.now());
}

function clearDraft(chatId: number) {
  getDb().prepare("DELETE FROM telegram_state WHERE chat_id = ?").run(chatId);
}

// ---------- Messages ----------

type Update = {
  message?: { chat: { id: number; type: string }; from?: { id: number; language_code?: string }; text?: string };
  callback_query?: {
    id: string;
    from: { id: number; language_code?: string };
    message?: { message_id: number; chat: { id: number; type: string } };
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
  const send = (text: string, markup?: unknown) =>
    api("sendMessage", { chat_id: chat.id, text, parse_mode: "HTML", ...(markup ? { reply_markup: markup } : {}) });

  if (cb) await api("answerCallbackQuery", { callback_query_id: cb.id }).catch(() => {});

  if (!isTelegramOwner(from.id)) {
    await send(fmt(t.notAllowed, { id: from.id }));
    return { published: false };
  }

  // The keyboard button opens the price form when the site has an https address.
  const formUrl = miniAppUrl();
  const updateKeyboard = {
    keyboard: [[formUrl ? { text: t.updateButton, web_app: { url: formUrl } } : { text: t.updateButton }]],
    resize_keyboard: true,
    is_persistent: true,
  };
  const unit = `1 ${unitLabel(prices.unit, locale)}`;
  const order = METAL_TYPES.map((m) => metalLabel(m, locale)).join(" · ");
  const howTo = (lead: string) =>
    fmt(t.howTo, { lead, count: METAL_TYPES.length * 2, order, example: priceLine(prices.rows) });

  if (cb) {
    // Each draft message is answered once: its buttons go away whichever is tapped.
    if (cb.message) {
      await api("editMessageReplyMarkup", {
        chat_id: chat.id,
        message_id: cb.message.message_id,
        reply_markup: { inline_keyboard: [] },
      }).catch(() => {});
    }
    const draft = loadDraft(chat.id);
    if (cb.data === "pub" && draft) {
      const rows = publishPrices(draft);
      clearDraft(chat.id);
      await send(fmt(t.published, { rows: priceRowsText(rows, locale) }), updateKeyboard);
      return { published: true };
    }
    if (cb.data === "cancel") {
      clearDraft(chat.id);
      await send(t.cancelled, updateKeyboard);
    } else {
      await send(t.expired);
    }
    return { published: false };
  }

  const text = msg?.text?.trim() ?? "";
  const draft = /\d/.test(text) && !text.startsWith("/") ? parsePriceLine(text, prices.rows) : null;
  if (draft) {
    const changed = METAL_TYPES.some(
      (m) =>
        (draft[m]?.sell ?? null) !== (prices.rows[m]?.sell ?? null) ||
        (draft[m]?.buy ?? null) !== (prices.rows[m]?.buy ?? null),
    );
    if (!changed) {
      await send(t.noChanges);
      return { published: false };
    }
    saveDraft(chat.id, draft);
    await send(fmt(t.confirm, { unit, rows: priceRowsText(draft, locale, prices.rows) }), {
      inline_keyboard: [
        [
          { text: t.publish, callback_data: "pub" },
          { text: t.cancel, callback_data: "cancel" },
        ],
      ],
    });
    return { published: false };
  }

  // A line with numbers that couldn't be read: say how to write it.
  if (/\d/.test(text) && !text.startsWith("/")) {
    await send(howTo(t.couldNotRead));
    return { published: false };
  }

  // "/start", "/prices", the keyboard button's text or anything else: today's prices and how to change them.
  if (text === "/start" || text.startsWith("/start ")) await send(t.welcome, updateKeyboard);
  await send(
    fmt(t.prices, { unit, rows: priceRowsText(prices.rows, locale) }) +
      "\n\n" +
      howTo(formUrl ? fmt(t.leadForm, { button: t.updateButton }) : t.leadText),
    formUrl ? { inline_keyboard: [[{ text: t.openForm, web_app: { url: formUrl } }]] } : updateKeyboard,
  );
  return { published: false };
}

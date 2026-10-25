import { fmt } from "@/i18n/format";
import { METAL_TYPES, metalLabel } from "./metal";
import { formatPrice, type PriceSettings } from "./prices";
import { getSetting, setSetting } from "./settings";
import { miniAppUrl, tg, type TelegramApi } from "./telegram-api";
import { telegramText as t } from "./telegram-text";

/**
 * Telegram bot for the gold prices. Telegram posts each message to /api/telegram (see
 * app/api/telegram/route.ts), which hands it to handleUpdate(). The bot only opens the price
 * form inside Telegram (app/telegram/prices); prices are saved by /api/telegram/app.
 *
 * Only the Telegram users listed in TELEGRAM_OWNER_IDS may use it; anyone else is told their
 * ID so it can be added.
 */

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

/** One line per metal, e.g. "<b>មាសគីឡូ</b>៖ លក់ចេញ $488 · ទិញចូល $473". */
export function priceRowsText(rows: Rows) {
  const { currency } = getSetting("prices");
  const money = (n: number | null | undefined) => (n == null ? "—" : formatPrice(n, currency));
  return METAL_TYPES.map((m) =>
    fmt(t.row, { metal: metalLabel(m, "km"), sell: money(rows[m]?.sell), buy: money(rows[m]?.buy) }),
  ).join("\n");
}

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET);
}

type Update = {
  message?: { chat: { id: number; type: string }; from?: { id: number }; text?: string };
  callback_query?: { id: string; from: { id: number }; message?: { chat: { id: number; type: string } } };
};

/** Answers any message (or a tap on a button from an older version) with a button that opens the form. */
export async function handleUpdate(update: Update, api: TelegramApi = tg) {
  const cb = update.callback_query;
  const chat = update.message?.chat ?? cb?.message?.chat;
  const from = update.message?.from ?? cb?.from;
  if (!chat || !from || chat.type !== "private") return;
  if (cb) await api("answerCallbackQuery", { callback_query_id: cb.id }).catch(() => {});

  const text = update.message?.text?.trim() ?? "";
  const send = (text: string, markup?: unknown) =>
    api("sendMessage", { chat_id: chat.id, text, parse_mode: "HTML", ...(markup ? { reply_markup: markup } : {}) });
  if (!isTelegramOwner(from.id)) {
    await send(fmt(t.notAllowed, { id: from.id }));
    return;
  }
  const formUrl = miniAppUrl();
  if (!formUrl) {
    await send(t.noForm);
    return;
  }
  // Telegram signs the form only when it's opened from a button in a message or the menu button,
  // not from a button under the message box, so "/start" also removes the one older versions added.
  if (text === "/start" || text.startsWith("/start ")) await send(t.hello, { remove_keyboard: true });
  await send(fmt(t.welcome, { button: t.updateButton, menu: t.menuButton }), {
    inline_keyboard: [[{ text: t.updateButton, web_app: { url: formUrl } }]],
  });
}

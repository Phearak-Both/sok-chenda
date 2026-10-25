/**
 * Telegram Bot API calls. Kept free of database imports so the server's start-up hook
 * (src/instrumentation.ts) can load it.
 */

/** Calls a Telegram Bot API method. */
export async function tg(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as { ok: boolean; description?: string } | null;
  if (!json?.ok) throw new Error(`Telegram ${method} failed: ${json?.description ?? res.status}`);
  return json;
}

export type TelegramApi = typeof tg;

/**
 * Points the bot at this site and sets its command list. Runs on every server start
 * (instrumentation.ts) and from `npm run telegram:webhook`; safe to repeat.
 */
export async function registerWebhook() {
  const site = (process.env.SITE_URL ?? "").replace(/\/+$/, "");
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set.");
  if (!site.startsWith("https://")) throw new Error("SITE_URL must be the site's https:// address.");
  if (!/^[A-Za-z0-9_-]{16,256}$/.test(secret)) {
    throw new Error("TELEGRAM_WEBHOOK_SECRET must be 16+ characters: letters, digits, _ or -.");
  }
  // Pending updates are kept: on a sleeping server, the message that wakes it is one of them.
  await tg("setWebhook", {
    url: `${site}/api/telegram`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
  });
  // The "menu" button beside the message box opens the price form (Mini App).
  await tg("setChatMenuButton", {
    menu_button: { type: "web_app", text: "💰 Prices · តម្លៃ", web_app: { url: miniAppUrl()! } },
  });
  await tg("setMyCommands", { commands: [{ command: "prices", description: "Update gold prices" }] });
  await tg("setMyCommands", { commands: [{ command: "prices", description: "ធ្វើបច្ចុប្បន្នភាពតម្លៃមាស" }], language_code: "km" });
  return `${site}/api/telegram`;
}

/** The price form opened inside Telegram (app/telegram/prices), or null without an https SITE_URL. */
export function miniAppUrl() {
  const site = (process.env.SITE_URL ?? "").replace(/\/+$/, "");
  return site.startsWith("https://") ? `${site}/telegram/prices` : null;
}

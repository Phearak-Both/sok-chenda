/**
 * Points the Telegram bot at this site and sets its command list. Safe to run again.
 *
 *   npm run telegram:webhook
 *
 * Needs SITE_URL (https), TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET.
 */
import { tg } from "../src/lib/telegram";

async function main() {
  const site = (process.env.SITE_URL ?? "").replace(/\/+$/, "");
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set.");
  if (!site.startsWith("https://")) throw new Error("SITE_URL must be the site's https:// address.");
  if (!/^[A-Za-z0-9_-]{16,256}$/.test(secret)) {
    throw new Error("TELEGRAM_WEBHOOK_SECRET must be 16+ characters: letters, digits, _ or -.");
  }

  await tg("setWebhook", {
    url: `${site}/api/telegram`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  await tg("setMyCommands", { commands: [{ command: "prices", description: "Update gold prices" }] });
  await tg("setMyCommands", { commands: [{ command: "prices", description: "ធ្វើបច្ចុប្បន្នភាពតម្លៃមាស" }], language_code: "km" });
  console.log(`Telegram webhook set to ${site}/api/telegram`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

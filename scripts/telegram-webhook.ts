/**
 * Points the Telegram bot at this site and its menu button at the price form. Safe to run again.
 * The server also does this by itself on every start (src/instrumentation.ts).
 *
 *   npm run telegram:webhook
 *
 * Needs SITE_URL (https), TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET.
 */
import { registerWebhook } from "../src/lib/telegram-api";

registerWebhook()
  .then((url) => console.log(`Telegram webhook set to ${url}`))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });

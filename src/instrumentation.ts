/** Runs once when the server starts. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.TELEGRAM_BOT_TOKEN) return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  // Register the Telegram webhook on every start, so the bot follows SITE_URL and the secret
  // whatever the host's start command is. A failure is logged and the site starts anyway.
  const { registerWebhook } = await import("./lib/telegram-api");
  registerWebhook()
    .then((url) => console.log(`Telegram webhook set to ${url}`))
    .catch((err) => console.error(`Telegram webhook not set: ${err instanceof Error ? err.message : err}`));
}

import crypto from "node:crypto";

/** Mini App sign-ins older than this are refused. */
const INIT_DATA_MAX_AGE_S = 24 * 60 * 60;

/**
 * Checks the `initData` Telegram hands a Mini App: it is signed with a key derived from the
 * bot token, so a valid hash proves which Telegram user opened the form.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyInitData(initData: string): { id: number; languageCode?: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !initData || initData.length > 4096) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash") ?? "";
  params.delete("hash");
  const checkString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const key = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  const expected = crypto.createHmac("sha256", key).update(checkString).digest("hex");
  if (hash.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) return null;

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > INIT_DATA_MAX_AGE_S) return null;
  try {
    const user = JSON.parse(params.get("user") ?? "") as { id?: unknown; language_code?: unknown };
    if (typeof user.id !== "number") return null;
    return { id: user.id, languageCode: typeof user.language_code === "string" ? user.language_code : undefined };
  } catch {
    return null;
  }
}

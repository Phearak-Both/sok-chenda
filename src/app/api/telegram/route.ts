import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { handleUpdate, telegramConfigured } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/** Telegram webhook. Telegram sends the secret registered by `npm run telegram:webhook` in a header. */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  const sent = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  const valid =
    telegramConfigured() &&
    sent.length === secret.length &&
    crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(secret));
  if (!valid) return new Response(null, { status: 401 });

  try {
    const { published } = await handleUpdate(await req.json());
    if (published) revalidatePath("/", "layout");
  } catch (err) {
    // Answer 200 anyway: Telegram would otherwise resend the same update again and again.
    console.error("Telegram update failed", err);
  }
  return new Response(null, { status: 200 });
}

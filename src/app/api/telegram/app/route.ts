import { revalidatePath } from "next/cache";
import en from "@/i18n/en";
import { fmt } from "@/i18n/format";
import km from "@/i18n/km";
import { METAL_TYPES } from "@/lib/metal";
import { parsePrice, type PriceSettings } from "@/lib/prices";
import { getSetting } from "@/lib/settings";
import { isTelegramOwner, localeOf, priceRowsText, publishPrices } from "@/lib/telegram";
import { tg } from "@/lib/telegram-api";
import { verifyInitData } from "@/lib/telegram-init-data";

export const dynamic = "force-dynamic";

type Body = {
  initData?: unknown;
  check?: unknown;
  /** The language chosen in the form, for the confirmation message. */
  locale?: unknown;
  prices?: Record<string, { sell?: unknown; buy?: unknown } | undefined>;
};

/**
 * Saves the prices from the form opened inside Telegram (app/telegram/prices).
 * With `check: true` it only confirms the user may save, so the form can say so straight away.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const user = verifyInitData(typeof body.initData === "string" ? body.initData : "");
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isTelegramOwner(user.id)) return Response.json({ error: "forbidden", id: user.id }, { status: 403 });
  if (body.check === true) return Response.json({ ok: true });

  const { currency } = getSetting("prices");
  const rows: PriceSettings["rows"] = {};
  const invalid: string[] = [];
  for (const metal of METAL_TYPES) {
    const input = body.prices?.[metal];
    const value = (field: "sell" | "buy") => {
      const parsed = parsePrice(typeof input?.[field] === "string" ? (input[field] as string).slice(0, 30) : "", currency);
      if (parsed === "invalid") invalid.push(`${metal}_${field}`);
      return parsed === "invalid" ? null : parsed;
    };
    rows[metal] = { sell: value("sell"), buy: value("buy") };
  }
  if (invalid.length) return Response.json({ error: "invalid", fields: invalid }, { status: 400 });

  const saved = publishPrices(rows);
  revalidatePath("/", "layout");

  // Confirm in the chat too, so there's a record of each update.
  const locale = body.locale === "en" || body.locale === "km" ? body.locale : localeOf(user.languageCode);
  const t = (locale === "km" ? km : en).telegram;
  await tg("sendMessage", {
    chat_id: user.id,
    text: fmt(t.published, { rows: priceRowsText(saved, locale) }),
    parse_mode: "HTML",
  }).catch((err) => console.error("Telegram confirmation failed", err));

  return Response.json({ ok: true });
}

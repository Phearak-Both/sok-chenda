import type { Metadata } from "next";
import { PriceForm, type PriceFormMetal } from "@/components/telegram/PriceForm";
import { fmt } from "@/i18n/format";
import { METAL_TYPES, metalLabel } from "@/lib/metal";
import { formatUpdated, unitLabel } from "@/lib/prices";
import { getSetting } from "@/lib/settings";
import { telegramText } from "@/lib/telegram-text";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: telegramText.form.title, robots: { index: false } };

/**
 * The price form that opens inside Telegram (a "Mini App") from the Sok Chenda bot, in Khmer.
 * Anyone can load it, as it only shows the public prices; saving goes through
 * /api/telegram/app, which checks Telegram's signature and TELEGRAM_OWNER_IDS.
 */
export default function TelegramPricesPage() {
  const prices = getSetting("prices");
  const metals: PriceFormMetal[] = METAL_TYPES.map((m) => ({
    key: m,
    label: metalLabel(m, "km"),
    sell: prices.rows[m]?.sell ?? null,
    buy: prices.rows[m]?.buy ?? null,
  }));
  const subtitle = fmt(telegramText.form.perUnit, { unit: `1 ${unitLabel(prices.unit, "km")}` });
  const updated = prices.updatedAt ? formatUpdated(prices.updatedAt, "km") : null;
  return (
    <PriceForm metals={metals} currency={prices.currency} text={telegramText.form} subtitle={subtitle} updated={updated} />
  );
}

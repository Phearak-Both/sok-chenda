import type { Metadata } from "next";
import { PriceForm, type PriceFormMetal } from "@/components/telegram/PriceForm";
import en from "@/i18n/en";
import { fmt } from "@/i18n/format";
import km from "@/i18n/km";
import { METAL_TYPES, metalLabel } from "@/lib/metal";
import { formatUpdated, unitLabel } from "@/lib/prices";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gold prices", robots: { index: false } };

/**
 * The price form that opens inside Telegram (a "Mini App") from the Sok Chenda bot.
 * Anyone can load it, as it only shows the public prices; saving goes through
 * /api/telegram/app, which checks Telegram's signature and TELEGRAM_OWNER_IDS.
 */
export default function TelegramPricesPage() {
  const prices = getSetting("prices");
  const metals: PriceFormMetal[] = METAL_TYPES.map((m) => ({
    key: m,
    label: { en: metalLabel(m, "en"), km: metalLabel(m, "km") },
    sell: prices.rows[m]?.sell ?? null,
    buy: prices.rows[m]?.buy ?? null,
  }));
  const text = { en: en.telegram.app, km: km.telegram.app };
  const subtitle = {
    en: fmt(en.telegram.app.perUnit, { unit: `1 ${unitLabel(prices.unit, "en")}` }),
    km: fmt(km.telegram.app.perUnit, { unit: `1 ${unitLabel(prices.unit, "km")}` }),
  };
  const updated = prices.updatedAt
    ? { en: formatUpdated(prices.updatedAt, "en"), km: formatUpdated(prices.updatedAt, "km") }
    : null;
  return <PriceForm metals={metals} currency={prices.currency} text={text} subtitle={subtitle} updated={updated} />;
}

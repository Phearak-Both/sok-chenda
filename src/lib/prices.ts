import { METAL_TYPES, type MetalType } from "./metal";
import type { Locale } from "./types";
import { UNIT_EN, UNIT_KM, type WeightUnit } from "./weight";

export const PRICE_CURRENCIES = ["USD", "KHR"] as const;
export type PriceCurrency = (typeof PRICE_CURRENCIES)[number];

/** Today's prices as typed by the owner. Shown exactly as entered, with when they were saved. */
export type PriceSettings = {
  currency: PriceCurrency;
  /** Weight the prices are quoted for, e.g. per ជី. */
  unit: WeightUnit;
  /** Shop buys from customers (ទិញចូល) / sells to customers (លក់ចេញ). */
  rows: Partial<Record<MetalType, { buy: number | null; sell: number | null }>>;
  /** ISO time of the owner's last save; null until prices are first entered. */
  updatedAt: string | null;
};

export const DEFAULT_PRICES: PriceSettings = { currency: "USD", unit: "chi", rows: {}, updatedAt: null };

/** Rows that have at least one price, in the standard metal order. */
export function priceRows(prices: PriceSettings) {
  return METAL_TYPES.flatMap((metal) => {
    const row = prices.rows[metal];
    return row && (row.buy !== null || row.sell !== null) ? [{ metal, ...row }] : [];
  });
}

/** Parse an owner-typed price ("2,450", "$250.50", "1 250 000៛"). */
export function parsePrice(input: string, currency: PriceCurrency): number | null | "invalid" {
  const cleaned = input.replace(/[\s,$៛]/g, "");
  if (!cleaned) return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return "invalid";
  const n = Number(cleaned);
  if (!(n > 0) || n > 1e9) return "invalid";
  return currency === "KHR" ? Math.round(n) : Math.round(n * 100) / 100;
}

export function formatPrice(n: number, currency: PriceCurrency) {
  return currency === "KHR"
    ? `${n.toLocaleString("en-US")}៛`
    : `$${n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export function unitLabel(unit: WeightUnit, locale: Locale) {
  return locale === "km" ? UNIT_KM[unit] : UNIT_EN[unit];
}

/** Date and time in Cambodia, whatever timezone the server runs in. */
export function formatUpdated(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "km" ? "km-KH" : "en-GB", {
    timeZone: "Asia/Phnom_Penh",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

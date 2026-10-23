import type { Locale } from "./types";

/** Traditional Cambodian gold-weight units, in grams. */
export const GRAMS_PER = {
  domlung: 37.5, // ដំឡឹង = 10 ជី
  chi: 3.75, // ជី = 10 ហ៊ុន
  hun: 0.375, // ហ៊ុន
  gram: 1,
} as const;

export type WeightUnit = keyof typeof GRAMS_PER;
export const WEIGHT_UNITS = Object.keys(GRAMS_PER) as WeightUnit[];

export const UNIT_KM: Record<WeightUnit, string> = { domlung: "ដំឡឹង", chi: "ជី", hun: "ហ៊ុន", gram: "ក្រាម" };
export const UNIT_EN: Record<WeightUnit, string> = { domlung: "domlung", chi: "chi", hun: "hun", gram: "g" };

const num = (n: number, digits = 2) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export function toGrams(value: number, unit: WeightUnit) {
  return value * GRAMS_PER[unit];
}

/** Split a weight into ដំឡឹង, ជី and ហ៊ុន (ហ៊ុន may have up to two decimals). */
export function breakdown(grams: number) {
  // Work in hundredths of a ហ៊ុន to avoid floating-point drift.
  const centiHun = Math.round((grams / GRAMS_PER.hun) * 100);
  return {
    domlung: Math.floor(centiHun / 10000),
    chi: Math.floor((centiHun % 10000) / 1000),
    hun: (centiHun % 1000) / 100,
  };
}

function formatUnits(grams: number, names: Record<WeightUnit, string>) {
  const { domlung, chi, hun } = breakdown(grams);
  const parts = [
    domlung && `${num(domlung)} ${names.domlung}`,
    chi && `${num(chi)} ${names.chi}`,
    hun && `${num(hun)} ${names.hun}`,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : `0 ${names.hun}`;
}

/** e.g. "1 ដំឡឹង 2 ជី 5 ហ៊ុន" */
export const formatWeightKm = (grams: number) => formatUnits(grams, UNIT_KM);

export function formatGrams(grams: number, locale: Locale) {
  return `${num(grams, 3)} ${locale === "km" ? "ក្រាម" : "g"}`;
}

/** How the website shows a weight: Khmer units for Khmer visitors, grams for English visitors. */
export function formatWeight(grams: number, locale: Locale) {
  return locale === "km" ? formatWeightKm(grams) : formatGrams(grams, locale);
}

/** Parse what the owner typed. Returns grams, null for empty, or "invalid". */
export function parseWeightInput(raw: string, unit: WeightUnit): number | null | "invalid" {
  const cleaned = raw.replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,4})?$/.test(cleaned)) return "invalid";
  const grams = toGrams(Number(cleaned), unit);
  return grams > 0 && grams <= 100_000 ? Math.round(grams * 10000) / 10000 : "invalid";
}

/** The value to show in the edit form, expressed in `unit`. */
export function weightInputValue(grams: number | null, unit: WeightUnit) {
  if (grams === null) return "";
  return String(Math.round((grams / GRAMS_PER[unit]) * 10000) / 10000);
}

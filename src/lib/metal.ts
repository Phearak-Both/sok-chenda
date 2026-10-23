import type { Locale } from "./types";

/** What a piece is made of. Platinum is sold in several grades (ទឹក). */
export const METAL_TYPES = ["kilo", "platinum_7vn", "platinum_7", "platinum_5"] as const;
export type MetalType = (typeof METAL_TYPES)[number];

export const PLATINUM_GRADES = METAL_TYPES.filter((m) => m.startsWith("platinum_"));

/** Values accepted by the storefront filter: a single type, or every platinum grade at once. */
export type MetalFilter = MetalType | "platinum";

const LABELS: Record<MetalType, { km: string; en: string; gradeKm?: string; gradeEn?: string }> = {
  kilo: { km: "មាសគីឡូ", en: "Kilo gold" },
  platinum_7vn: { km: "ផ្លាទីនទឹក 7 VN", en: "Platinum 7 VN", gradeKm: "ទឹក 7 VN", gradeEn: "7 VN" },
  platinum_7: { km: "ផ្លាទីនទឹក 7", en: "Platinum 7", gradeKm: "ទឹក 7", gradeEn: "7" },
  platinum_5: { km: "ផ្លាទីនទឹក 5", en: "Platinum 5", gradeKm: "ទឹក 5", gradeEn: "5" },
};

export const PLATINUM_LABEL = { km: "ផ្លាទីន", en: "Platinum" };

export function isMetalType(value: unknown): value is MetalType {
  return (METAL_TYPES as readonly unknown[]).includes(value);
}

export function parseMetalFilter(value: string): MetalFilter | undefined {
  return value === "platinum" || isMetalType(value) ? value : undefined;
}

export function metalLabel(type: MetalType, locale: Locale) {
  return LABELS[type][locale];
}

/** Short grade label for the platinum sub-filter, e.g. "ទឹក 7". */
export function gradeLabel(type: MetalType, locale: Locale) {
  const l = LABELS[type];
  return (locale === "km" ? l.gradeKm : l.gradeEn) ?? l[locale];
}

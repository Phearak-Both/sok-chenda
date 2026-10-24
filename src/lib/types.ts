import type { MetalType } from "./metal";

export const LOCALES = ["en", "km"] as const;
export type Locale = (typeof LOCALES)[number];

/** A piece of text the owner writes in both languages. */
export type LocalizedText = { en: string; km: string };

export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];


export type Media = {
  id: string;
  width: number;
  height: number;
  sizes: number[];
};

export type Category = {
  id: number;
  slug: string;
  name: LocalizedText;
  sort: number;
};

export type Product = {
  id: number;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  material: LocalizedText;
  /** Gold weight in grams; displayed in ដំឡឹង / ជី / ហ៊ុន. */
  weightGrams: number | null;
  metalType: MetalType | null;
  status: ProductStatus;
  categoryId: number | null;
  isFeatured: boolean;
  isSample: boolean;
  sort: number;
  images: Media[];
  updatedAt: string;
};

/** Pick the text for the visitor's language, falling back to the other language. */
export function pick(text: LocalizedText | undefined | null, locale: Locale): string {
  if (!text) return "";
  const preferred = text[locale]?.trim();
  if (preferred) return preferred;
  return (text.en?.trim() || text.km?.trim() || "");
}

/** Whether `pick` had to fall back to a different language than requested. */
export function pickLang(text: LocalizedText | undefined | null, locale: Locale): Locale {
  if (!text || text[locale]?.trim()) return locale;
  return text.en?.trim() ? "en" : "km";
}

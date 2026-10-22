import { cookies, headers } from "next/headers";
import { cache } from "react";
import { LOCALES, type Locale } from "@/lib/types";
import en from "./en";
import km from "./km";

export const LOCALE_COOKIE = "locale";

const dictionaries = { en, km };

export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (saved && (LOCALES as readonly string[]).includes(saved)) return saved as Locale;
  // First visit: follow the browser's language when it asks for Khmer.
  const accept = (await headers()).get("accept-language") ?? "";
  return /(^|,)\s*km\b/i.test(accept) ? "km" : "en";
});

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

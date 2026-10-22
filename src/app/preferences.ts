"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/i18n/server";
import { LOCALES } from "@/lib/types";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocale(locale: string) {
  if (!(LOCALES as readonly string[]).includes(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
}

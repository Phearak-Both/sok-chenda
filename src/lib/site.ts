import { headers } from "next/headers";
import { getDictionary } from "@/i18n/server";
import { getSetting } from "./settings";

/** Everything a public page needs to render contact links and translations. */
export async function getSiteContext() {
  const { locale, t } = await getDictionary();
  return { locale, t, store: getSetting("store") };
}

/** Absolute base URL for links shared outside the site (e.g. in WhatsApp messages). */
export async function getSiteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

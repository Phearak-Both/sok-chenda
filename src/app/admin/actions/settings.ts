"use server";

import { revalidatePath } from "next/cache";
import { getDictionary } from "@/i18n/server";
import { requireOwner } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isHttpUrl, localized, str, type FormState } from "@/lib/form";
import { resolveMapPin } from "@/lib/maps";
import { deleteUnusedMedia, MEDIA_ID_PATTERN } from "@/lib/media";
import { METAL_TYPES } from "@/lib/metal";
import { parsePrice, PRICE_CURRENCIES, type PriceCurrency, type PriceSettings } from "@/lib/prices";
import { getSetting, setSetting } from "@/lib/settings";
import { WEIGHT_UNITS, type WeightUnit } from "@/lib/weight";

function mediaIdOrNull(value: string) {
  if (!MEDIA_ID_PATTERN.test(value)) return null;
  return getDb().prepare("SELECT 1 FROM media WHERE id = ?").get(value) ? value : null;
}

export async function saveContent(_prev: FormState, form: FormData): Promise<FormState> {
  await requireOwner();
  const { t } = await getDictionary();
  const before = { home: getSetting("home"), about: getSetting("about") };

  const home = {
    hero: {
      eyebrow: localized(form, "hero_eyebrow", 80),
      title: localized(form, "hero_title", 160),
      subtitle: localized(form, "hero_subtitle", 300),
      cta: localized(form, "hero_cta", 40),
      imageId: mediaIdOrNull(str(form, "hero_image")),
    },
    intro: { title: localized(form, "intro_title", 160), body: localized(form, "intro_body", 1500) },
    story: {
      title: localized(form, "story_title", 160),
      body: localized(form, "story_body", 1500),
      imageId: mediaIdOrNull(str(form, "story_image")),
    },
    reviewed: true,
  };
  const about = {
    title: localized(form, "about_title", 160),
    body: localized(form, "about_body", 8000),
    imageId: mediaIdOrNull(str(form, "about_image")),
    reviewed: true,
  };

  const errors: Record<string, string> = {};
  for (const [key, value] of Object.entries({
    hero_title: home.hero.title,
    hero_cta: home.hero.cta,
    intro_title: home.intro.title,
    story_title: home.story.title,
    about_title: about.title,
  })) {
    if (!value.en && !value.km) errors[key] = t.admin.common.required;
  }
  if (Object.keys(errors).length) return { errors, message: t.admin.common.fixErrors, at: Date.now() };

  setSetting("home", home);
  setSetting("about", about);
  const replaced = [before.home.hero.imageId, before.home.story.imageId, before.about.imageId].filter(
    (id): id is string => Boolean(id) && ![home.hero.imageId, home.story.imageId, about.imageId].includes(id),
  );
  deleteUnusedMedia(replaced);
  revalidatePath("/", "layout");
  return { ok: true, message: t.admin.common.saved, at: Date.now() };
}

/** Accepts "+855 12 345 678", "012 345 678" etc. Local numbers starting with 0 become +855. */
function normalizeWhatsapp(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("0")) digits = "855" + digits.replace(/^0+/, "");
  return digits;
}

export async function saveSettings(_prev: FormState, form: FormData): Promise<FormState> {
  await requireOwner();
  const { t } = await getDictionary();
  const s = t.admin.settings;
  const errors: Record<string, string> = {};

  const phone = str(form, "phone", 40);
  if (phone && !/^\+?[\d\s().-]{6,20}$/.test(phone)) errors.phone = s.invalidPhone;

  const whatsappRaw = str(form, "whatsapp", 40);
  const whatsapp = whatsappRaw ? normalizeWhatsapp(whatsappRaw) : "";
  if (whatsappRaw && !/^\d{8,15}$/.test(whatsapp)) errors.whatsapp = s.invalidPhone;

  const telegram = str(form, "telegram", 64)
    .replace(/^https?:\/\/(www\.)?t\.me\//i, "")
    .replace(/^@/, "");
  if (telegram && !/^[A-Za-z0-9_]{5,32}$/.test(telegram)) errors.telegram = s.invalidTelegram;

  const email = str(form, "email", 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = s.invalidEmail;

  const urls = {
    facebook: str(form, "facebook", 300),
    instagram: str(form, "instagram", 300),
    tiktok: str(form, "tiktok", 300),
    mapUrl: str(form, "mapUrl", 600),
  };
  for (const [k, v] of Object.entries(urls)) if (!isHttpUrl(v)) errors[k] = s.invalidUrl;

  if (Object.keys(errors).length) return { errors, message: t.admin.common.fixErrors, at: Date.now() };

  // Resolve the pin only when the link changes, so saving other fields never waits on Google.
  const previous = getSetting("store");
  const mapPin = !urls.mapUrl
    ? null
    : urls.mapUrl === previous.mapUrl && previous.mapPin
      ? previous.mapPin
      : await resolveMapPin(urls.mapUrl);

  setSetting("store", {
    phone,
    whatsapp,
    telegram,
    email,
    ...urls,
    mapPin,
    address: localized(form, "address", 500),
    hours: localized(form, "hours", 500),
  });
  revalidatePath("/", "layout");
  return { ok: true, message: t.admin.common.saved, at: Date.now() };
}

export async function savePrices(_prev: FormState, form: FormData): Promise<FormState> {
  await requireOwner();
  const { t } = await getDictionary();
  const currency = (PRICE_CURRENCIES as readonly string[]).includes(str(form, "currency"))
    ? (str(form, "currency") as PriceCurrency)
    : "USD";
  const unit = (WEIGHT_UNITS as string[]).includes(str(form, "unit")) ? (str(form, "unit") as WeightUnit) : "chi";

  const errors: Record<string, string> = {};
  const rows: PriceSettings["rows"] = {};
  for (const metal of METAL_TYPES) {
    const buy = parsePrice(str(form, `${metal}_buy`, 30), currency);
    const sell = parsePrice(str(form, `${metal}_sell`, 30), currency);
    if (buy === "invalid") errors[`${metal}_buy`] = t.admin.prices.invalid;
    if (sell === "invalid") errors[`${metal}_sell`] = t.admin.prices.invalid;
    if (buy !== "invalid" && sell !== "invalid" && (buy !== null || sell !== null)) rows[metal] = { buy, sell };
  }
  if (Object.keys(errors).length) return { errors, message: t.admin.common.fixErrors, at: Date.now() };

  setSetting("prices", { currency, unit, rows, updatedAt: new Date().toISOString() });
  revalidatePath("/", "layout");
  return { ok: true, message: t.admin.common.saved, at: Date.now() };
}

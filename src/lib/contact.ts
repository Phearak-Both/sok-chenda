import type { StoreSettings } from "./settings";

export function whatsappLink(number: string, text?: string) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function telegramLink(username: string) {
  return `https://t.me/${encodeURIComponent(username.replace(/^@/, ""))}`;
}

export function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function hasDirectContact(store: StoreSettings) {
  return Boolean(store.phone || store.whatsapp || store.telegram);
}

export function socialLinks(store: StoreSettings) {
  return (
    [
      ["facebook", store.facebook],
      ["instagram", store.instagram],
      ["tiktok", store.tiktok],
    ] as const
  ).filter(([, url]) => Boolean(url));
}

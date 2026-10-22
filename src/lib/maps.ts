import type { Locale } from "./types";

export type MapPin = { lat: number; lng: number };

/** Hosts whose short links we may follow to find the full Google Maps address. */
const SHORT_LINK_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

function pin(lat: string, lng: string): MapPin | null {
  const p = { lat: Number(lat), lng: Number(lng) };
  return Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180 ? p : null;
}

/** Coordinates in a full Google Maps link: the place pin (!3d…!4d…) first, then the view centre (@lat,lng). */
export function pinFromMapsUrl(url: string): MapPin | null {
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {}
  const n = "(-?\\d{1,3}(?:\\.\\d+)?)";
  const m =
    decoded.match(new RegExp(`!3d${n}!4d${n}`)) ??
    decoded.match(new RegExp(`[?&](?:q|ll|query)=${n},\\s*${n}`)) ??
    decoded.match(new RegExp(`@${n},${n}`));
  return m ? pin(m[1], m[2]) : null;
}

/** Find the pin for an owner-pasted link, following a maps.app.goo.gl short link if needed. */
export async function resolveMapPin(url: string): Promise<MapPin | null> {
  if (!url) return null;
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    const found = pinFromMapsUrl(current);
    if (found) return found;
    let host: string;
    try {
      host = new URL(current).hostname;
    } catch {
      return null;
    }
    if (!SHORT_LINK_HOSTS.has(host)) return null;
    try {
      const res = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(5000) });
      const next = res.headers.get("location");
      if (!next) return null;
      current = new URL(next, current).toString();
    } catch {
      return null;
    }
  }
  return null;
}

/** Google's keyless embed for a single pin. */
export function mapEmbedSrc({ lat, lng }: MapPin, locale: Locale) {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=17&hl=${locale}&output=embed`;
}

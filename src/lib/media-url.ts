import type { Media } from "./types";

/** URL of the smallest stored size that is at least `width` pixels wide. */
export function mediaUrl(media: Media, width?: number) {
  const w = width
    ? (media.sizes.find((s) => s >= width) ?? media.sizes[media.sizes.length - 1])
    : media.sizes[media.sizes.length - 1];
  return `/media/${media.id}/${w}.webp`;
}

export function mediaSrcSet(media: Media) {
  return media.sizes.map((w) => `/media/${media.id}/${w}.webp ${w}w`).join(", ");
}

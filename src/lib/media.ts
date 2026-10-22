import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getDb, UPLOAD_DIR } from "./db";
import type { Media } from "./types";

const TARGET_WIDTHS = [480, 960, 1600, 2400];
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MEDIA_ID_PATTERN = /^[a-f0-9]{24}$/;

export class InvalidImageError extends Error {}

/**
 * Decode an uploaded image, strip its metadata (including GPS location from phone photos)
 * and store resized WebP copies for responsive loading.
 */
export async function saveImage(input: Buffer, opts: { isSample?: boolean } = {}): Promise<Media> {
  let base: ReturnType<typeof sharp>;
  let width: number;
  let height: number;
  try {
    // .rotate() applies the EXIF orientation so phone photos are upright.
    const { data, info } = await sharp(input, { limitInputPixels: 80_000_000 })
      .rotate()
      .toBuffer({ resolveWithObject: true });
    base = sharp(data);
    width = info.width;
    height = info.height;
  } catch {
    throw new InvalidImageError("Unsupported or damaged image");
  }

  const id = crypto.randomBytes(12).toString("hex");
  const dir = path.join(UPLOAD_DIR, id);
  fs.mkdirSync(dir, { recursive: true });

  const sizes = TARGET_WIDTHS.filter((w) => w < width);
  sizes.push(Math.min(width, TARGET_WIDTHS[TARGET_WIDTHS.length - 1]));
  const unique = [...new Set(sizes)].sort((a, b) => a - b);

  try {
    for (const w of unique) {
      await base
        .clone()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(dir, `${w}.webp`));
    }
  } catch (err) {
    fs.rmSync(dir, { recursive: true, force: true });
    throw err;
  }

  getDb()
    .prepare("INSERT INTO media (id, width, height, sizes, is_sample) VALUES (?, ?, ?, ?, ?)")
    .run(id, width, height, JSON.stringify(unique), opts.isSample ? 1 : 0);

  return { id, width, height, sizes: unique };
}

type MediaRow = { id: string; width: number; height: number; sizes: string };

export function rowToMedia(row: MediaRow): Media {
  return { id: row.id, width: row.width, height: row.height, sizes: JSON.parse(row.sizes) };
}

export function getMedia(id: string | null | undefined): Media | null {
  if (!id) return null;
  const row = getDb().prepare("SELECT id, width, height, sizes FROM media WHERE id = ?").get(id) as
    | MediaRow
    | undefined;
  return row ? rowToMedia(row) : null;
}

/** Delete media files and rows that nothing references any more. */
export function deleteUnusedMedia(ids: string[]) {
  const db = getDb();
  const settingsJson = (db.prepare("SELECT group_concat(value) AS v FROM settings").get() as { v: string | null }).v ?? "";
  for (const id of ids) {
    if (!MEDIA_ID_PATTERN.test(id)) continue;
    const used =
      db.prepare("SELECT 1 FROM product_images WHERE media_id = ? LIMIT 1").get(id) ||
      db.prepare("SELECT 1 FROM collections WHERE image_id = ? LIMIT 1").get(id) ||
      settingsJson.includes(id);
    if (used) continue;
    db.prepare("DELETE FROM media WHERE id = ?").run(id);
    fs.rmSync(path.join(UPLOAD_DIR, id), { recursive: true, force: true });
  }
}

/** Remove uploads that were never attached to anything (e.g. a product form that was abandoned). */
export function cleanupOrphanMedia(olderThanHours = 24) {
  const rows = getDb()
    .prepare(
      `SELECT id FROM media m
       WHERE m.created_at < datetime('now', ?)
         AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.media_id = m.id)
         AND NOT EXISTS (SELECT 1 FROM collections c WHERE c.image_id = m.id)`,
    )
    .all(`-${olderThanHours} hours`) as { id: string }[];
  deleteUnusedMedia(rows.map((r) => r.id));
}

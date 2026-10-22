"use server";

import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { requireOwner } from "@/lib/auth";
import { cleanupOrphanMedia, InvalidImageError, MAX_UPLOAD_BYTES, saveImage } from "@/lib/media";
import type { Media } from "@/lib/types";

export type UploadResult = { ok: true; media: Media } | { ok: false; error: string };

export async function uploadImage(form: FormData): Promise<UploadResult> {
  await requireOwner();
  const { t } = await getDictionary();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: t.admin.common.notImage };
  }
  const fail = (reason: string) => ({
    ok: false as const,
    error: fmt(t.admin.common.uploadFailed, { file: file.name, reason }),
  });
  if (file.size > MAX_UPLOAD_BYTES) return fail(t.admin.common.tooLarge);

  try {
    const media = await saveImage(Buffer.from(await file.arrayBuffer()));
    cleanupOrphanMedia();
    return { ok: true, media };
  } catch (err) {
    if (err instanceof InvalidImageError) return fail(t.admin.common.notImage);
    console.error("Image upload failed", err);
    return fail(t.admin.common.error);
  }
}

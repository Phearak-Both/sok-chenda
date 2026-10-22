"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/app/admin/actions/media";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { mediaUrl } from "@/lib/media-url";
import type { Media } from "@/lib/types";
import { ChevronLeft, ChevronRight, ImageIcon, StarIcon, TrashIcon, UploadIcon } from "../icons";

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_EDGE = 2400;

/** Shrink very large photos in the browser so uploads are quick on mobile data. */
async function prepare(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 4 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    return blob ?? file;
  } catch {
    return file; // Let the server decide whether it can read it.
  }
}

function useUploader() {
  const { t } = useI18n();
  return async (file: File): Promise<{ media?: Media; error?: string }> => {
    if (file.size > MAX_BYTES) {
      return { error: fmt(t.admin.common.uploadFailed, { file: file.name, reason: t.admin.common.tooLarge }) };
    }
    const data = new FormData();
    data.append("file", await prepare(file), file.name);
    try {
      const res = await uploadImage(data);
      return res.ok ? { media: res.media } : { error: res.error };
    } catch {
      return { error: fmt(t.admin.common.uploadFailed, { file: file.name, reason: t.admin.common.error }) };
    }
  };
}

/** A single image with upload / replace / remove, submitted as a hidden input. */
export function ImageField({
  name,
  label,
  initial,
  fallback,
  fallbackNote,
  aspect = "aspect-[4/3]",
}: {
  name: string;
  label: string;
  initial: Media | null;
  /** Shown when no image is chosen (e.g. the original cover photo). */
  fallback?: string;
  fallbackNote?: string;
  aspect?: string;
}) {
  const { t } = useI18n();
  const upload = useUploader();
  const input = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<Media | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    const res = await upload(file);
    setBusy(false);
    if (res.media) setMedia(res.media);
    if (res.error) setError(res.error);
    if (input.current) input.current.value = "";
  };

  const preview = media ? mediaUrl(media, 960) : fallback;

  return (
    <div>
      <span className="field-label">{label}</span>
      <input type="hidden" name={name} value={media?.id ?? ""} />
      <div className={`relative ${aspect} max-w-md overflow-hidden rounded-md border border-line bg-cream`}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-faint">
            <ImageIcon size={32} />
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-ivory/80 text-sm">
            {t.admin.common.uploading}
          </div>
        )}
      </div>
      {!media && fallback && fallbackNote && <p className="field-hint">{fallbackNote}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="abtn abtn-sm" disabled={busy} onClick={() => input.current?.click()}>
          <UploadIcon size={15} /> {media ? t.admin.common.changeImage : t.admin.common.chooseImage}
        </button>
        {media && (
          <button type="button" className="abtn abtn-sm abtn-danger" disabled={busy} onClick={() => setMedia(null)}>
            <TrashIcon size={15} /> {t.admin.common.removeImage}
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

/** Ordered product photos. The first one is the main image. */
export function PhotoManager({ initial }: { initial: Media[] }) {
  const { t } = useI18n();
  const upload = useUploader();
  const input = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Media[]>(initial);
  const [pending, setPending] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const p = t.admin.products;

  const onFiles = async (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (input.current) input.current.value = "";
    if (files.length === 0) return;
    setErrors([]);
    setPending(files.length);
    // One at a time keeps each request small and the order predictable.
    for (const file of files) {
      const res = await upload(file);
      if (res.media) setPhotos((prev) => [...prev, res.media!]);
      if (res.error) setErrors((prev) => [...prev, res.error!]);
      setPending((n) => n - 1);
    }
  };

  const move = (from: number, to: number) =>
    setPhotos((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  return (
    <div>
      {photos.map((m) => (
        <input key={m.id} type="hidden" name="image_ids" value={m.id} />
      ))}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((m, i) => (
          <li key={m.id} className="overflow-hidden rounded-md border border-line bg-white">
            <div className="relative aspect-[4/5] bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(m, 480)} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded bg-ink px-2 py-0.5 text-[0.6875rem] font-medium text-white">
                  {p.main}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-1 p-1.5">
              <div className="flex">
                <button
                  type="button"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded hover:bg-cream disabled:opacity-30"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label={p.moveEarlier}
                  title={p.moveEarlier}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded hover:bg-cream disabled:opacity-30"
                  onClick={() => move(i, i + 1)}
                  disabled={i === photos.length - 1}
                  aria-label={p.moveLater}
                  title={p.moveLater}
                >
                  <ChevronRight size={16} />
                </button>
                {i > 0 && (
                  <button
                    type="button"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded hover:bg-cream"
                    onClick={() => move(i, 0)}
                    aria-label={p.makeMain}
                    title={p.makeMain}
                  >
                    <StarIcon size={16} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded text-danger hover:bg-[#fbeeeb]"
                onClick={() => setPhotos((prev) => prev.filter((x) => x.id !== m.id))}
                aria-label={p.removePhoto}
                title={p.removePhoto}
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </li>
        ))}
        {Array.from({ length: pending }, (_, i) => (
          <li key={`pending-${i}`} className="aspect-[4/5] rounded-md skeleton" aria-label={t.admin.common.uploading} />
        ))}
        <li>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={pending > 0}
            className="flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-ink-faint/60 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:cursor-wait"
          >
            <UploadIcon size={22} />
            {pending > 0 ? t.admin.common.uploading : p.addPhotos}
          </button>
        </li>
      </ul>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <p className="field-hint">{photos.length === 0 && pending === 0 ? `${p.noPhotos} ` : ""}{p.photosHelp}</p>
      {errors.map((e) => (
        <p key={e} className="field-error">
          {e}
        </p>
      ))}
    </div>
  );
}

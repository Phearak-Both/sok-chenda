"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { mediaSrcSet, mediaUrl } from "@/lib/media-url";
import type { Media } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "../icons";

export function ProductGallery({ images, alt }: { images: Media[]; alt: string }) {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const target = Math.max(0, Math.min(images.length - 1, i));
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
  };

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-cream text-sm text-ink-faint">
        {t.product.noImage}
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-4">
      {images.length > 1 && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto md:w-20 md:shrink-0 md:flex-col md:overflow-visible">
          {images.map((m, i) => (
            <li key={m.id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={fmt(t.product.imageOf, { n: i + 1, total: images.length })}
                aria-current={i === index}
                className={`block aspect-[4/5] w-16 cursor-pointer overflow-hidden bg-cream transition-opacity md:w-20 ${
                  i === index ? "opacity-100 ring-1 ring-ink ring-offset-2 ring-offset-ivory" : "opacity-55 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(m, 160)} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative min-w-0 flex-1">
        <div
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-roledescription="carousel"
          aria-label={alt}
        >
          {images.map((m, i) => (
            <div
              key={m.id}
              className="aspect-[4/5] w-full shrink-0 snap-center bg-cream"
              role="group"
              aria-roledescription="slide"
              aria-label={fmt(t.product.imageOf, { n: i + 1, total: images.length })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(m, 960)}
                srcSet={mediaSrcSet(m)}
                sizes="(min-width: 768px) 55vw, 100vw"
                alt={i === 0 ? alt : ""}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label={t.product.prevImage}
              className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-ivory/85 transition-opacity hover:bg-ivory disabled:opacity-0 md:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === images.length - 1}
              aria-label={t.product.nextImage}
              className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-ivory/85 transition-opacity hover:bg-ivory disabled:opacity-0 md:flex"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden" aria-hidden="true">
              {images.map((m, i) => (
                <span
                  key={m.id}
                  className={`h-1 rounded-full transition-all ${i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/30"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

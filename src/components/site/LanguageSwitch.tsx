"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/preferences";
import { useI18n } from "@/i18n/client";
import type { Locale } from "@/lib/types";

const OPTIONS: { value: Locale; label: string; lang: string }[] = [
  { value: "en", label: "EN", lang: "en" },
  { value: "km", label: "ខ្មែរ", lang: "km" },
];

export function LanguageSwitch({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (value: Locale) => {
    if (value === locale) return;
    startTransition(async () => {
      await setLocale(value);
      router.refresh();
    });
  };

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={`flex items-center gap-2 text-[0.8125rem] ${pending ? "opacity-60" : ""} ${className}`}
    >
      {OPTIONS.map((o, i) => (
        <span key={o.value} className="flex items-center gap-2">
          {i > 0 && <span className={tone === "dark" ? "text-ink-faint" : "text-ivory/40"}>|</span>}
          <button
            type="button"
            lang={o.lang}
            onClick={() => choose(o.value)}
            aria-pressed={locale === o.value}
            disabled={pending}
            className={`min-h-8 cursor-pointer px-0.5 transition-colors ${
              locale === o.value
                ? tone === "dark"
                  ? "font-medium text-ink"
                  : "font-medium text-ivory"
                : tone === "dark"
                  ? "text-ink-soft hover:text-ink"
                  : "text-ivory/60 hover:text-ivory"
            }`}
          >
            {o.label}
          </button>
        </span>
      ))}
    </div>
  );
}

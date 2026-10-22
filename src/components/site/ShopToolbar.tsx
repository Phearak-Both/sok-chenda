"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useI18n } from "@/i18n/client";
import { gradeLabel, metalLabel, PLATINUM_GRADES, PLATINUM_LABEL } from "@/lib/metal";
import { CheckIcon, ChevronDown, SearchIcon } from "../icons";

type Option = { value: string; label: string };

export function ShopToolbar() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const metal = params.get("metal") ?? "";
  const platinumActive = metal === "platinum" || metal.startsWith("platinum_");
  const chip = (active: boolean, small = false) =>
    `inline-flex cursor-pointer items-center rounded-full border transition-colors ${
      small ? "min-h-9 px-4 text-[0.8125rem]" : "min-h-10 px-5 text-sm"
    } ${active ? "border-ink bg-ink text-ivory" : "border-line hover:border-ink"}`;

  const hasFilters = ["q", "collection", "sort", "category", "metal"].some((k) => params.get(k));

  const select = (name: string, label: string, options: Option[]) => (
    <label className="relative flex min-w-0 basis-full flex-col gap-1 sm:basis-auto">
      <span className="eyebrow text-ink-faint">{label}</span>
      <select
        value={params.get(name) ?? ""}
        onChange={(e) => update({ [name]: e.target.value })}
        className="min-h-10 w-full cursor-pointer appearance-none border-b border-line bg-transparent pr-6 text-sm outline-none focus:border-ink sm:w-48"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute bottom-3 right-0 text-ink-faint" />
    </label>
  );

  return (
    <div className={`transition-opacity ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: q.trim() });
          }}
          className="flex w-full items-center gap-3 border-b border-ink/70 lg:max-w-sm"
        >
          <SearchIcon size={18} className="shrink-0 text-ink-faint" />
          <input
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.shop.searchPlaceholder}
            aria-label={t.nav.search}
            className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-faint"
          />
          <button type="submit" className="eyebrow cursor-pointer py-2 text-ink-soft hover:text-ink">
            {t.nav.search}
          </button>
        </form>
        <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
          {/* Metal: kilo gold, or platinum, which then offers its grades below. */}
          <div className="flex flex-col gap-1">
            <span className="eyebrow text-ink-faint">{t.shop.metal}</span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["", t.shop.any],
                  ["kilo", metalLabel("kilo", locale)],
                ] as const
              ).map(([value, label]) => (
                <button key={value || "any"} type="button" aria-pressed={metal === value} onClick={() => update({ metal: value })} className={chip(metal === value)}>
                  {label}
                </button>
              ))}
              <PlatinumMenu value={metal} onChange={(v) => update({ metal: v })} className={chip(platinumActive)} />
            </div>
          </div>
          {select("sort", t.shop.weight, [
            { value: "", label: t.shop.any },
            { value: "weight_asc", label: t.shop.sortWeightAsc },
            { value: "weight_desc", label: t.shop.sortWeightDesc },
          ])}
        </div>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            startTransition(() => router.push(pathname, { scroll: false }));
          }}
          className="eyebrow link-line mt-6 cursor-pointer text-ink-soft"
        >
          {t.shop.clear}
        </button>
      )}
    </div>
  );
}

/**
 * Platinum comes in several grades (ទឹក), so its chip opens a small menu instead of
 * filtering straight away. The chip shows the chosen grade, e.g. "ផ្លាទីន · ទឹក 7".
 */
function PlatinumMenu({ value, onChange, className }: { value: string; onChange: (v: string) => void; className: string }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const grade = PLATINUM_GRADES.find((g) => g === value);
  const options = [
    { value: "platinum", label: t.shop.allPlatinum },
    ...PLATINUM_GRADES.map((g) => ({ value: g, label: gradeLabel(g, locale) })),
  ];

  return (
    <div ref={root} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`${className} gap-2`}>
        {PLATINUM_LABEL[locale]}
        {grade && <span className="opacity-75">· {gradeLabel(grade, locale)}</span>}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={PLATINUM_LABEL[locale]}
          className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-line bg-ivory p-1.5 shadow-[0_12px_32px_-12px_rgb(26_23_20/0.25)] lg:left-0 lg:right-auto"
        >
          {options.map((o) => {
            const checked = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                onClick={() => {
                  setOpen(false);
                  onChange(o.value);
                }}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-cream ${
                  checked ? "font-medium" : ""
                }`}
              >
                {o.label}
                {checked && <CheckIcon size={15} className="text-gold" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/i18n/en";
import { fmt } from "@/i18n/format";
import { parsePrice, type PriceCurrency } from "@/lib/prices";
import type { Locale } from "@/lib/types";

export type PriceFormMetal = {
  key: string;
  label: Record<Locale, string>;
  sell: number | null;
  buy: number | null;
};

type Text = Dictionary["telegram"]["app"];
type Field = "sell" | "buy";
type Status = "loading" | "ready" | "outside" | "notAllowed" | "saving" | "saved";

/** The parts of Telegram's Mini App API this form uses (https://core.telegram.org/bots/webapps). */
type WebApp = {
  initData: string;
  initDataUnsafe: { user?: { id: number; language_code?: string } };
  ready(): void;
  expand(): void;
  close(): void;
  MainButton: {
    setText(text: string): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
    onClick(fn: () => void): void;
    offClick(fn: () => void): void;
  };
  HapticFeedback?: { notificationOccurred(type: "error" | "success" | "warning"): void };
};

const telegram = () => (globalThis as { Telegram?: { WebApp?: WebApp } }).Telegram?.WebApp;
const toInput = (n: number | null) => (n === null ? "" : String(n));

/** The language picked with the switch, kept on this device; otherwise Telegram's language is used. */
const LOCALE_KEY = "telegram-form-locale";
const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "km", label: "ខ្មែរ" },
];
function savedLocale(): Locale | null {
  try {
    const v = localStorage.getItem(LOCALE_KEY);
    return v === "en" || v === "km" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Price form that opens inside Telegram. It follows the user's Telegram theme (Telegram sets the
 * --tg-theme-* colours) and language, and publishes with Telegram's own main button.
 */
export function PriceForm({
  metals,
  currency,
  text,
  subtitle,
  updated,
}: {
  metals: PriceFormMetal[];
  currency: PriceCurrency;
  text: Record<Locale, Text>;
  subtitle: Record<Locale, string>;
  updated: Record<Locale, string> | null;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  const [status, setStatus] = useState<Status>("loading");
  const [userId, setUserId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [initial, setInitial] = useState(() =>
    Object.fromEntries(metals.map((m) => [m.key, { sell: m.sell, buy: m.buy }])),
  );
  const [values, setValues] = useState(() =>
    Object.fromEntries(metals.map((m) => [m.key, { sell: toInput(m.sell), buy: toInput(m.buy) }])),
  );
  const [showErrors, setShowErrors] = useState(false);
  const t = text[locale];

  const parsed = useMemo(
    () =>
      Object.fromEntries(
        metals.map((m) => [
          m.key,
          { sell: parsePrice(values[m.key].sell, currency), buy: parsePrice(values[m.key].buy, currency) },
        ]),
      ),
    [metals, values, currency],
  );
  const isInvalid = (key: string, field: Field) => parsed[key][field] === "invalid";
  const isChanged = (key: string, field: Field) =>
    !isInvalid(key, field) && parsed[key][field] !== initial[key][field];
  const changedCount = metals.filter((m) => isChanged(m.key, "sell") || isChanged(m.key, "buy")).length;
  const anyInvalid = metals.some((m) => isInvalid(m.key, "sell") || isInvalid(m.key, "buy"));

  // Telegram's script is loaded below; set up once it's ready.
  const init = useCallback(async () => {
    const app = telegram();
    if (!app?.initData) {
      setStatus("outside");
      return;
    }
    app.ready();
    app.expand();
    const user = app.initDataUnsafe.user;
    setLocale(savedLocale() ?? (user?.language_code?.startsWith("km") ? "km" : "en"));
    setUserId(user?.id ?? null);
    const res = await fetch("/api/telegram/app", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: app.initData, check: true }),
    }).catch(() => null);
    setStatus(res?.ok ? "ready" : res?.status === 403 ? "notAllowed" : "outside");
  }, []);

  const publish = useCallback(async () => {
    const app = telegram();
    if (!app || status !== "ready") return;
    if (anyInvalid) {
      setShowErrors(true);
      setMessage(t.invalid);
      app.HapticFeedback?.notificationOccurred("error");
      return;
    }
    setStatus("saving");
    setMessage(null);
    app.MainButton.showProgress();
    const res = await fetch("/api/telegram/app", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: app.initData, prices: values, locale }),
    }).catch(() => null);
    app.MainButton.hideProgress();
    if (!res?.ok) {
      setStatus("ready");
      setMessage(t.failed);
      app.HapticFeedback?.notificationOccurred("error");
      return;
    }
    setStatus("saved");
    setInitial(
      Object.fromEntries(
        metals.map((m) => [
          m.key,
          { sell: parsed[m.key].sell as number | null, buy: parsed[m.key].buy as number | null },
        ]),
      ),
    );
    app.HapticFeedback?.notificationOccurred("success");
    setTimeout(() => app.close(), 900);
  }, [anyInvalid, locale, metals, parsed, status, t, values]);

  // Keep Telegram's main button in step with the form. It holds one click handler at a time.
  const publishRef = useRef(publish);
  publishRef.current = publish;
  useEffect(() => {
    const app = telegram();
    if (!app) return;
    const onClick = () => publishRef.current();
    const button = app.MainButton;
    if (status === "ready" || status === "saving" || status === "saved") {
      button.setText(status === "saved" ? t.published : status === "saving" ? t.publishing : t.publish);
      if (status === "ready") button.enable();
      else button.disable();
      button.show();
      button.onClick(onClick);
    } else {
      button.hide();
    }
    return () => button.offClick(onClick);
  }, [status, t]);

  const chooseLocale = (value: Locale) => {
    setLocale(value);
    try {
      localStorage.setItem(LOCALE_KEY, value);
    } catch {}
  };

  const symbol = currency === "KHR" ? "៛" : "$";
  const disabled = status !== "ready";
  const notice =
    status === "outside" ? t.outsideTelegram : status === "notAllowed" ? fmt(t.notAllowed, { id: userId ?? "?" }) : message;

  return (
    <div
      lang={locale}
      className="min-h-dvh px-4 pb-10 pt-5 text-[15px]"
      style={{
        background: "var(--tg-theme-secondary-bg-color, var(--color-cream))",
        color: "var(--tg-theme-text-color, var(--color-ink))",
      }}
    >
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onReady={() => void init()} />

      <header className="mb-4 flex items-start justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <p className="text-sm" style={{ color: "var(--tg-theme-hint-color, var(--color-ink-faint))" }}>
            {subtitle[locale]}
            {updated && ` · ${fmt(t.lastUpdated, { date: updated[locale] })}`}
          </p>
        </div>
        <div
          role="group"
          aria-label={t.language}
          className="flex shrink-0 rounded-full p-0.5 text-sm"
          style={{ background: "var(--tg-theme-section-bg-color, var(--tg-theme-bg-color, #fff))" }}
        >
          {LOCALES.map((o) => {
            const active = locale === o.value;
            return (
              <button
                key={o.value}
                type="button"
                lang={o.value}
                aria-pressed={active}
                onClick={() => chooseLocale(o.value)}
                className="min-h-8 min-w-11 cursor-pointer rounded-full px-3 font-medium transition-colors"
                style={
                  active
                    ? {
                        background: "var(--tg-theme-button-color, var(--color-gold))",
                        color: "var(--tg-theme-button-text-color, #fff)",
                      }
                    : { color: "var(--tg-theme-hint-color, var(--color-ink-faint))" }
                }
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </header>

      {notice && (
        <p
          role={status === "ready" ? "alert" : undefined}
          className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{
            background: "var(--tg-theme-section-bg-color, #fff)",
            color:
              status === "ready" ? "var(--tg-theme-destructive-text-color, var(--color-danger))" : "inherit",
          }}
        >
          {notice}
        </p>
      )}

      <ul className="space-y-3">
        {metals.map((m) => (
          <li
            key={m.key}
            className="rounded-xl px-4 pb-4 pt-3"
            style={{ background: "var(--tg-theme-section-bg-color, var(--tg-theme-bg-color, #fff))" }}
          >
            <p className="mb-2 font-medium">{m.label[locale]}</p>
            <div className="grid grid-cols-2 gap-3">
              {(["sell", "buy"] as const).map((field) => {
                const invalid = showErrors && isInvalid(m.key, field);
                const changed = isChanged(m.key, field);
                const before = initial[m.key][field];
                return (
                  <label key={field} className="block">
                    <span
                      className="mb-1 block text-xs"
                      style={{ color: "var(--tg-theme-hint-color, var(--color-ink-faint))" }}
                    >
                      {field === "sell" ? t.sell : t.buy}
                      {changed && before !== null && <span className="ml-1 line-through opacity-70">{symbol}{before}</span>}
                    </span>
                    <span
                      className="flex items-center rounded-lg border-2 px-3 transition-colors"
                      style={{
                        borderColor: invalid
                          ? "var(--tg-theme-destructive-text-color, var(--color-danger))"
                          : changed
                            ? "var(--tg-theme-button-color, var(--color-gold))"
                            : "var(--tg-theme-section-separator-color, var(--color-line))",
                        background: "var(--tg-theme-bg-color, #fff)",
                      }}
                    >
                      <span aria-hidden="true" style={{ color: "var(--tg-theme-hint-color, var(--color-ink-faint))" }}>
                        {symbol}
                      </span>
                      <input
                        inputMode="decimal"
                        enterKeyHint="next"
                        autoComplete="off"
                        aria-label={`${m.label[locale]} · ${field === "sell" ? t.sell : t.buy}`}
                        aria-invalid={invalid || undefined}
                        disabled={disabled}
                        value={values[m.key][field]}
                        onChange={(e) => {
                          const v = e.target.value;
                          setValues((prev) => ({ ...prev, [m.key]: { ...prev[m.key], [field]: v } }));
                          if (message) setMessage(null);
                        }}
                        onFocus={(e) => e.currentTarget.select()}
                        className="h-11 w-full min-w-0 bg-transparent pl-1.5 text-lg font-medium tabular-nums outline-none disabled:opacity-60"
                      />
                    </span>
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      {changedCount > 0 && status === "ready" && (
        <div className="mt-4 flex items-center justify-between px-1 text-sm">
          <span style={{ color: "var(--tg-theme-hint-color, var(--color-ink-faint))" }}>
            {fmt(t.changed, { n: changedCount })}
          </span>
          <button
            type="button"
            onClick={() => {
              setValues(
                Object.fromEntries(
                  metals.map((m) => [m.key, { sell: toInput(initial[m.key].sell), buy: toInput(initial[m.key].buy) }]),
                ),
              );
              setShowErrors(false);
              setMessage(null);
            }}
            className="cursor-pointer font-medium"
            style={{ color: "var(--tg-theme-link-color, var(--color-gold))" }}
          >
            {t.undo}
          </button>
        </div>
      )}
    </div>
  );
}

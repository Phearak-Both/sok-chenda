"use client";

import { useI18n } from "@/i18n/client";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="container-x flex flex-col items-center py-32 text-center">
      <span className="rule-gold" />
      <h1 className="display mt-8 text-4xl">{t.errors.errorTitle}</h1>
      <p className="mt-4 text-ink-soft">{t.errors.errorBody}</p>
      <button type="button" onClick={reset} className="btn btn-dark mt-10">
        {t.errors.retry}
      </button>
    </div>
  );
}

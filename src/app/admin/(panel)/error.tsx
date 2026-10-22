"use client";

import { useI18n } from "@/i18n/client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <h1 className="text-lg font-semibold">{t.errors.errorTitle}</h1>
      <p className="mt-2 text-sm text-ink-soft">{t.errors.errorBody}</p>
      <button type="button" onClick={reset} className="abtn abtn-primary mt-6">
        {t.errors.retry}
      </button>
    </div>
  );
}

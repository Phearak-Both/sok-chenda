import type { Locale } from "@/lib/types";
import { formatGrams, formatWeightEn, formatWeightKm } from "@/lib/weight";

/** Weight in traditional units for the visitor's language, with grams as secondary text. */
export function WeightTag({
  grams,
  locale,
  className,
  detailed,
}: {
  grams: number;
  locale: Locale;
  className?: string;
  /** Product page: grams go on their own line. */
  detailed?: boolean;
}) {
  return (
    <span className={className}>
      <span lang={locale}>{locale === "km" ? formatWeightKm(grams) : formatWeightEn(grams)}</span>
      {detailed ? (
        <span className="mt-1 block font-sans text-[0.8125rem] text-ink-faint">{formatGrams(grams, locale)}</span>
      ) : (
        <span className="text-ink-faint"> · {formatGrams(grams, locale)}</span>
      )}
    </span>
  );
}

import type { Locale } from "@/lib/types";
import { formatWeight } from "@/lib/weight";

/** Weight for the visitor's language: ដំឡឹង / ជី / ហ៊ុន in Khmer, grams in English. */
export function WeightTag({ grams, locale, className }: { grams: number; locale: Locale; className?: string }) {
  return (
    <span lang={locale} className={className}>
      {formatWeight(grams, locale)}
    </span>
  );
}

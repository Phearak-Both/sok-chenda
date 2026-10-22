import Link from "next/link";
import type { Dictionary } from "@/i18n/en";
import { fmt } from "@/i18n/format";
import { metalLabel } from "@/lib/metal";
import { formatPrice, formatUpdated, priceRows } from "@/lib/prices";
import { getSetting } from "@/lib/settings";
import { formatGrams, GRAMS_PER } from "@/lib/weight";
import type { Locale } from "@/lib/types";
import { Marquee } from "./Marquee";

/** Slim bar above the header with the prices the owner entered in the dashboard. */
export function PriceTicker({ t, locale }: { t: Dictionary; locale: Locale }) {
  const prices = getSetting("prices");
  const rows = priceRows(prices);
  const unit = fmt(t.ticker.per, { unit: formatGrams(GRAMS_PER[prices.unit], locale) });

  return (
    <aside aria-label={t.ticker.label} className="relative z-[41] border-b border-gold/25 bg-night text-[0.8125rem] text-ivory/80">
      <div className="flex h-9 items-center">
        <p className="flex shrink-0 items-center gap-2 pl-4 pr-4 font-medium text-gold-light md:pl-8 xl:pl-14">
          <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-gold-light" />
          {t.ticker.label}
        </p>

        {rows.length === 0 || !prices.updatedAt ? (
          <Link href="/contact" className="min-w-0 truncate pr-4 text-ivory/70 transition-colors hover:text-ivory">
            {t.ticker.empty}
          </Link>
        ) : (
          <Marquee
            pauseOnHover
            className="h-full min-w-0 flex-1 items-center [--duration:45s] [--gap:2.5rem] [mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)] motion-reduce:[mask-image:none]"
          >
            {rows.map((r) => (
              <span key={r.metal} className="flex shrink-0 items-center gap-3 whitespace-nowrap">
                <span className="text-ivory">{metalLabel(r.metal, locale)}</span>
                {r.buy !== null && (
                  <span>
                    {t.ticker.buy} <span className="font-medium text-gold-light">{formatPrice(r.buy, prices.currency)}</span>
                  </span>
                )}
                {r.sell !== null && (
                  <span>
                    {t.ticker.sell} <span className="font-medium text-gold-light">{formatPrice(r.sell, prices.currency)}</span>
                  </span>
                )}
                <span className="text-ivory/45">{unit}</span>
                <span aria-hidden="true" className="ml-7 h-1 w-1 rotate-45 bg-gold/60" />
              </span>
            ))}
            <span className="shrink-0 whitespace-nowrap pr-7 text-ivory/50">
              {fmt(t.ticker.updated, { date: formatUpdated(prices.updatedAt, locale) })}
            </span>
          </Marquee>
        )}
      </div>
    </aside>
  );
}

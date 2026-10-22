import Link from "next/link";
import type { Dictionary } from "@/i18n/en";
import { pick, pickLang, type Locale, type Product } from "@/lib/types";
import { Picture } from "./Picture";
import { WeightTag } from "./WeightTag";

type Props = {
  product: Product;
  locale: Locale;
  t: Dictionary;
  priority?: boolean;
  sizes?: string;
};

export function ProductCard({ product, locale, t, priority, sizes }: Props) {
  const name = pick(product.name, locale);
  const [first, second] = product.images;
  const imgSizes = sizes ?? "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-cream">
        {first ? (
          <>
            <Picture
              media={first}
              alt={name}
              sizes={imgSizes}
              priority={priority}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
            />
            {second && (
              <Picture
                media={second}
                alt=""
                sizes={imgSizes}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-faint">{t.product.noImage}</div>
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.isSample && (
            <span className="bg-ivory/90 px-2.5 py-1 text-[0.6875rem] tracking-wide text-ink-soft">
              {t.product.sample}
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 space-y-1 pr-2">
        <h3 lang={pickLang(product.name, locale)} className="display text-[1.2rem] leading-snug md:text-[1.35rem]">
          {name}
        </h3>
        {product.weightGrams !== null && (
          <p className="text-sm text-ink-soft">
            <WeightTag grams={product.weightGrams} locale={locale} />
          </p>
        )}
      </div>
    </Link>
  );
}

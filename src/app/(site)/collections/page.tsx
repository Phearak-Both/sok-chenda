import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { ShopToolbar } from "@/components/site/ShopToolbar";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { listCategories, listProducts, type ProductSort } from "@/lib/catalog";
import { getSiteContext } from "@/lib/site";
import { parseMetalFilter } from "@/lib/metal";
import { pick } from "@/lib/types";

const PAGE_SIZE = 24;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.shop.title };
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const { t, locale } = await getSiteContext();

  const categories = listCategories().filter((c) => c.productCount > 0);
  const category = categories.find((c) => c.slug === str("category"));
  const metal = parseMetalFilter(str("metal"));
  const sort = (["weight_asc", "weight_desc"] as const).find((s) => s === str("sort")) as ProductSort | undefined;
  const q = str("q").slice(0, 100);
  const page = Math.max(1, Number.parseInt(str("page")) || 1);

  const { items, total } = listProducts({
    q,
    categoryId: category?.id,
    metal,
    sort,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(q || category || metal);

  const linkWith = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) next.set(k, v);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    return qs ? `/collections?${qs}` : "/collections";
  };

  const title = category ? pick(category.name, locale) : t.shop.title;

  return (
    <div className="container-x pb-24 pt-10 md:pt-16">
      <header className="text-center">
        <p className="eyebrow text-gold">{total === 1 ? t.count.piece : fmt(t.count.pieces, { n: total })}</p>
        <h1 className="display mt-3 text-[2.5rem] md:text-6xl">{title}</h1>
        {q && <p className="mt-3 text-ink-soft">{fmt(t.shop.searchFor, { q })}</p>}
      </header>

      {categories.length > 0 && (
        <nav aria-label={t.shop.category} className="no-scrollbar -mx-4 mt-10 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex min-w-max justify-center gap-2 md:min-w-0 md:flex-wrap">
            {[{ slug: "", label: t.shop.all }, ...categories.map((c) => ({ slug: c.slug, label: pick(c.name, locale) }))].map(
              (c) => {
                const active = (category?.slug ?? "") === c.slug;
                return (
                  <li key={c.slug || "all"}>
                    <Link
                      href={linkWith({ category: c.slug || undefined, page: undefined })}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex min-h-10 items-center rounded-full border px-5 text-sm transition-colors ${
                        active ? "border-ink bg-ink text-ivory" : "border-line hover:border-ink"
                      }`}
                    >
                      {c.label}
                    </Link>
                  </li>
                );
              },
            )}
          </ul>
        </nav>
      )}

      <div className="mt-10 border-y border-line py-6">
        <Suspense>
          <ShopToolbar />
        </Suspense>
      </div>

      {items.length > 0 ? (
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-6 md:gap-y-16 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              locale={locale}
              t={t}
              priority={i < 4}
            />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-md py-24 text-center">
          <span className="rule-gold mx-auto" />
          <h2 className="display mt-8 text-3xl">{filtered ? t.shop.emptyTitle : t.shop.emptyCatalogue}</h2>
          {filtered && (
            <>
              <p className="mt-4 text-ink-soft">{t.shop.emptyBody}</p>
              <Link href="/collections" className="btn btn-outline mt-8">
                {t.shop.clear}
              </Link>
            </>
          )}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-20 flex items-center justify-center gap-6 text-sm" aria-label="Pagination">
          {page > 1 ? (
            <Link className="eyebrow link-line" href={linkWith({ page: String(page - 1) })}>
              {t.shop.prev}
            </Link>
          ) : (
            <span className="eyebrow text-ink-faint">{t.shop.prev}</span>
          )}
          <span className="text-ink-soft">{fmt(t.shop.page, { n: page, total: pages })}</span>
          {page < pages ? (
            <Link className="eyebrow link-line" href={linkWith({ page: String(page + 1) })}>
              {t.shop.next}
            </Link>
          ) : (
            <span className="eyebrow text-ink-faint">{t.shop.next}</span>
          )}
        </nav>
      )}
    </div>
  );
}

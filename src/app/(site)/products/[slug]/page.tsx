import type { Metadata } from "next";
import { metalLabel } from "@/lib/metal";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components/icons";
import { InquiryPanel } from "@/components/site/InquiryPanel";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductGallery } from "@/components/site/ProductGallery";
import { WeightTag } from "@/components/site/WeightTag";
import { fmt } from "@/i18n/format";
import { getLocale } from "@/i18n/server";
import { getOwner } from "@/lib/auth";
import { getProductBySlug, getRelatedProducts, listCategories } from "@/lib/catalog";
import { mediaUrl } from "@/lib/media-url";
import { getSiteContext, getSiteUrl } from "@/lib/site";
import { pick, pickLang } from "@/lib/types";

type Params = Promise<{ slug: string }>;

async function loadProduct(slug: string) {
  const product = getProductBySlug(decodeURIComponent(slug));
  if (!product) return null;
  // Drafts and archived products are visible only to the signed-in owner, as a preview.
  if (product.status !== "published" && !(await getOwner())) return null;
  return product;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await loadProduct((await params).slug);
  if (!product) return {};
  const locale = await getLocale();
  return {
    title: pick(product.name, locale),
    description: pick(product.description, locale).slice(0, 160) || undefined,
    openGraph: product.images[0] ? { images: [mediaUrl(product.images[0], 1200)] } : undefined,
    robots: product.status === "published" ? undefined : { index: false },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await loadProduct((await params).slug);
  if (!product) notFound();

  const { t, locale, store } = await getSiteContext();
  const category = listCategories().find((c) => c.id === product.categoryId);
  const related = product.status === "published" ? getRelatedProducts(product, 4) : [];

  const name = pick(product.name, locale);
  const description = pick(product.description, locale);
  const material = pick(product.material, locale);
  const url = `${await getSiteUrl()}/products/${product.slug}`;
  const message = fmt(t.product.inquiryMessage, { name, url });

  return (
    <>
      {product.status !== "published" && (
        <div className="bg-gold text-ivory">
          <div className="container-x flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span>{product.status === "archived" ? t.product.previewArchived : t.product.previewDraft}</span>
            <Link href={`/admin/products/${product.id}`} className="underline underline-offset-4">
              {t.product.editInDashboard}
            </Link>
          </div>
        </div>
      )}

      <div className="container-x pb-20 pt-6 md:pb-28 md:pt-10">
        <nav className="mb-6 flex items-center gap-2 text-[0.8125rem] text-ink-soft md:mb-10" aria-label="Breadcrumb">
          <Link href="/collections" className="link-line inline-flex items-center gap-2">
            <ArrowLeft size={14} /> {t.nav.collections}
          </Link>
          {category && (
            <>
              <span className="text-ink-faint">/</span>
              <Link href={`/collections?category=${category.slug}`} className="link-line">
                {pick(category.name, locale)}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-10 md:grid-cols-12 md:gap-12 xl:gap-20">
          <div className="-mx-4 md:col-span-7 md:mx-0">
            <ProductGallery images={product.images} alt={name} />
          </div>

          <div className="md:col-span-5">
            <div className="md:sticky md:top-28">
              {product.isSample && (
                <p className="mb-6 border border-line bg-cream px-4 py-3 text-[0.8125rem] text-ink-soft">
                  <span className="eyebrow mr-2 text-gold">{t.product.sample}</span>
                  {t.product.sampleNote}
                </p>
              )}
              {category && <p className="eyebrow text-gold">{pick(category.name, locale)}</p>}
              <h1 lang={pickLang(product.name, locale)} className="display mt-3 text-[2.25rem] md:text-5xl">
                {name}
              </h1>

              {product.weightGrams !== null && (
                <div className="mt-5">
                  <p className="eyebrow text-ink-faint">{t.product.weight}</p>
                  <WeightTag grams={product.weightGrams} locale={locale} className="mt-1 block text-xl md:text-2xl" />
                </div>
              )}

              {description && (
                <div
                  lang={pickLang(product.description, locale)}
                  className="prose-luxe mt-8 border-t border-line pt-8 text-[0.975rem] leading-relaxed text-ink-soft"
                >
                  {description.split(/\n{2,}/).map((para, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>
              )}

              <section className="mt-8 bg-cream/70 p-5 md:p-6" aria-labelledby="inquire">
                <h2 id="inquire" className="display text-2xl">
                  {t.product.inquireTitle}
                </h2>
                <p className="mb-5 mt-2 text-sm text-ink-soft">{t.product.inquireBody}</p>
                <InquiryPanel message={message} whatsapp={store.whatsapp} telegram={store.telegram} phone={store.phone} />
              </section>

              {(material || product.metalType || product.weightGrams !== null || category) && (
                <section className="mt-8" aria-labelledby="details">
                  <h2 id="details" className="eyebrow text-ink-faint">
                    {t.product.details}
                  </h2>
                  <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
                    {material && (
                      <div className="flex justify-between gap-6 py-3">
                        <dt className="text-ink-soft">{t.product.material}</dt>
                        <dd className="text-right">{material}</dd>
                      </div>
                    )}
                    {product.metalType && (
                      <div className="flex justify-between gap-6 py-3">
                        <dt className="text-ink-soft">{t.product.metal}</dt>
                        <dd className="text-right">{metalLabel(product.metalType, locale)}</dd>
                      </div>
                    )}
                    {product.weightGrams !== null && (
                      <div className="flex justify-between gap-6 py-3">
                        <dt className="text-ink-soft">{t.product.weight}</dt>
                        <dd className="text-right">
                          <WeightTag grams={product.weightGrams} locale={locale} />
                        </dd>
                      </div>
                    )}
                    {category && (
                      <div className="flex justify-between gap-6 py-3">
                        <dt className="text-ink-soft">{t.product.category}</dt>
                        <dd className="text-right">
                          <Link className="link-line" href={`/collections?category=${category.slug}`}>
                            {pick(category.name, locale)}
                          </Link>
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line bg-cream/60 py-20 md:py-24">
          <div className="container-x">
            <h2 className="display text-center text-[2rem] md:text-[2.75rem]">{t.product.related}</h2>
            <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-6 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} t={t} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

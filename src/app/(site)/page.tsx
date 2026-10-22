import Link from "next/link";
import { Fragment } from "react";
import { ArrowRight } from "@/components/icons";
import { Picture } from "@/components/site/Picture";
import { ProductCard } from "@/components/site/ProductCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { listCategories, listProducts } from "@/lib/catalog";
import { hasDirectContact } from "@/lib/contact";
import { mapEmbedSrc } from "@/lib/maps";
import { getMedia } from "@/lib/media";
import { getSetting } from "@/lib/settings";
import { getSiteContext } from "@/lib/site";
import { pick, pickLang } from "@/lib/types";

export default async function HomePage() {
  const { t, locale, store } = await getSiteContext();
  const home = getSetting("home");
  const heroImage = getMedia(home.hero.imageId);
  const storyImage = getMedia(home.story.imageId);

  let featured = listProducts({ featured: true, limit: 8 }).items;
  if (featured.length === 0) featured = listProducts({ sort: "newest", limit: 8 }).items;
  const categories = listCategories().filter((c) => c.productCount > 0);

  const L = (text: Parameters<typeof pick>[0]) => ({ children: pick(text, locale), lang: pickLang(text, locale) });
  const heroTitle = L(home.hero.title);
  const introTitle = L(home.intro.title);
  const address = pick(store.address, locale);
  const hours = pick(store.hours, locale);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative isolate flex min-h-[82svh] items-end overflow-hidden bg-night text-ivory md:min-h-[min(88svh,56rem)]">
        {heroImage ? (
          <Picture
            media={heroImage}
            alt=""
            sizes="100vw"
            priority
            className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_40%]"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/brand/cover-1600.webp"
            srcSet="/brand/cover-960.webp 960w, /brand/cover-1600.webp 1600w, /brand/cover-2400.webp 2400w"
            sizes="100vw"
            alt=""
            fetchPriority="high"
            className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_40%]"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night/90 via-night/35 to-night/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night/60 to-transparent md:via-transparent" />

        <div className="container-x pb-14 md:pb-24">
          <div className="@container fade-up w-full max-w-3xl">
            <p className="eyebrow text-gold-light" {...L(home.hero.eyebrow)} />
            {/* Sized to the column (cqw) so the current headline sets in two balanced lines;
                Khmer runs wider than Latin, so it scales against its longest phrase. */}
            <h1
              lang={heroTitle.lang}
              className="display mt-5 text-balance text-ivory text-[min(2.75rem,calc(100cqw/9.95))] sm:text-[min(3.75rem,calc(100cqw/9.95))] md:text-[min(4.5rem,calc(100cqw/9.95))] [&:lang(km)]:text-[min(4rem,calc(100cqw/11.9))]"
            >
              <Phrases {...heroTitle} />
            </h1>
            <p className="mt-6 max-w-lg text-base text-ivory/80 md:text-lg" {...L(home.hero.subtitle)} />
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/collections" className="btn btn-light">
                <span {...L(home.hero.cta)} />
                <ArrowRight size={16} />
              </Link>
              {hasDirectContact(store) && (
                <Link href="/contact" className="btn btn-outline border-ivory/50 text-ivory hover:border-ivory hover:bg-ivory hover:text-ink">
                  {t.home.contactUs}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Introduction ---------- */}
      <section className="container-x py-20 md:py-32">
        <div className="@container mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="rule-gold" />
          <h2
            lang={introTitle.lang}
            className="display mt-8 text-balance text-[2.25rem] md:text-[3.25rem] [&:lang(km)]:text-[min(3.25rem,calc(100cqw/13.1))]"
          >
            <Phrases {...introTitle} />
          </h2>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-ink-soft md:text-lg" {...L(home.intro.body)} />
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      {categories.length > 0 && (
        <section className="pb-20 md:pb-28">
          <div className="container-x">
            <SectionHeading title={t.home.categoriesTitle} link={{ href: "/collections", label: t.home.viewAll }} />
          </div>
          <div className="md:container-x">
          <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 md:grid md:gap-5 md:overflow-visible md:px-0 md:[grid-template-columns:repeat(auto-fit,minmax(0,1fr))]">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/collections?category=${c.slug}`}
                className="group relative block aspect-[3/4] w-[62vw] shrink-0 snap-start overflow-hidden bg-cream sm:w-[38vw] md:w-auto"
              >
                {c.cover && (
                  <Picture
                    media={c.cover}
                    alt=""
                    sizes="(min-width: 768px) 20vw, 62vw"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/0 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                  <h3 className="display text-2xl" {...L(c.name)} />
                  <p className="eyebrow mt-1 text-ivory/70">
                    {c.productCount === 1 ? t.count.piece : t.count.pieces.replace("{n}", String(c.productCount))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          </div>
        </section>
      )}

      {/* ---------- Featured ---------- */}
      <section className="border-t border-line bg-cream/60 py-20 md:py-28">
        <div className="container-x">
          <SectionHeading
            eyebrow={t.home.featuredEyebrow}
            title={t.home.featuredTitle}
            link={{ href: "/collections", label: t.home.viewAll }}
          />
          {featured.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:mt-14 md:gap-x-6 md:gap-y-14 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} locale={locale} t={t} />
              ))}
            </div>
          ) : (
            <p className="mt-10 text-ink-soft">{t.shop.emptyCatalogue}</p>
          )}
          <div className="mt-12 text-center sm:hidden">
            <Link href="/collections" className="btn btn-outline">
              {t.home.viewAll}
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Custom orders ---------- */}
      <section className="container-x py-20 md:py-28">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <span className="rule-gold" />
          <p className="eyebrow mt-8 text-gold">{t.home.customEyebrow}</p>
          <h2 className="display mt-4 text-balance text-[2.25rem] md:text-[3.25rem]">{t.home.customTitle}</h2>
          <p className="mt-5 max-w-lg text-ink-soft md:text-lg">{t.home.customBody}</p>
          <Link href="/contact" className="btn btn-dark mt-10">
            {t.home.customCta} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ---------- Visit ---------- */}
      <section className="bg-night text-ivory">
        {/* The shop map (or photo) sits above the text on phones and tablets, beside it from xl. */}
        <div className="grid xl:grid-cols-2">
          <div
            className={`relative xl:aspect-auto xl:min-h-[36rem] ${store.mapPin ? "aspect-[4/3] sm:aspect-[16/9]" : "aspect-[16/9] sm:aspect-[21/9]"}`}
          >
            {store.mapPin ? (
              <iframe
                src={mapEmbedSrc(store.mapPin, locale)}
                title={t.home.mapTitle}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : storyImage ? (
              <Picture media={storyImage} alt="" sizes="(min-width: 1280px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/brand/cover-960.webp" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
          <div className="flex items-center px-4 py-14 sm:px-8 sm:py-16 md:px-12 md:py-20 lg:px-16 xl:px-24 xl:py-24">
            <div className="@container w-full max-w-md sm:max-w-xl xl:max-w-md">
              <p className="eyebrow text-gold-light">{t.home.visitEyebrow}</p>
              {/* Khmer runs wider; scale it to the column so the title stays on one line. */}
              <h2
                className="display mt-4 text-[2.25rem] md:text-5xl [&:lang(km)]:text-[min(3rem,calc(100cqw/10.4))]"
                {...L(home.story.title)}
              />
              <p className="mt-6 text-ivory/75" {...L(home.story.body)} />
              {(address || hours) && (
                <dl className="mt-8 space-y-4 border-t border-ivory/15 pt-8 text-sm">
                  {address && (
                    <div>
                      <dt className="eyebrow text-ivory/50">{t.contact.address}</dt>
                      <dd className="mt-1 whitespace-pre-line text-ivory/85">{address}</dd>
                    </div>
                  )}
                  {hours && (
                    <div>
                      <dt className="eyebrow text-ivory/50">{t.contact.hours}</dt>
                      <dd className="mt-1 whitespace-pre-line text-ivory/85">{hours}</dd>
                    </div>
                  )}
                </dl>
              )}
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/contact" className="btn btn-light">
                  {t.home.contactUs}
                </Link>
                {store.mapUrl ? (
                  <a
                    href={store.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline border-ivory/40 text-ivory hover:border-ivory hover:bg-ivory hover:text-ink"
                  >
                    {t.home.directions}
                  </a>
                ) : (
                  <Link href="/about" className="btn btn-outline border-ivory/40 text-ivory hover:border-ivory hover:bg-ivory hover:text-ink">
                    {t.home.readMore}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Khmer has no spaces between words, so the owner's spaces mark phrases. Each phrase is an
 * inline-block: lines break at those spaces first, and a phrase only splits when it is wider
 * than the line. Other languages render as plain text.
 */
function Phrases({ children, lang }: { children: string; lang: string }) {
  if (lang !== "km") return children;
  return children.split(/\s+/).map((phrase, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      <span className="inline-block align-top [line-height:inherit]">{phrase}</span>
    </Fragment>
  ));
}

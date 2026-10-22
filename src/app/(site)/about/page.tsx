import type { Metadata } from "next";
import Link from "next/link";
import { Picture } from "@/components/site/Picture";
import { getDictionary } from "@/i18n/server";
import { getMedia } from "@/lib/media";
import { getSetting } from "@/lib/settings";
import { pick, pickLang } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.nav.about };
}

export default async function AboutPage() {
  const { t, locale } = await getDictionary();
  const about = getSetting("about");
  const image = getMedia(about.imageId);
  const body = pick(about.body, locale);

  return (
    <div className="container-x pb-24 pt-10 md:pt-16">
      <div className="grid items-start gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-6 md:col-start-1">
          <div className="aspect-[4/5] overflow-hidden bg-cream">
            {image ? (
              <Picture media={image} alt="" sizes="(min-width: 768px) 50vw, 100vw" priority className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/brand/cover-1600.webp" alt="" className="h-full w-full object-cover object-[30%_50%]" />
            )}
          </div>
        </div>
        <div className="md:col-span-5 md:col-start-8 md:pt-16">
          <h1 lang={pickLang(about.title, locale)} className="display text-[2.5rem] md:text-[3.25rem]">
            {pick(about.title, locale)}
          </h1>
          <span className="rule-gold mt-8" />
          <div lang={pickLang(about.body, locale)} className="prose-luxe mt-8 text-[1.0625rem] leading-relaxed text-ink-soft">
            {body.split(/\n{2,}/).map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
          <Link href="/contact" className="btn btn-dark mt-10">
            {t.about.contactCta}
          </Link>
        </div>
      </div>
    </div>
  );
}

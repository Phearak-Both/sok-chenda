import Link from "next/link";
import type { Dictionary } from "@/i18n/en";
import { hasDirectContact, socialLinks, telegramLink, telLink, whatsappLink } from "@/lib/contact";
import type { StoreSettings } from "@/lib/settings";
import { pick, type Locale } from "@/lib/types";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "../icons";
import { LanguageSwitch } from "./LanguageSwitch";

const SOCIAL_ICONS = { facebook: FacebookIcon, instagram: InstagramIcon, tiktok: TikTokIcon };
const SOCIAL_NAMES = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok" };

export function SiteFooter({ t, locale, store }: { t: Dictionary; locale: Locale; store: StoreSettings }) {
  const socials = socialLinks(store);
  const address = pick(store.address, locale);
  return (
    <footer className="bg-night text-ivory">
      <div className="container-x grid gap-12 py-16 sm:grid-cols-2 md:py-24 lg:grid-cols-12 lg:gap-x-8">
        <div className="sm:col-span-2 lg:col-span-4">
          <Link href="/" className="inline-block" aria-label="Sok Chenda — សុខ ចិន្ដា">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.webp" alt="" width={438} height={320} loading="lazy" className="h-24 w-auto md:h-28" />
          </Link>
          <p className="mt-6 max-w-xs text-sm text-ivory/60">{t.brand.tagline}</p>
        </div>

        <div className="lg:col-span-2">
          <h2 className="eyebrow text-gold-light">{t.footer.explore}</h2>
          <ul className="mt-5 space-y-3 text-sm text-ivory/80">
            <li><Link className="link-line" href="/">{t.nav.home}</Link></li>
            <li><Link className="link-line" href="/collections">{t.nav.collections}</Link></li>
            <li><Link className="link-line" href="/about">{t.nav.about}</Link></li>
            <li><Link className="link-line" href="/contact">{t.nav.contact}</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="eyebrow text-gold-light">{t.footer.contact}</h2>
          {hasDirectContact(store) || store.email || address ? (
            <ul className="mt-5 space-y-3 text-sm text-ivory/80">
              {store.phone && (
                <li><a className="link-line" href={telLink(store.phone)}>{t.footer.tel} {store.phone}</a></li>
              )}
              {store.whatsapp && (
                <li>
                  <a className="link-line" href={whatsappLink(store.whatsapp)} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </li>
              )}
              {store.telegram && (
                <li>
                  <a className="link-line" href={telegramLink(store.telegram)} target="_blank" rel="noopener noreferrer">
                    {t.footer.telegram} @{store.telegram}
                  </a>
                </li>
              )}
              {store.email && (
                <li><a className="link-line" href={`mailto:${store.email}`}>{store.email}</a></li>
              )}
              {address && <li className="whitespace-pre-line text-ivory/60">{address}</li>}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-ivory/50">{t.contact.noDetails}</p>
          )}
        </div>

        {socials.length > 0 && (
          <div className="lg:col-span-3">
            <h2 className="eyebrow text-gold-light">{t.footer.follow}</h2>
            <ul className="mt-5 flex flex-wrap gap-3">
              {socials.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <li key={key}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={SOCIAL_NAMES[key]}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/20 transition-colors hover:border-gold-light hover:text-gold-light"
                    >
                      <Icon size={18} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-x flex flex-col-reverse items-start justify-between gap-4 py-6 text-xs text-ivory/50 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Sok Chenda · សុខ ចិន្ដា. {t.footer.rights}
          </p>
          <LanguageSwitch tone="light" />
        </div>
      </div>
    </footer>
  );
}

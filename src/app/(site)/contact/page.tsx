import type { Metadata } from "next";
import {
  ClockIcon,
  ExternalIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  TelegramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { getDictionary } from "@/i18n/server";
import { socialLinks, telegramLink, telLink, whatsappLink } from "@/lib/contact";
import { getSetting } from "@/lib/settings";
import { pick } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.contact.title };
}

const SOCIAL = {
  facebook: { Icon: FacebookIcon, label: "Facebook" },
  instagram: { Icon: InstagramIcon, label: "Instagram" },
  tiktok: { Icon: TikTokIcon, label: "TikTok" },
};

export default async function ContactPage() {
  const { t, locale } = await getDictionary();
  const store = getSetting("store");
  const address = pick(store.address, locale);
  const hours = pick(store.hours, locale);
  const socials = socialLinks(store);

  const channels = [
    store.whatsapp && {
      Icon: WhatsAppIcon,
      label: t.contact.whatsapp,
      value: `+${store.whatsapp}`,
      href: whatsappLink(store.whatsapp),
      external: true,
    },
    store.telegram && {
      Icon: TelegramIcon,
      label: t.contact.telegram,
      value: `@${store.telegram}`,
      href: telegramLink(store.telegram),
      external: true,
    },
    store.phone && { Icon: PhoneIcon, label: t.contact.phone, value: store.phone, href: telLink(store.phone) },
    store.email && { Icon: MailIcon, label: t.contact.email, value: store.email, href: `mailto:${store.email}` },
  ].filter(Boolean) as { Icon: typeof PhoneIcon; label: string; value: string; href: string; external?: boolean }[];

  const nothing = channels.length === 0 && !address && !hours && socials.length === 0;

  return (
    <div className="container-x pb-24 pt-10 md:pt-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="display text-[2.5rem] md:text-6xl">{t.contact.title}</h1>
        <p className="mt-4 text-ink-soft">{t.contact.subtitle}</p>
      </header>

      {nothing ? (
        <p className="mx-auto mt-16 max-w-md border border-line bg-cream/60 p-8 text-center text-ink-soft">
          {t.contact.noDetails}
        </p>
      ) : (
        <div className="mx-auto mt-14 grid max-w-5xl gap-12 md:mt-20 md:grid-cols-2 md:gap-16">
          {channels.length > 0 && (
            <ul className="divide-y divide-line self-start border-y border-line">
              {channels.map(({ Icon, label, value, href, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex items-center gap-5 py-6"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-ivory">
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0">
                      <span className="eyebrow block text-ink-faint">{label}</span>
                      <span className="mt-0.5 block truncate text-lg">{value}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-10">
            {address && (
              <div className="flex gap-5">
                <PinIcon size={20} className="mt-1 shrink-0 text-gold" />
                <div>
                  <h2 className="eyebrow text-ink-faint">{t.contact.address}</h2>
                  <p className="mt-2 whitespace-pre-line">{address}</p>
                  {store.mapUrl && (
                    <a
                      href={store.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="eyebrow link-line mt-4 inline-flex items-center gap-2"
                    >
                      {t.contact.openMap} <ExternalIcon size={13} />
                    </a>
                  )}
                </div>
              </div>
            )}
            {hours && (
              <div className="flex gap-5">
                <ClockIcon size={20} className="mt-1 shrink-0 text-gold" />
                <div>
                  <h2 className="eyebrow text-ink-faint">{t.contact.hours}</h2>
                  <p className="mt-2 whitespace-pre-line">{hours}</p>
                </div>
              </div>
            )}
            {socials.length > 0 && (
              <div>
                <h2 className="eyebrow text-ink-faint">{t.contact.follow}</h2>
                <ul className="mt-4 flex flex-wrap gap-3">
                  {socials.map(([key, url]) => {
                    const { Icon, label } = SOCIAL[key];
                    return (
                      <li key={key}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm transition-colors hover:border-ink"
                        >
                          <Icon size={16} /> {label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

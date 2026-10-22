import { SiteFooter } from "@/components/site/SiteFooter";
import { PriceTicker } from "@/components/site/PriceTicker";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSiteContext } from "@/lib/site";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { t, locale, store } = await getSiteContext();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory"
      >
        {t.nav.skip}
      </a>
      <PriceTicker t={t} locale={locale} />
      <SiteHeader />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter t={t} locale={locale} store={store} />
    </>
  );
}

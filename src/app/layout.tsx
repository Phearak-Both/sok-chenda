import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost, Kantumruy_Pro, Noto_Serif_Khmer } from "next/font/google";
import { I18nProvider } from "@/i18n/client";
import { getDictionary } from "@/i18n/server";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });
const kantumruy = Kantumruy_Pro({ subsets: ["khmer"], variable: "--font-kantumruy", display: "swap" });
const serifKm = Noto_Serif_Khmer({ subsets: ["khmer"], variable: "--font-serif-km", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  const name = `${t.brand.name}`;
  return {
    metadataBase: process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined,
    title: { default: `${name} — ${t.brand.tagline}`, template: `%s · ${name}` },
    description: t.brand.tagline,
    openGraph: { siteName: "Sok Chenda · សុខ ចិន្ដា", type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#fbf8f3" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getDictionary();
  return (
    <html
      lang={locale}
      className={`${cormorant.variable} ${jost.variable} ${kantumruy.variable} ${serifKm.variable}`}
    >
      <body>
        <I18nProvider locale={locale} t={t}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}

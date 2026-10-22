import { PageHeader } from "@/components/admin/AdminShell";
import { PricesForm } from "@/components/admin/PricesForm";
import { getDictionary } from "@/i18n/server";
import { formatUpdated } from "@/lib/prices";
import { getSetting } from "@/lib/settings";

const cambodiaDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Phnom_Penh" });

export default async function PricesPage() {
  const { t, locale } = await getDictionary();
  const prices = getSetting("prices");
  const updated = prices.updatedAt ? formatUpdated(prices.updatedAt, locale) : null;
  const stale = prices.updatedAt ? cambodiaDay(new Date(prices.updatedAt)) !== cambodiaDay(new Date()) : false;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t.admin.prices.title} />
      <PricesForm prices={prices} updated={updated} stale={stale} />
    </div>
  );
}

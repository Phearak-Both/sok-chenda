import Link from "next/link";
import { deleteSampleProducts } from "@/app/admin/actions/products";
import { PageHeader } from "@/components/admin/AdminShell";
import { ConfirmButton } from "@/components/admin/fields";
import { CheckIcon, PlusIcon } from "@/components/icons";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { countProductsByStatus, listProducts } from "@/lib/catalog";
import { hasDirectContact } from "@/lib/contact";
import { mediaUrl } from "@/lib/media-url";
import { getSetting } from "@/lib/settings";
import { pick } from "@/lib/types";

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ samples?: string }> }) {
  const { t, locale } = await getDictionary();
  const o = t.admin.overview;
  const counts = countProductsByStatus();
  const store = getSetting("store");
  const home = getSetting("home");
  const about = getSetting("about");
  const recent = listProducts({ status: "active", sort: "newest", limit: 5 }).items;
  const { samples } = await searchParams;

  const checklist = [
    { done: hasDirectContact(store), label: o.checkContact, href: "/admin/settings" },
    { done: Boolean(store.address.en || store.address.km) && Boolean(store.hours.en || store.hours.km), label: o.checkAddress, href: "/admin/settings" },
    { done: home.reviewed, label: o.checkHome, href: "/admin/content" },
    { done: about.reviewed, label: o.checkAbout, href: "/admin/content#about" },
    { done: counts.sample === 0, label: fmt(o.checkSamples, { n: counts.sample }), href: "/admin/products" },
  ];
  const remaining = checklist.filter((c) => !c.done);

  const stats = [
    { label: o.published, value: counts.published, href: "/admin/products?status=published" },
    { label: o.drafts, value: counts.draft, href: "/admin/products?status=draft" },
    { label: o.archived, value: counts.archived, href: "/admin/products?status=archived" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={o.welcome}
        actions={
          <Link href="/admin/products/new" className="abtn abtn-primary">
            <PlusIcon size={16} /> {o.addProduct}
          </Link>
        }
      />

      {samples === "removed" && (
        <p role="status" className="mb-6 rounded-md bg-[#edf3ec] px-4 py-3 text-sm text-success">
          {o.samplesRemoved}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-4 transition-colors hover:border-ink-faint md:p-5">
            <p className="text-sm text-ink-soft">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card p-5 md:p-6 lg:col-span-3">
          <h2 className="font-semibold">{o.checklistTitle}</h2>
          {remaining.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-success">
              <CheckIcon size={16} /> {o.allDone}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {checklist.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="flex items-start gap-3 py-3 text-sm hover:text-gold">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        c.done ? "border-success bg-success text-white" : "border-ink-faint"
                      }`}
                    >
                      {c.done && <CheckIcon size={12} />}
                    </span>
                    <span className={c.done ? "text-ink-faint line-through" : ""}>{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t.admin.nav.products}</h2>
            <Link href="/admin/products" className="text-sm text-ink-soft hover:text-ink">
              {t.home.viewAll} →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">{t.admin.products.empty}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recent.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 py-2.5 hover:text-gold">
                    <span className="h-12 w-10 shrink-0 overflow-hidden rounded bg-cream">
                      {p.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(p.images[0], 160)} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{pick(p.name, locale)}</span>
                    <span className="text-xs text-ink-faint">{t.admin.products.status[p.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {counts.sample > 0 && (
        <section className="card mt-6 border-gold/40 bg-[#fbf6ec] p-5 md:p-6">
          <h2 className="font-semibold">{o.samplesTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">{fmt(o.samplesBody, { n: counts.sample })}</p>
          <form action={deleteSampleProducts} className="mt-4">
            <ConfirmButton message={o.confirmRemoveSamples}>{o.removeSamples}</ConfirmButton>
          </form>
        </section>
      )}
    </div>
  );
}

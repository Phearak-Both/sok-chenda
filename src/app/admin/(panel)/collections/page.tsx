import Link from "next/link";
import { PageHeader } from "@/components/admin/AdminShell";
import { PlusIcon } from "@/components/icons";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { listCollections } from "@/lib/catalog";
import { mediaUrl } from "@/lib/media-url";
import { pick } from "@/lib/types";

export default async function CollectionsAdminPage() {
  const { t, locale } = await getDictionary();
  const c = t.admin.collections;
  const collections = listCollections();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={c.title}
        actions={
          <Link href="/admin/collections/new" className="abtn abtn-primary">
            <PlusIcon size={16} /> {c.new}
          </Link>
        }
      />
      <p className="-mt-3 mb-6 text-sm text-ink-soft">{c.howToAdd}</p>
      {collections.length === 0 ? (
        <div className="card p-10 text-center text-ink-soft">{c.empty}</div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <li key={col.id}>
              <Link href={`/admin/collections/${col.id}`} className="card block overflow-hidden transition-colors hover:border-ink-faint">
                <div className="aspect-[4/3] bg-cream">
                  {col.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(col.image, 480)} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <p className="font-medium">{pick(col.name, locale)}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {fmt(t.count.pieces, { n: col.productCount })} · {col.isPublished ? t.admin.products.status.published : c.hidden}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

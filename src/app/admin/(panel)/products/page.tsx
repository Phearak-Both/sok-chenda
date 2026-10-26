import Link from "next/link";
import { setProductStatus, toggleFeatured } from "@/app/admin/actions/products";
import { PageHeader } from "@/components/admin/AdminShell";
import { ActionButton } from "@/components/admin/fields";
import { EyeIcon, PlusIcon, SearchIcon, StarIcon } from "@/components/icons";
import { getDictionary } from "@/i18n/server";
import { requireOwner } from "@/lib/auth";
import { listCategories, listProducts } from "@/lib/catalog";
import { mediaUrl } from "@/lib/media-url";
import { formatWeightKm } from "@/lib/weight";
import { PRODUCT_STATUSES, pick, type ProductStatus } from "@/lib/types";

const STATUS_STYLE: Record<ProductStatus, string> = {
  published: "bg-[#edf3ec] text-success",
  draft: "bg-sand/70 text-ink-soft",
  archived: "bg-[#eeeae4] text-ink-faint",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireOwner();
  const { t, locale } = await getDictionary();
  const p = t.admin.products;
  const sp = await searchParams;
  const status = (PRODUCT_STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as ProductStatus)
    : undefined;
  const q = (sp.q ?? "").slice(0, 100);
  const { items } = listProducts({ status: status ?? "active", q, sort: "featured", limit: 500 });
  const categories = new Map(listCategories().map((c) => [c.id, pick(c.name, locale)]));

  const tabs = [
    { key: "", label: p.filterAll },
    ...PRODUCT_STATUSES.map((s) => ({ key: s, label: p.status[s] })),
  ];
  const tabHref = (key: string) => {
    const params = new URLSearchParams();
    if (key) params.set("status", key);
    if (q) params.set("q", q);
    const s = params.toString();
    return s ? `/admin/products?${s}` : "/admin/products";
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={p.title}
        actions={
          <Link href="/admin/products/new" className="abtn abtn-primary">
            <PlusIcon size={16} /> {p.new}
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tabHref(tab.key)}
              aria-current={(status ?? "") === tab.key ? "page" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm ${
                (status ?? "") === tab.key ? "bg-ink text-white" : "text-ink-soft hover:bg-sand/60"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <form className="relative md:w-72">
          {status && <input type="hidden" name="status" value={status} />}
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t.admin.common.search}
            aria-label={t.admin.common.search}
            className="input !pl-9"
          />
        </form>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-ink-soft">
          <p>{q || status ? p.emptyFilter : p.empty}</p>
          {!q && !status && (
            <Link href="/admin/products/new" className="abtn abtn-primary mt-5">
              <PlusIcon size={16} /> {p.new}
            </Link>
          )}
        </div>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {items.map((item) => {
            const name = pick(item.name, locale);
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-3 md:flex-nowrap md:px-4">
                <Link href={`/admin/products/${item.id}`} className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
                  <span className="h-16 w-[3.25rem] shrink-0 overflow-hidden rounded bg-cream">
                    {item.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(item.images[0], 160)} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium hover:text-gold">{name}</span>
                    <span className="block truncate text-xs text-ink-faint">
                      {[
                        item.categoryId ? categories.get(item.categoryId) : null,
                        item.weightGrams !== null ? formatWeightKm(item.weightGrams) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[0.6875rem] font-medium ${STATUS_STYLE[item.status]}`}>
                        {p.status[item.status]}
                      </span>
                      {item.isSample && (
                        <span className="rounded bg-[#fbf3e3] px-1.5 py-0.5 text-[0.6875rem] font-medium text-gold">
                          {p.sampleBadge}
                        </span>
                      )}
                      {!item.name.km && (
                        <span className="rounded bg-[#fbeeeb] px-1.5 py-0.5 text-[0.6875rem] text-danger">
                          {p.khmerMissing}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
                <div className="flex w-full items-center justify-end gap-1.5 md:w-auto">
                  <form action={toggleFeatured.bind(null, item.id)}>
                    <ActionButton
                      title={item.isFeatured ? p.unfeature : p.feature}
                      className={`abtn abtn-sm !px-2 ${item.isFeatured ? "text-gold" : "text-ink-faint"}`}
                    >
                      <StarIcon size={16} filled={item.isFeatured} />
                    </ActionButton>
                  </form>
                  <a
                    href={`/products/${item.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="abtn abtn-sm !px-2"
                    title={p.preview}
                    aria-label={p.preview}
                  >
                    <EyeIcon size={16} />
                  </a>
                  {item.status === "published" ? (
                    <form action={setProductStatus.bind(null, item.id, "draft")}>
                      <ActionButton>{p.unpublish}</ActionButton>
                    </form>
                  ) : (
                    <form action={setProductStatus.bind(null, item.id, "published")}>
                      <ActionButton className="abtn abtn-sm abtn-gold">{p.publish}</ActionButton>
                    </form>
                  )}
                  <Link href={`/admin/products/${item.id}`} className="abtn abtn-sm">
                    {t.admin.common.edit}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

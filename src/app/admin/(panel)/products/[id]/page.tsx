import { notFound } from "next/navigation";
import { deleteProduct } from "@/app/admin/actions/products";
import { PageHeader } from "@/components/admin/AdminShell";
import { ConfirmButton } from "@/components/admin/fields";
import { ProductForm } from "@/components/admin/ProductForm";
import { TrashIcon } from "@/components/icons";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { getProduct } from "@/lib/catalog";
import { pick } from "@/lib/types";
import { productFormOptions } from "../options";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const product = getProduct(Number((await params).id));
  if (!product) notFound();
  const { t, locale } = await getDictionary();
  const p = t.admin.products;
  const { created } = await searchParams;
  const updated = new Date(product.updatedAt.replace(" ", "T") + "Z").toLocaleString(locale === "km" ? "km-KH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={pick(product.name, locale) || p.editTitle} back={{ href: "/admin/products", label: p.title }} />
      <p className="-mt-4 mb-6 text-xs text-ink-faint">{fmt(p.updated, { date: updated })}</p>
      {created && (
        <p role="status" className="mb-6 rounded-md bg-[#edf3ec] px-4 py-3 text-sm text-success">
          {p.created}
        </p>
      )}
      {product.isSample && (
        <p className="mb-6 rounded-md bg-[#fbf6ec] px-4 py-3 text-sm text-gold">{p.sampleNote}</p>
      )}
      <ProductForm product={product} {...productFormOptions(locale)} />
      <div className="mt-6 flex justify-end pb-20 lg:pb-0">
        <form action={deleteProduct.bind(null, product.id)}>
          <ConfirmButton message={p.confirmDelete}>
            <TrashIcon size={16} /> {p.deleteProduct}
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}

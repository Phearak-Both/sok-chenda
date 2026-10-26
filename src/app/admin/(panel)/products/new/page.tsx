import { PageHeader } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { getDictionary } from "@/i18n/server";
import { requireOwner } from "@/lib/auth";
import { productFormOptions } from "../options";

export default async function NewProductPage() {
  await requireOwner();
  const { t, locale } = await getDictionary();
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t.admin.products.newTitle} back={{ href: "/admin/products", label: t.admin.products.title }} />
      <ProductForm product={null} {...productFormOptions(locale)} />
    </div>
  );
}

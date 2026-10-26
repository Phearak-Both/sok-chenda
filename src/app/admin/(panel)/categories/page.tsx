import { deleteCategory } from "@/app/admin/actions/catalog";
import { PageHeader } from "@/components/admin/AdminShell";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmButton } from "@/components/admin/fields";
import { TrashIcon } from "@/components/icons";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { requireOwner } from "@/lib/auth";
import { listCategories } from "@/lib/catalog";
import { pick } from "@/lib/types";

export default async function CategoriesPage() {
  await requireOwner();
  const { t, locale } = await getDictionary();
  const c = t.admin.categories;
  const categories = listCategories();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={c.title} />
      <section className="card p-5 md:p-6">
        <h2 className="mb-4 font-semibold">{c.new}</h2>
        <CategoryForm category={null} />
      </section>

      {categories.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">{c.empty}</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {categories.map((cat) => (
            <li key={cat.id} className="card p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-semibold">
                  {pick(cat.name, locale)}{" "}
                  <span className="text-sm font-normal text-ink-faint">· {fmt(t.count.pieces, { n: cat.productCount })}</span>
                </h2>
                <form action={deleteCategory.bind(null, cat.id)}>
                  <ConfirmButton message={c.confirmDelete} className="abtn abtn-sm abtn-danger">
                    <TrashIcon size={15} /> {t.admin.common.delete}
                  </ConfirmButton>
                </form>
              </div>
              <CategoryForm category={cat} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

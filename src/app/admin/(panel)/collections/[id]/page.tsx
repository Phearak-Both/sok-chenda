import { notFound } from "next/navigation";
import { deleteCollection } from "@/app/admin/actions/catalog";
import { PageHeader } from "@/components/admin/AdminShell";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { ConfirmButton } from "@/components/admin/fields";
import { EyeIcon, TrashIcon } from "@/components/icons";
import { getDictionary } from "@/i18n/server";
import { getCollection } from "@/lib/catalog";
import { pick } from "@/lib/types";

export default async function EditCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const collection = getCollection(Number((await params).id));
  if (!collection) notFound();
  const { t, locale } = await getDictionary();
  const c = t.admin.collections;
  const { created } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={pick(collection.name, locale) || c.editTitle}
        back={{ href: "/admin/collections", label: c.title }}
        actions={
          <a href={`/collections?collection=${collection.slug}`} target="_blank" rel="noopener" className="abtn">
            <EyeIcon size={16} /> {t.admin.products.preview}
          </a>
        }
      />
      {created && (
        <p role="status" className="mb-6 rounded-md bg-[#edf3ec] px-4 py-3 text-sm text-success">
          {t.admin.common.saved}
        </p>
      )}
      <p className="mb-6 text-sm text-ink-soft">{c.howToAdd}</p>
      <CollectionForm collection={collection} />
      <form action={deleteCollection.bind(null, collection.id)} className="mt-6 flex justify-end">
        <ConfirmButton message={c.confirmDelete}>
          <TrashIcon size={16} /> {t.admin.common.delete}
        </ConfirmButton>
      </form>
    </div>
  );
}

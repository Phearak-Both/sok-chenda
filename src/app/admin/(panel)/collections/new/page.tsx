import { PageHeader } from "@/components/admin/AdminShell";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { getDictionary } from "@/i18n/server";

export default async function NewCollectionPage() {
  const { t } = await getDictionary();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t.admin.collections.new} back={{ href: "/admin/collections", label: t.admin.collections.title }} />
      <CollectionForm collection={null} />
    </div>
  );
}

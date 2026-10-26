import { PageHeader } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getDictionary } from "@/i18n/server";
import { requireOwner } from "@/lib/auth";
import { getSetting } from "@/lib/settings";

export default async function SettingsPage() {
  await requireOwner();
  const { t } = await getDictionary();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t.admin.settings.title} />
      <SettingsForm store={getSetting("store")} />
    </div>
  );
}

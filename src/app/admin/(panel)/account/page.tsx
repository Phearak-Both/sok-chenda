import { logout } from "@/app/admin/actions/auth";
import { PageHeader } from "@/components/admin/AdminShell";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { LogoutIcon } from "@/components/icons";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { requireOwner } from "@/lib/auth";

export default async function AccountPage() {
  const owner = await requireOwner();
  const { t } = await getDictionary();
  const a = t.admin.account;
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={a.title} />
      <p className="mb-6 text-sm text-ink-soft">{fmt(a.signedInAs, { email: owner.email })}</p>
      <section className="card p-5 md:p-6">
        <h2 className="mb-4 font-semibold">{a.changePassword}</h2>
        <PasswordForm />
      </section>
      <form action={logout} className="mt-6">
        <button type="submit" className="abtn">
          <LogoutIcon size={16} /> {t.admin.nav.logout}
        </button>
      </form>
    </div>
  );
}

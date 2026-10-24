import { connectTelegram, disconnectTelegram, logout } from "@/app/admin/actions/auth";
import { PageHeader } from "@/components/admin/AdminShell";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { TelegramConnectCode } from "@/components/admin/TelegramConnectCode";
import { LogoutIcon, TelegramIcon } from "@/components/icons";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { requireOwner } from "@/lib/auth";
import { isTelegramLinked, LINK_CODE_PATTERN, telegramConfigured, telegramLinkUrl } from "@/lib/telegram";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ telegram?: string }> }) {
  const owner = await requireOwner();
  const { telegram: code } = await searchParams;
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
      <section className="card mt-6 p-5 md:p-6">
        <h2 className="mb-2 font-semibold">{a.telegram}</h2>
        {!telegramConfigured() ? (
          <p className="text-sm text-ink-soft">{a.telegramNotSetUp}</p>
        ) : isTelegramLinked(owner.id) ? (
          <form action={disconnectTelegram} className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">{a.telegramConnected}</p>
            <button type="submit" className="abtn abtn-sm">
              {a.telegramDisconnect}
            </button>
          </form>
        ) : code && LINK_CODE_PATTERN.test(code) ? (
          <TelegramConnectCode url={telegramLinkUrl(code)} message={`/start ${code}`} />
        ) : (
          <form action={connectTelegram}>
            <p className="mb-4 text-sm text-ink-soft">{a.telegramIntro}</p>
            <button type="submit" className="abtn abtn-primary">
              <TelegramIcon size={16} /> {a.telegramConnect}
            </button>
          </form>
        )}
      </section>
      <form action={logout} className="mt-6">
        <button type="submit" className="abtn">
          <LogoutIcon size={16} /> {t.admin.nav.logout}
        </button>
      </form>
    </div>
  );
}

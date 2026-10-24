"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/admin/actions/auth";
import { useI18n } from "@/i18n/client";
import {
  CoinsIcon,
  CloseIcon,
  ExternalIcon,
  GemIcon,
  HomeIcon,
  LayersIcon,
  LayoutIcon,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
  UserIcon,
} from "../icons";
import { LanguageSwitch } from "../site/LanguageSwitch";

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const { t } = useI18n();
  const n = t.admin.nav;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const items = [
    { href: "/admin", label: n.overview, Icon: HomeIcon, exact: true },
    { href: "/admin/products", label: n.products, Icon: GemIcon },
    { href: "/admin/categories", label: n.categories, Icon: LayersIcon },
    { href: "/admin/content", label: n.content, Icon: LayoutIcon },
    { href: "/admin/prices", label: n.prices, Icon: CoinsIcon },
    { href: "/admin/settings", label: n.settings, Icon: SettingsIcon },
    { href: "/admin/account", label: n.account, Icon: UserIcon },
  ];
  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label={t.admin.title}>
      {items.map(({ href, label, Icon, exact }) => (
        <Link
          key={href}
          href={href}
          aria-current={active(href, exact) ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors ${
            active(href, exact) ? "bg-ink text-white" : "text-ink-soft hover:bg-sand/60 hover:text-ink"
          }`}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
      <a
        href="/"
        target="_blank"
        rel="noopener"
        className="mt-3 flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-ink-soft hover:bg-sand/60 hover:text-ink"
      >
        <ExternalIcon size={18} />
        {n.viewSite}
      </a>
    </nav>
  );

  const footer = (
    <div className="space-y-3 border-t border-line px-6 py-5">
      <LanguageSwitch />
      <p className="truncate text-xs text-ink-faint" title={email}>
        {email}
      </p>
      <form action={logout}>
        <button type="submit" className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft hover:text-ink">
          <LogoutIcon size={16} /> {n.logout}
        </button>
      </form>
    </div>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.webp" alt="" width={438} height={320} className="h-9 w-auto" />
      <span className="text-sm font-medium">{t.admin.title}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#f7f3ec] lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-ivory lg:flex">
        <div className="px-6 py-6">{brand}</div>
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ivory px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.nav.menu}
          aria-expanded={open}
          className="flex h-11 w-11 cursor-pointer items-center justify-center"
        >
          <MenuIcon size={22} />
        </button>
        {brand}
        <span className="w-11" />
      </div>
      <div className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`} inert={!open}>
        <div
          className={`absolute inset-0 bg-night/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <aside
          role="dialog"
          aria-modal="true"
          className={`absolute inset-y-0 left-0 flex w-72 flex-col bg-ivory transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4">
            {brand}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.nav.close}
              className="flex h-11 w-11 cursor-pointer items-center justify-center"
            >
              <CloseIcon size={20} />
            </button>
          </div>
          {nav}
          {footer}
        </aside>
      </div>

      <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-8 md:pt-10">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  actions,
  back,
}: {
  title: string;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 md:mb-8">
      {back && (
        <Link href={back.href} className="mb-2 inline-flex min-h-8 items-center text-sm text-ink-soft hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold md:text-[1.75rem]">{title}</h1>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

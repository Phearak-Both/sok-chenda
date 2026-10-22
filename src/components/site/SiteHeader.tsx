"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import { CloseIcon, MenuIcon } from "../icons";
import { LanguageSwitch } from "./LanguageSwitch";

export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/collections", label: t.nav.collections },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-ivory/95 backdrop-blur-md transition-shadow duration-500 ${
          scrolled ? "shadow-[0_1px_0_var(--color-line)]" : ""
        }`}
      >
        <div className="container-x grid h-[4.25rem] grid-cols-[1fr_auto_1fr] items-center md:h-20">
          {/* Left: menu (mobile) / navigation (desktop) */}
          <div className="flex items-center">
            <button
              type="button"
              className="-ml-2 flex h-11 w-11 cursor-pointer items-center justify-center lg:hidden"
              aria-label={t.nav.menu}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon size={22} />
            </button>
            <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className="link-line eyebrow text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Centre: logo */}
          <Link href="/" className="flex items-center" aria-label="Sok Chenda — សុខ ចិន្ដា">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.webp"
              alt=""
              width={438}
              height={320}
              className="h-14 w-auto md:h-16"
            />
          </Link>

          {/* Right: utilities */}
          <div className="flex items-center justify-end">
            <LanguageSwitch />
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        inert={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-night/40 transition-opacity duration-500 ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.nav.menu}
          className={`absolute inset-y-0 left-0 flex w-[min(88vw,24rem)] flex-col bg-ivory transition-transform duration-500 ease-[var(--ease-luxe)] ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-[4.25rem] items-center justify-between px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.webp" alt="" width={438} height={320} className="h-11 w-auto" />
            <button
              type="button"
              className="flex h-11 w-11 cursor-pointer items-center justify-center"
              aria-label={t.nav.close}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
            >
              <CloseIcon size={22} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col px-6 pt-6" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                tabIndex={menuOpen ? 0 : -1}
                className={`display border-b border-line py-4 text-[1.75rem] ${
                  isActive(l.href) ? "text-gold" : ""
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-4 border-t border-line px-6 py-6">
            <div className="flex items-center justify-between">
              <span className="eyebrow text-ink-faint">{t.nav.language}</span>
              <LanguageSwitch />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

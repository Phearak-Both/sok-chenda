import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitch } from "@/components/site/LanguageSwitch";
import { getDictionary } from "@/i18n/server";
import { getOwner } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getOwner()) redirect("/admin");
  const { t } = await getDictionary();
  const { next } = await searchParams;
  const hasOwner = Boolean(getDb().prepare("SELECT 1 FROM owners LIMIT 1").get());

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mx-auto block w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.webp" alt="Sok Chenda — សុខ ចិន្ដា" width={438} height={320} className="h-24 w-auto" />
        </Link>
        <div className="card mt-8 p-6 md:p-8">
          <h1 className="text-xl font-semibold">{t.admin.login.title}</h1>
          <p className="mb-6 mt-1 text-sm text-ink-soft">{t.admin.login.subtitle}</p>
          {hasOwner ? (
            <LoginForm next={typeof next === "string" ? next : ""} />
          ) : (
            <p className="rounded-md bg-sand/50 p-4 text-sm">{t.admin.login.noOwner}</p>
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <LanguageSwitch />
        </div>
      </div>
    </div>
  );
}

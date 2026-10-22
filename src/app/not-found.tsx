import Link from "next/link";
import { getDictionary } from "@/i18n/server";

// Fallback for URLs outside the storefront layout.
export default async function RootNotFound() {
  const { t } = await getDictionary();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="display text-7xl text-gold-light">404</p>
      <h1 className="display mt-6 text-4xl">{t.errors.notFoundTitle}</h1>
      <Link href="/" className="btn btn-dark mt-10">
        {t.errors.backHome}
      </Link>
    </div>
  );
}

import Link from "next/link";
import { getDictionary } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getDictionary();
  return (
    <div className="container-x flex flex-col items-center py-32 text-center">
      <p className="display text-7xl text-gold-light">404</p>
      <h1 className="display mt-6 text-4xl">{t.errors.notFoundTitle}</h1>
      <p className="mt-4 max-w-md text-ink-soft">{t.errors.notFoundBody}</p>
      <Link href="/" className="btn btn-dark mt-10">
        {t.errors.backHome}
      </Link>
    </div>
  );
}

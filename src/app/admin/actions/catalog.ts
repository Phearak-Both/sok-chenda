"use server";

import { revalidatePath } from "next/cache";
import { getDictionary } from "@/i18n/server";
import { requireOwner } from "@/lib/auth";
import { uniqueSlug } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { int, localized, str, type FormState } from "@/lib/form";

function refresh() {
  revalidatePath("/", "layout");
}

// ---------- Categories ----------

export async function saveCategory(_prev: FormState, form: FormData): Promise<FormState> {
  await requireOwner();
  const { t } = await getDictionary();
  const db = getDb();
  const id = int(form, "id") || null;
  const name = localized(form, "name", 80);
  if (!name.en && !name.km) {
    return { errors: { name: t.admin.common.required }, message: t.admin.common.fixErrors, at: Date.now() };
  }
  const current = id
    ? (db.prepare("SELECT slug FROM categories WHERE id = ?").get(id) as { slug: string } | undefined)
    : undefined;
  if (id && !current) return { message: t.admin.common.error, at: Date.now() };
  const values = {
    slug: uniqueSlug("categories", str(form, "slug", 100) || current?.slug || name.en || name.km, id ?? undefined),
    name_en: name.en,
    name_km: name.km,
    sort: int(form, "sort"),
  };
  if (id) {
    db.prepare("UPDATE categories SET slug=@slug, name_en=@name_en, name_km=@name_km, sort=@sort WHERE id=@id").run({
      ...values,
      id,
    });
  } else {
    db.prepare("INSERT INTO categories (slug, name_en, name_km, sort) VALUES (@slug, @name_en, @name_km, @sort)").run(values);
  }
  refresh();
  return { ok: true, message: t.admin.common.saved, at: Date.now() };
}

export async function deleteCategory(id: number) {
  await requireOwner();
  getDb().prepare("DELETE FROM categories WHERE id = ?").run(id);
  refresh();
}

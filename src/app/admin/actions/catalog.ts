"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/server";
import { requireOwner } from "@/lib/auth";
import { getCollection, uniqueSlug } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { bool, int, localized, str, type FormState } from "@/lib/form";
import { deleteUnusedMedia, MEDIA_ID_PATTERN } from "@/lib/media";

function refresh() {
  revalidatePath("/", "layout");
}

function mediaIdOrNull(value: string) {
  if (!MEDIA_ID_PATTERN.test(value)) return null;
  return getDb().prepare("SELECT 1 FROM media WHERE id = ?").get(value) ? value : null;
}

// ---------- Collections ----------

export async function saveCollection(_prev: FormState, form: FormData): Promise<FormState> {
  await requireOwner();
  const { t } = await getDictionary();
  const db = getDb();
  const id = int(form, "id") || null;
  const existing = id ? getCollection(id) : null;
  if (id && !existing) return { message: t.admin.common.error, at: Date.now() };

  const name = localized(form, "name", 120);
  const description = localized(form, "description", 1000);
  if (!name.en && !name.km) {
    return { errors: { name: t.admin.common.required }, message: t.admin.common.fixErrors, at: Date.now() };
  }
  const values = {
    slug: uniqueSlug("collections", str(form, "slug", 100) || existing?.slug || name.en || name.km, id ?? undefined),
    name_en: name.en,
    name_km: name.km,
    description_en: description.en,
    description_km: description.km,
    image_id: mediaIdOrNull(str(form, "image_id")),
    is_published: bool(form, "is_published") ? 1 : 0,
    sort: int(form, "sort"),
  };

  if (existing) {
    db.prepare(
      `UPDATE collections SET slug=@slug, name_en=@name_en, name_km=@name_km, description_en=@description_en,
         description_km=@description_km, image_id=@image_id, is_published=@is_published, sort=@sort,
         updated_at=datetime('now') WHERE id=@id`,
    ).run({ ...values, id });
    if (existing.image && existing.image.id !== values.image_id) deleteUnusedMedia([existing.image.id]);
    refresh();
    return { ok: true, message: t.admin.common.saved, at: Date.now() };
  }
  const res = db
    .prepare(
      `INSERT INTO collections (slug, name_en, name_km, description_en, description_km, image_id, is_published, sort)
       VALUES (@slug, @name_en, @name_km, @description_en, @description_km, @image_id, @is_published, @sort)`,
    )
    .run(values);
  refresh();
  redirect(`/admin/collections/${res.lastInsertRowid}?created=1`);
}

export async function deleteCollection(id: number) {
  await requireOwner();
  const existing = getCollection(id);
  getDb().prepare("DELETE FROM collections WHERE id = ?").run(id);
  if (existing?.image) deleteUnusedMedia([existing.image.id]);
  refresh();
  redirect("/admin/collections");
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

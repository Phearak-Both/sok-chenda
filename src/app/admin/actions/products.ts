"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/server";
import { requireOwner } from "@/lib/auth";
import { getProduct, uniqueSlug } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { bool, int, localized, str, type FormState } from "@/lib/form";
import { deleteUnusedMedia, MEDIA_ID_PATTERN } from "@/lib/media";
import { removeSampleProducts } from "@/lib/seed";
import { PRODUCT_STATUSES, type ProductStatus } from "@/lib/types";
import { isMetalType } from "@/lib/metal";
import { parseWeightInput, WEIGHT_UNITS, type WeightUnit } from "@/lib/weight";

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveProduct(_prev: FormState, form: FormData): Promise<FormState> {
  await requireOwner();
  const { t } = await getDictionary();
  const db = getDb();
  const id = int(form, "id") || null;
  const existing = id ? getProduct(id) : null;
  if (id && !existing) return { message: t.admin.common.error, at: Date.now() };

  const name = localized(form, "name", 200);
  const description = localized(form, "description", 5000);
  const material = localized(form, "material", 200);
  const metalType = isMetalType(str(form, "metal_type")) ? str(form, "metal_type") : null;
  const unit = (WEIGHT_UNITS as string[]).includes(str(form, "weight_unit"))
    ? (str(form, "weight_unit") as WeightUnit)
    : "chi";
  const weightGrams = parseWeightInput(str(form, "weight_value", 30), unit);
  const categoryId = int(form, "category_id") || null;
  const featured = bool(form, "featured");
  const sort = int(form, "sort");

  const intent = str(form, "intent");
  let status: ProductStatus = existing?.status ?? "draft";
  if (intent === "publish") status = "published";
  else if (intent === "draft") status = "draft";
  else if ((PRODUCT_STATUSES as readonly string[]).includes(str(form, "status"))) status = str(form, "status") as ProductStatus;

  const errors: Record<string, string> = {};
  if (!name.en && !name.km) errors.name = t.admin.products.nameRequired;
  if (weightGrams === "invalid") errors.weight = t.admin.products.invalidWeight;
  if (Object.keys(errors).length) return { errors, message: t.admin.common.fixErrors, at: Date.now() };

  // Only accept ids of real uploads, in the order the owner arranged them.
  const imageIds = form
    .getAll("image_ids")
    .filter((v): v is string => typeof v === "string" && MEDIA_ID_PATTERN.test(v))
    .filter((v, i, all) => all.indexOf(v) === i)
    .filter((v) => db.prepare("SELECT 1 FROM media WHERE id = ?").get(v))
    .slice(0, 20);
  const validCategory = categoryId && db.prepare("SELECT 1 FROM categories WHERE id = ?").get(categoryId) ? categoryId : null;

  const slugInput = str(form, "slug", 100);
  const slug = uniqueSlug("products", slugInput || existing?.slug || name.en || name.km, id ?? undefined);

  const values = {
    slug,
    name_en: name.en,
    name_km: name.km,
    description_en: description.en,
    description_km: description.km,
    material_en: material.en,
    material_km: material.km,
    weight_grams: weightGrams as number | null,
    metal_type: metalType,
    status,
    category_id: validCategory,
    is_featured: featured ? 1 : 0,
    sort,
  };

  let productId = id;
  db.transaction(() => {
    if (existing) {
      db.prepare(
        `UPDATE products SET slug=@slug, name_en=@name_en, name_km=@name_km, description_en=@description_en,
           description_km=@description_km, material_en=@material_en, material_km=@material_km, weight_grams=@weight_grams, metal_type=@metal_type,
           status=@status, category_id=@category_id,
           is_featured=@is_featured, is_sample=@is_sample, sort=@sort, updated_at=datetime('now'),
           published_at = CASE WHEN @status = 'published' AND published_at IS NULL THEN datetime('now') ELSE published_at END
         WHERE id=@id`,
      ).run({ ...values, id, is_sample: bool(form, "is_sample") ? 1 : 0 });
    } else {
      const res = db
        .prepare(
          `INSERT INTO products (slug, name_en, name_km, description_en, description_km, material_en, material_km, weight_grams, metal_type,
             status, category_id, is_featured, sort, published_at)
           VALUES (@slug, @name_en, @name_km, @description_en, @description_km, @material_en, @material_km, @weight_grams, @metal_type,
             @status, @category_id, @is_featured, @sort,
             CASE WHEN @status = 'published' THEN datetime('now') END)`,
        )
        .run(values);
      productId = Number(res.lastInsertRowid);
    }
    db.prepare("DELETE FROM product_images WHERE product_id = ?").run(productId);
    imageIds.forEach((mid, pos) =>
      db.prepare("INSERT INTO product_images (product_id, media_id, position) VALUES (?, ?, ?)").run(productId, mid, pos),
    );
  })();

  if (existing) {
    deleteUnusedMedia(existing.images.map((m) => m.id).filter((m) => !imageIds.includes(m)));
  }
  refresh();
  if (!existing) redirect(`/admin/products/${productId}?created=1`);
  return { ok: true, message: t.admin.common.saved, at: Date.now() };
}

export async function setProductStatus(id: number, status: ProductStatus) {
  await requireOwner();
  if (!(PRODUCT_STATUSES as readonly string[]).includes(status)) return;
  getDb()
    .prepare(
      `UPDATE products SET status = ?, updated_at = datetime('now'),
         published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN datetime('now') ELSE published_at END
       WHERE id = ?`,
    )
    .run(status, status, id);
  refresh();
}

export async function toggleFeatured(id: number) {
  await requireOwner();
  getDb().prepare("UPDATE products SET is_featured = 1 - is_featured, updated_at = datetime('now') WHERE id = ?").run(id);
  refresh();
}

export async function deleteProduct(id: number) {
  await requireOwner();
  const product = getProduct(id);
  if (product) {
    getDb().prepare("DELETE FROM products WHERE id = ?").run(id);
    deleteUnusedMedia(product.images.map((m) => m.id));
  }
  refresh();
  redirect("/admin/products");
}

export async function deleteSampleProducts() {
  await requireOwner();
  removeSampleProducts();
  refresh();
  redirect("/admin?samples=removed");
}

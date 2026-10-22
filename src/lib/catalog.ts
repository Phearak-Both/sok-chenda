import { getDb } from "./db";
import { rowToMedia } from "./media";
import { isMetalType, type MetalFilter } from "./metal";
import type {
  Category,
  Collection,
  Media,
  Product,
  ProductStatus,
} from "./types";

type ProductRow = {
  id: number;
  slug: string;
  name_en: string;
  name_km: string;
  description_en: string;
  description_km: string;
  material_en: string;
  material_km: string;
  weight_grams: number | null;
  metal_type: string | null;
  status: ProductStatus;
  category_id: number | null;
  is_featured: number;
  is_sample: number;
  sort: number;
  updated_at: string;
};

type CollectionRow = {
  id: number;
  slug: string;
  name_en: string;
  name_km: string;
  description_en: string;
  description_km: string;
  image_id: string | null;
  is_published: number;
  sort: number;
};

function hydrateProducts(rows: ProductRow[]): Product[] {
  if (rows.length === 0) return [];
  const db = getDb();
  const ids = rows.map((r) => r.id);
  const marks = ids.map(() => "?").join(",");
  const imageRows = db
    .prepare(
      `SELECT pi.product_id, m.id, m.width, m.height, m.sizes
       FROM product_images pi JOIN media m ON m.id = pi.media_id
       WHERE pi.product_id IN (${marks}) ORDER BY pi.position`,
    )
    .all(...ids) as { product_id: number; id: string; width: number; height: number; sizes: string }[];
  const collectionRows = db
    .prepare(`SELECT product_id, collection_id FROM product_collections WHERE product_id IN (${marks})`)
    .all(...ids) as { product_id: number; collection_id: number }[];

  const images = new Map<number, Media[]>();
  for (const r of imageRows) {
    const list = images.get(r.product_id) ?? [];
    list.push(rowToMedia(r));
    images.set(r.product_id, list);
  }
  const collections = new Map<number, number[]>();
  for (const r of collectionRows) {
    const list = collections.get(r.product_id) ?? [];
    list.push(r.collection_id);
    collections.set(r.product_id, list);
  }

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: { en: r.name_en, km: r.name_km },
    description: { en: r.description_en, km: r.description_km },
    material: { en: r.material_en, km: r.material_km },
    weightGrams: r.weight_grams,
    metalType: isMetalType(r.metal_type) ? r.metal_type : null,
    status: r.status,
    categoryId: r.category_id,
    isFeatured: !!r.is_featured,
    isSample: !!r.is_sample,
    sort: r.sort,
    images: images.get(r.id) ?? [],
    collectionIds: collections.get(r.id) ?? [],
    updatedAt: r.updated_at,
  }));
}

export type ProductSort = "featured" | "newest" | "weight_asc" | "weight_desc";

export type ProductQuery = {
  /** "public" = published only. "active" = everything except archived. */
  status?: ProductStatus | "public" | "active" | "all";
  q?: string;
  categoryId?: number;
  collectionId?: number;
  metal?: MetalFilter;
  featured?: boolean;
  sort?: ProductSort;
  limit?: number;
  offset?: number;
  excludeId?: number;
};

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (c) => "\\" + c);
}

export function listProducts(query: ProductQuery = {}): { items: Product[]; total: number } {
  const where: string[] = [];
  const params: (string | number)[] = [];
  const status = query.status ?? "public";

  if (status === "public") where.push("p.status = 'published'");
  else if (status === "active") where.push("p.status != 'archived'");
  else if (status !== "all") {
    where.push("p.status = ?");
    params.push(status);
  }
  if (query.q?.trim()) {
    const like = `%${escapeLike(query.q.trim())}%`;
    where.push(
      `(p.name_en LIKE ? ESCAPE '\\' OR p.name_km LIKE ? ESCAPE '\\' OR p.description_en LIKE ? ESCAPE '\\'
        OR p.description_km LIKE ? ESCAPE '\\' OR p.material_en LIKE ? ESCAPE '\\' OR p.material_km LIKE ? ESCAPE '\\'
        OR c.name_en LIKE ? ESCAPE '\\' OR c.name_km LIKE ? ESCAPE '\\')`,
    );
    params.push(like, like, like, like, like, like, like, like);
  }
  if (query.categoryId) {
    where.push("p.category_id = ?");
    params.push(query.categoryId);
  }
  if (query.collectionId) {
    where.push("EXISTS (SELECT 1 FROM product_collections pc WHERE pc.product_id = p.id AND pc.collection_id = ?)");
    params.push(query.collectionId);
  }
  if (query.metal === "platinum") where.push("p.metal_type LIKE 'platinum\\_%' ESCAPE '\\'");
  else if (query.metal) {
    where.push("p.metal_type = ?");
    params.push(query.metal);
  }
  if (query.featured) where.push("p.is_featured = 1");
  if (query.excludeId) {
    where.push("p.id != ?");
    params.push(query.excludeId);
  }

  const order = {
    featured: "p.is_featured DESC, p.sort ASC, p.id DESC",
    newest: "COALESCE(p.published_at, p.created_at) DESC, p.id DESC",
    // Products without a weight go last.
    weight_asc: "p.weight_grams IS NULL, p.weight_grams ASC, p.id DESC",
    weight_desc: "p.weight_grams IS NULL, p.weight_grams DESC, p.id DESC",
  }[query.sort ?? "featured"];

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const from = `FROM products p LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`;
  const db = getDb();
  const total = (db.prepare(`SELECT COUNT(*) AS n ${from}`).get(...params) as { n: number }).n;
  const rows = db
    .prepare(`SELECT p.* ${from} ORDER BY ${order} LIMIT ? OFFSET ?`)
    .all(...params, query.limit ?? 200, query.offset ?? 0) as ProductRow[];
  return { items: hydrateProducts(rows), total };
}

export function getProduct(id: number): Product | null {
  const row = getDb().prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
  return row ? hydrateProducts([row])[0] : null;
}

export function getProductBySlug(slug: string): Product | null {
  const row = getDb().prepare("SELECT * FROM products WHERE slug = ?").get(slug) as ProductRow | undefined;
  return row ? hydrateProducts([row])[0] : null;
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const sameCategory = product.categoryId
    ? listProducts({ categoryId: product.categoryId, excludeId: product.id, limit }).items
    : [];
  if (sameCategory.length >= limit) return sameCategory;
  const others = listProducts({ excludeId: product.id, limit: limit * 2 }).items.filter(
    (p) => !sameCategory.some((s) => s.id === p.id),
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export function countProductsByStatus() {
  const rows = getDb()
    .prepare("SELECT status, COUNT(*) AS n FROM products GROUP BY status")
    .all() as { status: ProductStatus; n: number }[];
  const out = { draft: 0, published: 0, archived: 0, sample: 0 };
  for (const r of rows) out[r.status] = r.n;
  out.sample = (getDb().prepare("SELECT COUNT(*) AS n FROM products WHERE is_sample = 1").get() as { n: number }).n;
  return out;
}

// ---------- Categories ----------

export function listCategories(): (Category & { productCount: number; cover: Media | null })[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'published') AS product_count
       FROM categories c ORDER BY c.sort, c.id`,
    )
    .all() as { id: number; slug: string; name_en: string; name_km: string; sort: number; product_count: number }[];
  const coverStmt = db.prepare(
    `SELECT m.id, m.width, m.height, m.sizes FROM products p
     JOIN product_images pi ON pi.product_id = p.id AND pi.position = 0
     JOIN media m ON m.id = pi.media_id
     WHERE p.category_id = ? AND p.status = 'published'
     ORDER BY p.is_featured DESC, p.sort, p.id DESC LIMIT 1`,
  );
  return rows.map((r) => {
    const cover = coverStmt.get(r.id) as { id: string; width: number; height: number; sizes: string } | undefined;
    return {
      id: r.id,
      slug: r.slug,
      name: { en: r.name_en, km: r.name_km },
      sort: r.sort,
      productCount: r.product_count,
      cover: cover ? rowToMedia(cover) : null,
    };
  });
}

// ---------- Collections ----------

function toCollection(r: CollectionRow): Collection {
  const media = r.image_id
    ? (getDb().prepare("SELECT id, width, height, sizes FROM media WHERE id = ?").get(r.image_id) as
        | { id: string; width: number; height: number; sizes: string }
        | undefined)
    : undefined;
  return {
    id: r.id,
    slug: r.slug,
    name: { en: r.name_en, km: r.name_km },
    description: { en: r.description_en, km: r.description_km },
    image: media ? rowToMedia(media) : null,
    isPublished: !!r.is_published,
    sort: r.sort,
  };
}

export function listCollections(opts: { publishedOnly?: boolean } = {}): (Collection & { productCount: number })[] {
  const rows = getDb()
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM product_collections pc JOIN products p ON p.id = pc.product_id
                    WHERE pc.collection_id = c.id AND p.status = 'published') AS product_count
       FROM collections c ${opts.publishedOnly ? "WHERE c.is_published = 1" : ""}
       ORDER BY c.sort, c.id`,
    )
    .all() as (CollectionRow & { product_count: number })[];
  return rows.map((r) => ({ ...toCollection(r), productCount: r.product_count }));
}

export function getCollection(id: number): Collection | null {
  const row = getDb().prepare("SELECT * FROM collections WHERE id = ?").get(id) as CollectionRow | undefined;
  return row ? toCollection(row) : null;
}

export function getCollectionBySlug(slug: string): Collection | null {
  const row = getDb().prepare("SELECT * FROM collections WHERE slug = ?").get(slug) as CollectionRow | undefined;
  return row ? toCollection(row) : null;
}

// ---------- Slugs ----------

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** A URL-safe slug that is unique in `table`, ignoring the row with `exceptId`. */
export function uniqueSlug(table: "products" | "collections" | "categories", source: string, exceptId?: number) {
  const base = slugify(source) || `item-${Date.now().toString(36)}`;
  const exists = getDb().prepare(`SELECT 1 FROM ${table} WHERE slug = ? AND id != ?`);
  let slug = base;
  for (let i = 2; exists.get(slug, exceptId ?? -1); i++) slug = `${base}-${i}`;
  return slug;
}

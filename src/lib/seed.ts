import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { uniqueSlug } from "./catalog";
import { getDb } from "./db";
import { deleteUnusedMedia, saveImage } from "./media";
import type { MetalType } from "./metal";
import type { Media } from "./types";

/** Region of the cover photo: centre x, centre y, height, and width/height ratio. */
type Region = [cx: number, cy: number, h: number, ratio?: number];

const COVER_PATH = path.join(process.cwd(), "cover.jpg");

async function cropCover(cover: Buffer, [cx, cy, h, ratio = 0.8]: Region) {
  const meta = await sharp(cover).metadata();
  const W = meta.width!;
  const H = meta.height!;
  const height = Math.min(Math.round(h), H);
  const width = Math.min(Math.round(h * ratio), W);
  const left = Math.max(0, Math.min(W - width, Math.round(cx - width / 2)));
  const top = Math.max(0, Math.min(H - height, Math.round(cy - height / 2)));
  return sharp(cover).extract({ left, top, width, height }).jpeg({ quality: 95 }).toBuffer();
}

const CATEGORIES = [
  { slug: "necklaces", en: "Necklaces", km: "ខ្សែក" },
  { slug: "bracelets-bangles", en: "Bracelets & Bangles", km: "ខ្សែដៃ និងកងដៃ" },
  { slug: "rings", en: "Rings", km: "ចិញ្ចៀន" },
  { slug: "earrings", en: "Earrings", km: "ក្រវិល" },
];

type SampleProduct = {
  en: string;
  km: string;
  descEn: string;
  descKm: string;
  category: string;
  /** Grams; shown as ដំឡឹង / ជី / ហ៊ុន. Invented, like the rest of the sample data. */
  weightGrams: number;
  /** Invented too, so the metal filter has something to show. */
  metal: MetalType;
  featured: boolean;
  images: Region[];
};

const SAMPLES: SampleProduct[] = [
  {
    en: "Filigree Leaf Necklace",
    km: "ខ្សែកក្បាច់ស្លឹកឈើ",
    descEn: "A beaded gold chain finished with a cluster of filigree leaves and small hanging drops.",
    descKm: "ខ្សែកមាសក្បាច់គ្រាប់ ព្យួរដោយក្បាច់ស្លឹកឈើជាចង្កោម និងគ្រាប់តូចៗព្យួរចុះ។",
    category: "necklaces",
    weightGrams: 11.25,
    metal: "kilo",
    featured: true,
    images: [[271, 482, 500], [271, 620, 320]],
  },
  {
    en: "Twin-Strand Square Necklace",
    km: "ខ្សែកពីរជាន់ ក្បាច់ការ៉េ",
    descEn: "Two layered chains — one beaded, one fine — meeting at an openwork square centrepiece.",
    descKm: "ខ្សែពីរជាន់ — មួយក្បាច់គ្រាប់ មួយទៀតល្អិត — ភ្ជាប់ដោយក្បាច់កណ្ដាលរាងការ៉េក្បាច់ប្រហោង។",
    category: "necklaces",
    weightGrams: 18.75,
    metal: "platinum_7",
    featured: true,
    images: [[889, 470, 680], [1077, 640, 330]],
  },
  {
    en: "Tasselled Bridal Necklace",
    km: "ខ្សែកកូនក្រមុំ មានរំយោល",
    descEn: "A double necklace with a fan-shaped centrepiece and fringe of tassels, made for the wedding day.",
    descKm: "ខ្សែកពីរជាន់ មានក្បាច់កណ្ដាលរាងផ្លិត និងរំយោលព្យួរ សម្រាប់ថ្ងៃមង្គលការ។",
    category: "necklaces",
    weightGrams: 45,
    metal: "kilo",
    featured: true,
    images: [[1973, 497, 680], [1853, 620, 330]],
  },
  {
    en: "Royal Collar Necklace",
    km: "ខ្សែកបែបរាជវាំង",
    descEn: "A broad collar of patterned links paired with a long chain of medallions.",
    descKm: "ខ្សែកធំៗក្បាច់ច្រវាក់ ផ្គូផ្គងជាមួយខ្សែវែងមានមេដាយ។",
    category: "necklaces",
    weightGrams: 56.25,
    metal: "kilo",
    featured: false,
    images: [[2651, 557, 700], [2471, 708, 350]],
  },
  {
    en: "Woven Wide Bangle",
    km: "កងដៃធំ ក្បាច់ត្បាញ",
    descEn: "A wide bangle with a woven, textured surface that catches the light from every angle.",
    descKm: "កងដៃធំ មានផ្ទៃក្បាច់ត្បាញ ដែលចាំងពន្លឺពីគ្រប់ទិសទី។",
    category: "bracelets-bangles",
    weightGrams: 15,
    metal: "platinum_7vn",
    featured: true,
    images: [[818, 165, 330], [850, 330, 560]],
  },
  {
    en: "Engraved Wide Cuff",
    km: "កងដៃធំ ឆ្លាក់ក្បាច់",
    descEn: "A bold cuff engraved with crossing geometric patterns.",
    descKm: "កងដៃធំ ឆ្លាក់ក្បាច់ធរណីមាត្រឆ្លាស់គ្នា។",
    category: "bracelets-bangles",
    weightGrams: 22.5,
    metal: "platinum_7",
    featured: false,
    images: [[2825, 172, 345], [2700, 420, 600]],
  },
  {
    en: "Blossom Filigree Ring",
    km: "ចិញ្ចៀនក្បាច់ផ្កា",
    descEn: "A domed ring of layered filigree petals.",
    descKm: "ចិញ្ចៀនរាងប៉ោង ក្បាច់ផ្កាត្រួតគ្នាជាច្រើនជាន់។",
    category: "rings",
    weightGrams: 5.625,
    metal: "platinum_5",
    featured: true,
    images: [[690, 655, 380], [768, 650, 220]],
  },
  {
    en: "Lotus Drop Earrings",
    km: "ក្រវិលព្យួរ ក្បាច់ផ្កាឈូក",
    descEn: "Long drop earrings with a flower stud and an openwork diamond-shaped drop.",
    descKm: "ក្រវិលព្យួរវែង មានក្បាលរាងផ្កា និងគ្រឿងព្យួររាងពេជ្រក្បាច់ប្រហោង។",
    category: "earrings",
    weightGrams: 7.5,
    metal: "platinum_7",
    featured: true,
    images: [[685, 889, 440], [798, 889, 270]],
  },
  {
    en: "Peacock Plume Earrings",
    km: "ក្រវិលក្បាច់កន្ទុយក្ងោក",
    descEn: "Sculptural earrings shaped like a peacock's plume, with fine feathered detail.",
    descKm: "ក្រវិលរាងកន្ទុយក្ងោក មានក្បាច់រោមល្អិតល្អន់។",
    category: "earrings",
    weightGrams: 9.375,
    metal: "kilo",
    featured: false,
    images: [[1446, 663, 450], [1522, 620, 250]],
  },
  {
    en: "Dome Cluster Ring",
    km: "ចិញ្ចៀនមូលក្បាច់គ្រាប់",
    descEn: "A rounded ring covered in tiny gold beads.",
    descKm: "ចិញ្ចៀនរាងមូល គ្របដោយគ្រាប់មាសតូចៗ។",
    category: "rings",
    weightGrams: 3.75,
    metal: "platinum_7vn",
    featured: true,
    images: [[1431, 512, 270], [2395, 1009, 500]],
  },
  {
    en: "Twisted Rope Bangles",
    km: "កងដៃក្បាច់ខ្សែពួរ",
    descEn: "Slim bangles in twisted and beaded designs, lovely worn together.",
    descKm: "កងដៃស្ដើងៗ ក្បាច់ខ្សែពួរ និងក្បាច់គ្រាប់ ស្អាតនៅពេលពាក់ជាមួយគ្នា។",
    category: "bracelets-bangles",
    weightGrams: 13.125,
    metal: "platinum_5",
    featured: true,
    images: [[1220, 1055, 600], [1205, 1085, 330]],
  },
];

export function seedStructure() {
  const db = getDb();
  const hasCategories = db.prepare("SELECT 1 FROM categories LIMIT 1").get();
  if (!hasCategories) {
    const insert = db.prepare("INSERT INTO categories (slug, name_en, name_km, sort) VALUES (?, ?, ?, ?)");
    CATEGORIES.forEach((c, i) => insert.run(c.slug, c.en, c.km, i));
  }
}

export async function seedSampleProducts() {
  const db = getDb();
  const cover = fs.readFileSync(COVER_PATH);
  const categoryId = (slug: string) =>
    (db.prepare("SELECT id FROM categories WHERE slug = ?").get(slug) as { id: number } | undefined)?.id ?? null;

  for (const [i, p] of SAMPLES.entries()) {
    const media: Media[] = [];
    for (const region of p.images) media.push(await saveImage(await cropCover(cover, region), { isSample: true }));

    db.transaction(() => {
      const { lastInsertRowid } = db
        .prepare(
          `INSERT INTO products (slug, name_en, name_km, description_en, description_km, material_en, material_km,
             weight_grams, metal_type, status, category_id, is_featured, is_sample, sort, published_at)
           VALUES (?, ?, ?, ?, ?, 'Yellow gold', 'មាសលឿង', ?, ?, 'published', ?, ?, 1, ?, datetime('now'))`,
        )
        .run(
          uniqueSlug("products", p.en),
          p.en,
          p.km,
          p.descEn,
          p.descKm,
          p.weightGrams,
          p.metal,
          categoryId(p.category),
          p.featured ? 1 : 0,
          i,
        );
      const productId = Number(lastInsertRowid);
      media.forEach((m, pos) =>
        db.prepare("INSERT INTO product_images (product_id, media_id, position) VALUES (?, ?, ?)").run(productId, m.id, pos),
      );
    })();
  }
}

export function removeSampleProducts() {
  const db = getDb();
  const mediaIds = (
    db
      .prepare(
        `SELECT pi.media_id FROM product_images pi JOIN products p ON p.id = pi.product_id WHERE p.is_sample = 1`,
      )
      .all() as { media_id: string }[]
  ).map((r) => r.media_id);
  const { changes } = db.prepare("DELETE FROM products WHERE is_sample = 1").run();
  deleteUnusedMedia(mediaIds);
  return changes;
}

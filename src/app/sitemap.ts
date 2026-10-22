import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const pages = ["", "/collections", "/about", "/contact"].map((p) => ({ url: `${base}${p}` }));
  const products = listProducts({ limit: 5000 }).items.map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: p.updatedAt.replace(" ", "T") + "Z",
  }));
  return [...pages, ...products];
}

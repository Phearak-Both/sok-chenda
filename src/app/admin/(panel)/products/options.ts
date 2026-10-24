import { listCategories } from "@/lib/catalog";
import { pick, type Locale } from "@/lib/types";

export function productFormOptions(locale: Locale) {
  return {
    categories: listCategories().map((c) => ({ value: c.id, label: pick(c.name, locale) })),
  };
}

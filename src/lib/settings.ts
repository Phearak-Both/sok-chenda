import { getDb } from "./db";
import type { MapPin } from "./maps";
import { DEFAULT_PRICES, type PriceSettings } from "./prices";
import type { LocalizedText } from "./types";

const L = (en: string, km: string): LocalizedText => ({ en, km });

export type StoreSettings = {
  phone: string;
  /** Digits only, international format without "+" (e.g. 855…). */
  whatsapp: string;
  /** Telegram username without "@". */
  telegram: string;
  email: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  address: LocalizedText;
  hours: LocalizedText;
  mapUrl: string;
  /** Shop location read from mapUrl when it was saved; drives the embedded map. */
  mapPin: MapPin | null;
};

export type HomeSettings = {
  hero: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    subtitle: LocalizedText;
    cta: LocalizedText;
    imageId: string | null;
  };
  intro: { title: LocalizedText; body: LocalizedText };
  story: { title: LocalizedText; body: LocalizedText };
  /** Set once the owner has saved this page, so the dashboard stops flagging starter text. */
  reviewed: boolean;
};

export type AboutSettings = {
  title: LocalizedText;
  body: LocalizedText;
  imageId: string | null;
  reviewed: boolean;
};

export type SettingsMap = {
  store: StoreSettings;
  home: HomeSettings;
  about: AboutSettings;
  prices: PriceSettings;
};

// Starter copy only describes what the logo itself says ("all kinds of jewelry");
// the owner is prompted to review it in the dashboard.
export const DEFAULT_SETTINGS: SettingsMap = {
  prices: DEFAULT_PRICES,
  store: {
    phone: "",
    whatsapp: "",
    telegram: "",
    email: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    address: L("", ""),
    hours: L("", ""),
    mapUrl: "",
    mapPin: null,
  },
  home: {
    hero: {
      eyebrow: L("Fine jewelry", "គ្រឿងអលង្ការប្រណីត"),
      title: L("Where Elegant Taste Meets Precious Memories", "រសនិយមដ៏ប្រណិត ជាមួយអនុស្សាវរីយ៍ដ៏មានតម្លៃ"),
      subtitle: L(
        "Necklaces, bangles, rings and earrings — chosen with care.",
        "ខ្សែក កងដៃ ចិញ្ចៀន និងក្រវិល ដែលបានជ្រើសរើសដោយយកចិត្តទុកដាក់។",
      ),
      cta: L("Explore the collection", "មើលគ្រឿងអលង្ការ"),
      imageId: null,
    },
    intro: {
      title: L("For Every Precious Moment", "សម្រាប់គ្រប់ពេលវេលាដ៏មានតម្លៃ"),
      body: L(
        "From everyday luxury to unforgettable special occasions, Sok Chenda offers beautiful jewelry to elevate your style and become part of your most treasured memories.",
        "ពីភាពប្រណិតប្រចាំថ្ងៃ រហូតដល់ថ្ងៃពិសេសដែលមិនអាចបំភ្លេចបាន សុខ ចិន្ដា នាំមកជូននូវគ្រឿងអលង្ការដ៏ស្រស់ស្អាត ដើម្បីបន្ថែមភាពលេចធ្លោ និងរក្សាអនុស្សាវរីយ៍ដ៏មានតម្លៃរបស់អ្នក។",
      ),
    },
    story: {
      title: L("Visit the boutique", "សូមអញ្ជើញមកកាន់ហាង"),
      body: L(
        "See each piece in person and let us help you find the right one — for yourself, or for someone you love.",
        "សូមអញ្ជើញមកទស្សនាគ្រឿងអលង្ការដ៏ស្រស់ស្អាតដោយផ្ទាល់នៅហាង សុខ ចិន្ដា។ យើងខ្ញុំរីករាយក្នុងការផ្តល់ជូននូវការណែនាំយ៉ាងយកចិត្តទុកដាក់ ដើម្បីជួយលោកអ្នកស្វែងរកគ្រឿងអលង្ការដែលស័ក្តិសមបំផុត សម្រាប់ខ្លួនឯង ឬជាកាដូដ៏មានអត្ថន័យជូនមនុស្សជាទីស្រឡាញ់។",
      ),
    },
    reviewed: false,
  },
  about: {
    title: L("About Us", "អំពីហាង"),
    body: L(
      "At Sok Chenda, we offer a beautiful selection of jewelry, including necklaces, bangles, bracelets, rings, and earrings, carefully suited to a variety of styles and occasions. We also welcome custom orders, giving you the freedom to choose designs that reflect your personal taste.\n\nWhether you are looking for the perfect piece, have questions about our collection, or would like to visit our store, we are always happy to assist you. Please reach out through the contact details provided on our website.",
      "ហាងសុខ ចិន្ដា ផ្តល់ជូននូវជម្រើសគ្រឿងអលង្ការចម្រុះម៉ូដ រួមមាន ខ្សែក កងដៃ ខ្សែដៃ ចិញ្ចៀន និងក្រវិល សម្រាប់បំពេញតម្រូវការ និងរសនិយមរបស់លោកអ្នក។ យើងខ្ញុំក៏ទទួលធ្វើគ្រឿងអលង្ការតាមការកុម្ម៉ង់ ដើម្បីឱ្យលោកអ្នកអាចជ្រើសរើសម៉ូដដែលខ្លួនពេញចិត្ត។\n\nមិនថាលោកអ្នកត្រូវការជំនួយក្នុងការជ្រើសរើសគ្រឿងអលង្ការ ចង់ស្វែងយល់បន្ថែមអំពីផលិតផល ឬមានបំណងមកហាងផ្ទាល់ យើងខ្ញុំត្រៀមខ្លួនជានិច្ចក្នុងការផ្តល់ព័ត៌មាន និងជួយណែនាំដោយក្តីរីករាយ។ សូមទាក់ទងមកយើងខ្ញុំតាមព័ត៌មានទំនាក់ទំនងនៅលើគេហទំព័រនេះ។",
    ),
    imageId: null,
    reviewed: false,
  },
};

function merge<T>(defaults: T, stored: unknown): T {
  if (stored === null || typeof stored !== "object" || Array.isArray(stored)) {
    return (stored === undefined ? defaults : (stored as T));
  }
  if (defaults === null || typeof defaults !== "object") return stored as T;
  const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const [k, v] of Object.entries(stored as Record<string, unknown>)) {
    out[k] = k in out ? merge(out[k], v) : v;
  }
  return out as T;
}

export function getSetting<K extends keyof SettingsMap>(key: K): SettingsMap[K] {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  if (!row) return structuredClone(DEFAULT_SETTINGS[key]);
  try {
    return merge(structuredClone(DEFAULT_SETTINGS[key]), JSON.parse(row.value));
  } catch {
    return structuredClone(DEFAULT_SETTINGS[key]);
  }
}

export function setSetting<K extends keyof SettingsMap>(key: K, value: SettingsMap[K]) {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .run(key, JSON.stringify(value));
}

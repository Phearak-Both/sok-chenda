# sok-chenda
A freelance web development project for Sok Chenda (សុខ ចិន្ដា), featuring a bilingual luxury jewelry storefront and a private product management dashboard.

This README is the handover document: what the site does, how the owner runs it day to day, how to take it live, and how to keep it healthy.

## What's inside

- **Storefront**: homepage, a Collections page (`/collections`) listing all jewelry with search, collection and metal filters and a weight sort, product pages with a photo gallery, About and Contact. Each product belongs to one collection (Necklaces, Bracelets & Bangles, Rings, Earrings); the homepage shows a card per collection, which opens the Collections page filtered to it. English and Khmer. Products show their weight; prices are not shown.
- **Gold price bar**: a slim scrolling bar above the header shows the buy/sell prices the owner enters under **Gold prices** in the dashboard, with the time they were saved. Prices are never fetched or invented; with none entered it asks visitors to contact the shop. It pauses on hover and stops for visitors who prefer reduced motion.
- **Shop map**: the homepage Visit section shows an embedded Google Map of the shop (Google's free embed, no API key) when **Store settings → Map link** holds a Google Maps share link. On save the dashboard reads the shop's pin from the link, following `maps.app.goo.gl` short links when the link changes; any other host is never fetched. Without a usable link the section shows the Visit photo instead.
- **Owner dashboard** at `/admin`: products (photos, weight, metal type, publish/unpublish/archive, preview), collections, homepage and About text, gold prices, contact details and social links, and the owner's password.
- **Telegram bot** (optional): the owner updates the gold prices from a form inside Telegram (see [Telegram bot](#telegram-bot)).
- Changes made in the dashboard appear on the website immediately. No redeploy is needed.

**Stack:** Next.js 15 (App Router, TypeScript), SQLite via better-sqlite3, sharp for image processing, Tailwind CSS 4.
The database and uploaded photos live in one folder (`data/` by default).

## Handover checklist

Before the site goes live:

- [ ] Deploy on Render from `main` (see [Render](#render)) and set `SITE_URL`, `OWNER_EMAIL` and a strong `OWNER_PASSWORD`.
- [ ] Sign in at `/admin`, then delete `OWNER_PASSWORD` from Render → Environment.
- [ ] Add the shop's own domain and update `SITE_URL` to it.
- [ ] **Store settings**: phone, WhatsApp, Telegram, email, address, opening hours, social links, Google Maps link.
- [ ] **Homepage & pages**: replace the starter text and photos.
- [ ] **Collections**: rename, reorder or remove the starter collections.
- [ ] Add the real products, then **Overview → Delete all sample products** if any are left.
- [ ] **Gold prices**: enter today's prices (or set up the [Telegram bot](#telegram-bot)).
- [ ] Have a native speaker read the Khmer text.
- [ ] Check the site on a phone, in both languages.

## Owner's guide

Everything is done in the dashboard at `/admin`; changes appear on the website straight away.

| To… | Go to |
|-----|-------|
| Add or edit a product, its photos and weight | **Products** → **New product**, or click a product |
| Hide a product without deleting it | **Unpublish** in the product list, or set its status to Draft or Archived |
| See a product before publishing | **Preview** (only you can see drafts) |
| Feature a product on the homepage | The star in the product list, or **Feature this product on the homepage** in the product |
| Add, rename or reorder collections | **Collections** |
| Change homepage or About text and photos | **Homepage & pages** |
| Update gold prices | **Gold prices**, or the Telegram bot |
| Change phone, address, hours, map, social links | **Store settings** |
| Change the dashboard password | **Account** |

Photos: upload them straight from a phone. They are resized automatically, and the location data phones add is removed.

## Running it locally

Requires Node.js 20 or newer.

```bash
npm install
npm run setup          # creates the database, starter collections and sample products
npm run owner:create   # choose the owner's email and password
npm run dev            # http://localhost:3000  ·  dashboard at http://localhost:3000/admin
```

`npm run setup -- --no-samples` sets up without the sample products.

## Sample content

The 12 sample products are labelled **Sample** on the website and in the dashboard.
Their photos are cropped from `cover.jpg`. Their names, descriptions and weights are invented.
Remove them all at once from **Dashboard → Overview → Delete all sample products**.
To keep one as a real product, edit it and untick **Sample product**.

The starter collections (Necklaces, Bracelets & Bangles, Rings, Earrings) and the homepage/About text are ordinary content the owner can edit or delete.
The Khmer wording was written for this project and should be reviewed by a native speaker.

## Logo

The logo lives in `public/brand/`: `logo.webp`, used on the site, and a larger `logo.png`. Both have transparent backgrounds.
The favicons are `src/app/icon.png` and `src/app/apple-icon.png`.

## Language

- Visitors switch between `EN | ខ្មែរ` in the header. The choice is saved in a cookie.
  First-time visitors whose browser asks for Khmer see Khmer.
- Product text is entered in both languages. If the Khmer text is empty, the English text is shown, and vice versa.

## Weight

The owner enters a weight in any of these units, and switching units converts the number automatically:

| Unit    | Equals           | Grams    |
|---------|------------------|----------|
| ដំឡឹង   | 10 ជី            | 37.5 g   |
| ជី      | 10 ហ៊ុន          | 3.75 g   |
| ហ៊ុន    |                  | 0.375 g  |

The weight is stored in grams. Khmer visitors see Khmer units, e.g. `1 ដំឡឹង 2 ជី 5 ហ៊ុន`; English visitors see grams, e.g. `46.875 g`.
The gold price bar follows the same rule: `ក្នុង 1 ជី` in Khmer, `per 3.75 g` in English.
The Collections page can be sorted by weight.
In the code and database these collections are called *categories* (`categories` table, `?category=` links, `/admin/categories`). Prices are not shown anywhere. The database still has the old price columns, unused.

## Deploying

The site needs a server with a **persistent disk** for the `data/` folder: a VPS, Render or Fly.io with a disk.
Serverless hosting such as Vercel will not keep the database or uploaded photos.

```bash
npm ci
npm run build
npm run setup -- --no-samples   # safe on every start; only creates what's missing
npm run owner:create            # first deploy only (or OWNER_EMAIL=… OWNER_PASSWORD=… npm run owner:create)
npm start                       # serves on port 3000
```

Environment variables (see `.env.example`):

| Variable   | Purpose |
|------------|---------|
| `SITE_URL` | Public address, e.g. `https://sokchenda.com`. Used in WhatsApp inquiry links, the sitemap and social previews. |
| `DATA_DIR` | Where the database and photos are stored (default `./data`). Point it at the persistent disk. |
| `OWNER_EMAIL`, `OWNER_PASSWORD` | Used by `npm run owner:create` without prompting. Remove the password once the login exists. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_OWNER_IDS` | Optional: the [Telegram bot](#telegram-bot). |

Serve the site over HTTPS (any reverse proxy or the host's built-in TLS). Login cookies are marked secure when the site runs over HTTPS.

### Render

`render.yaml` sets up the **live site**: a Starter instance (paid; the free plan has no disk) with a 1 GB persistent disk at `/data` (`DATA_DIR=/data`) for the database and photos. Render takes daily snapshots of the disk. The first start creates the starter collections, without sample products.

1. Render → **New → Blueprint** → connect this repository and pick the `main` branch. Render reads `render.yaml`.
2. Fill in the variables Render asks for:
   - `SITE_URL`: the site's address, e.g. `https://sok-chenda.onrender.com` (you can set it after the first deploy shows the address).
   - `OWNER_EMAIL` and `OWNER_PASSWORD` (at least the minimum length): the dashboard login.
3. Open the site, sign in to the dashboard at `/admin`, then **delete `OWNER_PASSWORD`** in Render → Environment. While it is set, every start resets the password to it and signs out every session; change the password in the dashboard instead.
4. Add your own domain under **Settings → Custom Domains** and update `SITE_URL`.

## Telegram bot

The owner updates the gold prices in a form inside Telegram. **💰 ប្ដូរតម្លៃមាស** (the button in the bot's reply) or the bot's menu button **💰 តម្លៃមាស** beside the message box opens it: every metal's sell and buy price on one screen, changed fields highlighted with the old price beside them, and Telegram's own **ផ្សព្វផ្សាយ** (Publish) button at the bottom. The website's price bar updates straight away and the bot sends a confirmation. The bot and the form are in Khmer only and follow the Telegram colour theme.

The form (`/telegram/prices`) only works when opened from Telegram; the server checks Telegram's signature and the owner's ID before saving. It needs an `https://` `SITE_URL`. The bot does nothing else: any message gets a button that opens the form. (Telegram doesn't sign a form opened from a button under the message box, so the bot doesn't use one; `/start` removes the one older versions added.)

Setting it up:

1. In Telegram, message **@BotFather** → `/newbot` → choose a name and a username ending in `bot`. BotFather replies with a **token**.
2. In the server's settings (Render → Environment): `TELEGRAM_BOT_TOKEN` (the token), `TELEGRAM_WEBHOOK_SECRET` (make up 16+ letters and digits) and `SITE_URL` (the site's `https://` address, no trailing slash). After the next start the log shows `Telegram webhook set to …`, or why it couldn't.
3. Message the bot. It replies with your **Telegram ID**. Add it as `TELEGRAM_OWNER_IDS` (several people: comma-separated, e.g. `123456789,987654321`).
4. Message the bot again and tap **💰 ប្ដូរតម្លៃមាស**.

Only the IDs in `TELEGRAM_OWNER_IDS` can change prices. `npm run telegram:webhook` re-registers the bot by hand.

The prices are stored in the database, so on a server without a persistent disk they are lost at each restart.

## Backups

All products, settings, prices and photos are in the `DATA_DIR` folder; the code holds none of them.

- **Render** snapshots the disk daily. Restore one under the service's **Disks** settings.
- **A copy of your own**: download the whole folder, including `sokchenda.db-wal` and `sokchenda.db-shm` if present (the database keeps recent changes there). For a guaranteed-consistent copy, take it while the site is stopped.
- **Restoring** onto another server: put the folder back, point `DATA_DIR` at it, and start the site.

## Maintenance

- **Security updates**: every few months, run `npm audit` and `npm update`, check that `npm run build` passes, and deploy. Major-version upgrades (Next.js 16, etc.) need testing first.
- **Node.js**: Render uses Node 22 (`NODE_VERSION` in `render.yaml`); the site needs 20 or newer.
- **Checks**: `npm run lint` type-checks the code; `npm run build` must pass before deploying.
- **Logs**: Render → the service → **Logs** shows start-up messages, the Telegram webhook status, and errors.

## Security notes

- The owner password is hashed with scrypt. Sessions are random tokens stored hashed, in httpOnly cookies that expire after 30 days.
- Every dashboard page and action checks the session on the server. Repeated failed logins are blocked for 15 minutes.
- Uploads are re-encoded with sharp. Location data and other metadata are stripped, and non-images are rejected.
- The Telegram webhook checks a shared secret, and the price form checks Telegram's signature and `TELEGRAM_OWNER_IDS` before saving.
- Pages are sent with security headers (HTTPS-only, no framing by other sites, no MIME sniffing).
- Forgotten password: run `npm run owner:create` on the server with the same email to set a new one (on Render, from the service's **Shell**). This signs out all devices.

## Project layout

```
src/app/(site)/      public pages
src/app/admin/       dashboard pages and server actions
src/app/telegram/    the price form opened inside Telegram
src/app/api/         Telegram webhook and price-form endpoint
src/app/media/       serves uploaded photos
src/components/      site/, admin/ and telegram/ components, icons
src/i18n/            en.ts and km.ts: every interface string, in both languages
src/lib/             database, catalog queries, auth, media, settings, gold weights
scripts/             setup, owner creation, sample seeding, Telegram webhook
```

To add a language string, add it to `src/i18n/en.ts`. TypeScript then requires the matching entry in `km.ts`.

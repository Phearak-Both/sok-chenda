# sok-chenda
A freelance web development project for Sok Chenda (សុខ ចិន្ដា), featuring a bilingual luxury jewelry storefront and a private product management dashboard.

## What's inside

- **Storefront**: homepage, a Collections page (`/collections`) listing all jewelry with search, collection and metal filters and a weight sort, product pages with a photo gallery, About and Contact. Each product belongs to one collection (Necklaces, Bracelets & Bangles, Rings, Earrings); the homepage shows a card per collection, which opens the Collections page filtered to it. English and Khmer. Products show their weight; prices are not shown.
- **Gold price bar**: a slim scrolling bar above the header shows the buy/sell prices the owner enters under **Gold prices** in the dashboard, with the time they were saved. Prices are never fetched or invented; with none entered it asks visitors to contact the shop. It pauses on hover and stops for visitors who prefer reduced motion.
- **Shop map**: the homepage Visit section shows an embedded Google Map of the shop (Google's free embed, no API key) when **Store settings → Map link** holds a Google Maps share link. On save the dashboard reads the shop's pin from the link, following `maps.app.goo.gl` short links when the link changes; any other host is never fetched. Without a usable link the section shows the Visit photo instead.
- **Owner dashboard** at `/admin`: products (photos, weight, metal type, publish/unpublish/archive, preview), collections, homepage and About text, contact details and social links.
- Changes made in the dashboard appear on the website immediately. No redeploy is needed.

**Stack:** Next.js 15 (App Router, TypeScript), SQLite via better-sqlite3, sharp for image processing, Tailwind CSS 4.
The database and uploaded photos live in one folder (`data/` by default).

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
npm run setup            # first deploy only
npm run owner:create     # first deploy only (or OWNER_EMAIL=… OWNER_PASSWORD=… npm run owner:create)
npm start                # serves on port 3000
```

Environment variables (see `.env.example`):

| Variable   | Purpose |
|------------|---------|
| `SITE_URL` | Public address, e.g. `https://sokchenda.com`. Used in WhatsApp inquiry links, the sitemap and social previews. |
| `DATA_DIR` | Where the database and photos are stored (default `./data`). Point it at the persistent disk. |

Serve the site over HTTPS (any reverse proxy or the host's built-in TLS). Login cookies are marked secure when the site runs over HTTPS.
**Back up the `DATA_DIR` folder regularly.** It contains all products, settings and photos.

### Render

`render.yaml` is set up as a **free preview** for checking the design. Render's free plan has no disk, so every start (after a deploy, or when the site wakes from sleep) builds a fresh database with the starter collections and the sample products, and creates the owner login from `OWNER_EMAIL` / `OWNER_PASSWORD`. **Anything entered in the dashboard is lost at the next restart.** The site sleeps after about 15 minutes without visitors; the next visit takes about a minute.

1. Render → **New → Blueprint** → connect this repository and pick the branch to preview. Render reads `render.yaml`.
2. Fill in the variables Render asks for:
   - `SITE_URL`: the site's address, e.g. `https://sok-chenda.onrender.com` (you can set it after the first deploy shows the address).
   - `OWNER_EMAIL` and `OWNER_PASSWORD` (at least the minimum length): the dashboard login.
3. Open the site, and the dashboard at `/admin`.

**Going live** needs a disk, which needs a paid instance (Starter or above). In `render.yaml`:
- set `plan: starter`;
- add `disk: { name: data, mountPath: /data, sizeGB: 1 }` and the variable `DATA_DIR=/data`;
- change the setup step to `npm run setup -- --no-samples`.

Then add your own domain under **Settings → Custom Domains** and update `SITE_URL`. Render takes daily snapshots of the disk.

## Telegram bot

The owner can update the gold prices from Telegram. **💰 Update gold prices** (or the bot's menu button beside the message box) opens a price form inside Telegram: every metal's sell and buy price on one screen, changed fields highlighted with the old price beside them, and Telegram's own **Publish** button at the bottom. The website's price bar updates straight away and the bot sends a confirmation. The form (`/telegram/prices`) only opens from Telegram; the server checks Telegram's signature and the owner's ID before saving.

Or send all prices in one message: sell then buy for each metal, in the order Kilo gold, Platinum 7 VN, Platinum 7, Platinum 5, e.g. `488 473 / 307 267 / 341 291 / 244 194` (`-` keeps a price; Khmer digits work too). The bot shows old → new and publishes when you tap **✅ Publish**. Any other message gets today's prices as a line to copy and edit. Without an `https://` `SITE_URL` the form is unavailable and only the one-message way works. The bot and the form follow the owner's Telegram language (Khmer or English) and, for the form, the Telegram colour theme. The form also has an **EN | ខ្មែរ** switch, remembered on that phone.

Setting it up:

1. In Telegram, message **@BotFather** → `/newbot` → choose a name and a username ending in `bot`. BotFather replies with a **token**.
2. In the server's settings (Render → Environment): `TELEGRAM_BOT_TOKEN` (the token), `TELEGRAM_WEBHOOK_SECRET` (make up 16+ letters and digits) and `SITE_URL` (the site's `https://` address, no trailing slash). After the next start the log shows `Telegram webhook set to …`, or why it couldn't.
3. Message the bot. It replies with your **Telegram ID**. Add it as `TELEGRAM_OWNER_IDS` (several people: comma-separated, e.g. `123456789,987654321`).
4. Message the bot again and tap **💰 Update gold prices**.

Only the IDs in `TELEGRAM_OWNER_IDS` can change prices. `npm run telegram:webhook` re-registers the bot by hand.

On Render's free plan the database is rebuilt whenever the site sleeps or redeploys, so published prices are lost then; the bot itself keeps working. Use a paid plan with a disk to keep prices.

## Security notes

- The owner password is hashed with scrypt. Sessions are random tokens stored hashed, in httpOnly cookies that expire after 30 days.
- Every dashboard page and action checks the session on the server. Repeated failed logins are blocked for 15 minutes.
- Uploads are re-encoded with sharp. Location data and other metadata are stripped, and non-images are rejected.
- Forgotten password: run `npm run owner:create` on the server with the same email to set a new one. This signs out all devices.

## Project layout

```
src/app/(site)/      public pages
src/app/admin/       dashboard pages and server actions
src/components/      site/ and admin/ components, icons
src/i18n/            en.ts and km.ts: every interface string, in both languages
src/lib/             database, catalog queries, auth, media, settings, gold weights
scripts/             setup, owner creation, sample seeding
```

To add a language string, add it to `src/i18n/en.ts`. TypeScript then requires the matching entry in `km.ts`.

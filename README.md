# eli-larson.com

Portfolio site for Eli Larson — sports photography and videography, Lincoln, NE. Live at [www.eli-larson.com](https://www.eli-larson.com).

## Stack

- **Next.js 16** (App Router, ISR) + **React 19** + **TypeScript**
- **Tailwind CSS 4** with a small hand-written layer in `src/app/globals.css`
- **Vercel Postgres** via **Drizzle ORM** (`src/db/`)
- **Cloudflare R2** for media storage (S3 SDK, `src/lib/r2.ts`) — public reads, presigned uploads
- **sharp** for upload-time image optimization (2400px std + up-to-4096px HQ WebP derivatives); responsive gallery images use crop-safe HQ sources
- **PhotoSwipe** photo lightbox, custom video lightbox
- Vercel Analytics + Speed Insights

## Pages

- `/` — hero with featured photo, justified gallery grid (photos/videos filter), about section. ISR, revalidated hourly and on every media mutation.
- `/about` — server-rendered landscape hero, bio/experience/certifications/skills bento grid, contact CTA.
- `/stories` and `/stories/[slug]` — short editorial photo sequences with full-frame images and captions.
- `/admin` — password-protected dashboard (JWT cookie via `src/proxy.ts`): drag-and-drop uploads, reordering, cropping, AI caption generation (Anthropic API), CSV caption import/export.
- `/admin/presentation` — maintain Editor’s Selection, stories, their photo order, and optional viewer information.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `POSTGRES_URL` | Vercel Postgres connection (Drizzle / `@vercel/postgres`) |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Cloudflare R2 endpoint + credentials |
| `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | R2 bucket name and its public base URL |
| `ADMIN_PASSWORD`, `AUTH_SECRET` | Admin login + JWT signing |
| `ANTHROPIC_API_KEY` | AI caption generation in the admin panel |

Note: the `R2_PUBLIC_URL` host must be covered by `images.remotePatterns` in `next.config.ts` for `next/image` to serve gallery photos.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm test         # image pipeline and presentation regression tests; Node 22.18+ recommended
npm run build
```

Database schema lives in `src/db/schema.ts`; manage it with `drizzle-kit` (`drizzle.config.ts`).

Data-backed production builds require `POSTGRES_URL` and the R2 credentials above. Failed regeneration preserves the prior valid page instead of silently caching an empty gallery.

## Presentation

The full photo gallery remains the default. Editor’s Selection is an optional 16-frame initial edit. The two initial stories, “Beyond the score” and “At the line,” each contain eight existing photographs and explicitly span different games or sessions. These are initial editorial choices that can be revised in admin. Existing factual captions are retained, not independently rewritten or verified by this release.

The viewer uses a dark background, keyboard navigation, zoom, and an optional **Info** panel. Press **I** to toggle information and **Escape** to close. The fitted image makes room beside the panel on desktop and above it on mobile. Only populated event/date/location/role fields appear; captions stay in the existing media library. There are no new photo-sharing or collection-sharing features.

Presentation settings are stored at `site/presentation-v1.json` in the existing R2 bucket using its existing read/write credentials. No database migration is needed. Before the first admin save, `src/content/presentation.ts` supplies the initial edit. Deployments never overwrite saved settings. This object contains **public presentation content only**; do not put private client information in these fields. Server reads use the authenticated S3 API, independently of public CDN caching. Conditional ETag writes reject stale admin tabs, and all public media pages are invalidated after a save. See [R2 conditional-operation support](https://developers.cloudflare.com/r2/api/s3/api/).

Missing images are omitted from the selected views. A story with fewer than six surviving photographs is hidden until repaired. The editor displays missing frames so they can be removed or replaced. Empty Editor’s Selection hides its toggle. Stories can be drafted, published, reordered, or removed without deleting their photographs. Keep published story addresses stable.

For review, verify the production preview with the actual database and R2 credentials before merging. Local validation used a separate copy with public media fixtures and an S3-compatible storage fixture: production build, type checking, lint, 12 regression tests, authenticated save/readback, stale-tab rejection, and browser checks at desktop/mobile widths. This does not verify the deployed bucket’s permissions or real-device network performance.

See [the September 2026 audit](PORTFOLIO_AUDIT.md) for measured findings, validation limits, the production R2-domain migration, and original-file preservation work. Public gallery URLs can move to a verified custom R2 domain through `R2_PUBLIC_URL` without rewriting existing database rows. Keep the legacy hostname available during migration. `hqBlobUrl` is an uncropped master; saved crops must use their display derivative. Existing low-resolution crops require a deliberate regeneration to gain resolution.

## Maintenance scripts (`scripts/`)

One-off Node scripts that read `.env.local` directly:

- `compress-existing.mjs` — backfill std/HQ WebP derivatives for legacy originals; skips HQ/cropped/known derivative records to avoid quality loss
- `add-dominant-color.mjs` — backfill dominant-color placeholders
- `setup-r2-cors.mjs` — configure CORS on the R2 bucket for browser uploads

`branding/` contains off-site brand collateral (business card, banners) generated with puppeteer — not part of the site build. `captions.csv` is a bulk caption import/export file for the admin CSV endpoint.

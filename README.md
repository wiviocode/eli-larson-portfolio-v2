# eli-larson.com

Portfolio site for Eli Larson — sports photography and videography, Lincoln, NE. Live at [www.eli-larson.com](https://www.eli-larson.com).

## Stack

- **Next.js 16** (App Router, ISR) + **React 19** + **TypeScript**
- **Tailwind CSS 4** with a small hand-written layer in `src/app/globals.css`
- **Vercel Postgres** via **Drizzle ORM** (`src/db/`)
- **Cloudflare R2** for media storage (S3 SDK, `src/lib/r2.ts`) — public reads, presigned uploads
- **sharp** for upload-time image optimization (2400px std + 4096px HQ WebP derivatives)
- **PhotoSwipe** photo lightbox, custom video lightbox
- Vercel Analytics + Speed Insights

## Pages

- `/` — hero with featured photo, justified gallery grid (photos/videos filter), about section. ISR, revalidated hourly and on every media mutation.
- `/about` — rotating photo hero, bio/experience/certifications/skills bento grid, contact CTA.
- `/admin` — password-protected dashboard (JWT cookie via `src/middleware.ts`): drag-and-drop uploads, reordering, cropping, AI caption generation (Anthropic API), CSV caption import/export.

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
npm run build
```

Database schema lives in `src/db/schema.ts`; manage it with `drizzle-kit` (`drizzle.config.ts`).

## Maintenance scripts (`scripts/`)

One-off Node scripts that read `.env.local` directly:

- `compress-existing.mjs` — backfill std/HQ WebP derivatives for already-uploaded media
- `add-dominant-color.mjs` — backfill dominant-color placeholders
- `setup-r2-cors.mjs` — configure CORS on the R2 bucket for browser uploads

`branding/` contains off-site brand collateral (business card, banners) generated with puppeteer — not part of the site build. `captions.csv` is a bulk caption import/export file for the admin CSV endpoint.

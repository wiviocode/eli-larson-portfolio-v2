# Eli Larson portfolio audit

Reviewed September 9, 2026. Baseline: GitHub commit `7b2e7c4`, plus the public site at [www.eli-larson.com](https://www.eli-larson.com/). Proposed code is on the local branch `codex/portfolio-quality-audit`. Production has not been changed.

The existing visual identity is worth keeping: the serif wordmark, restrained red accent, generous spacing, and uncropped justified photo grid suit the work. The strongest improvements are in the image pipeline, delivery infrastructure, and viewing controls. A redesign is not necessary to address the main problems.

**What was measured**

The public library contains 54 photographs and five videos. All 54 photographs have an HQ file, and 11 have saved crops. Read-only HEAD requests to all 108 standard/HQ photo URLs returned HTTP 200. None returned `Cache-Control`. The saved evidence is in `audit-results/media-delivery.json` locally.

A sample compressed homepage request transferred 31,814 bytes and reached first byte in 0.119 seconds, with Vercel reporting a cache HIT. This measures the HTML request from this computer; it is not a page-load score or a mobile user experience measurement. The site already uses server rendering, hourly regeneration, lazy-loaded gallery images, modern image formats, and Vercel's image cache.

Three photographs were also downloaded through the live image optimizer at the same 1200-pixel output width. AVIF was negotiated. The proposed versions use the HQ source and quality 85; the existing versions use the standard source and quality 75.

| Sample | Existing thumbnail | Proposed thumbnail | Increase |
| --- | ---: | ---: | ---: |
| Baseball stadium, ID 249 | 29.9 KB | 34.4 KB | 4.5 KB |
| Volleyball celebration, ID 216 | 28.1 KB | 34.4 KB | 6.3 KB |
| Basketball drive, ID 192 | 70.4 KB | 81.0 KB | 10.6 KB |

KB here means 1,000 bytes. This is a small sample, not a claim about every photograph. Some responses were cold cache misses, so their timing should not be compared to warm cache hits. The data supports using better sources and a higher thumbnail quality without sending full-size files to every gallery visitor.

The 54 HQ files total approximately 161.7 MB, averaging 3.0 MB; the largest is 6.7 MB. Loading these all at once would be wasteful. The preview keeps them behind an on-demand viewer, with limited neighboring-slide preloading. A photo's thumbnail remains available while the large image loads.

**Priority findings and disposition**

| Priority | Finding | Result |
| --- | --- | --- |
| Urgent | Next 16.1.6 and sharp 0.34.5 have published security advisories, including image-processing issues. | Updated locally to Next/eslint-config-next 16.3.4 and sharp 0.35.4; compatible dependency fixes applied. |
| High | Enlarged photos use the 2400px standard file even when a larger HQ file exists. | Viewer now chooses HQ for uncropped photos. |
| High | Gallery thumbnails are made from an already compressed q82 standard file, then compressed again at q75. | Thumbnails now use the best crop-safe source with q85 responsive output. |
| High | Crops change the standard file but leave the HQ master uncropped; the homepage hero can therefore ignore a crop. | Shared crop-aware source selection fixes the hero and gallery. |
| High | Saving a crop reduces it to 2400px/q82. | New crops retain up to 4096px/q95, never upscale, and keep the uncropped master. |
| High | Public images use Cloudflare's development hostname. | Production domain migration prepared in code; Cloudflare/Vercel configuration remains to be done. |
| High | Uploads delete the original after producing lossy WebP files. | Requires a separate original-archive design and migration; documented below. Existing lost detail cannot be restored by code. |
| High | The maintenance compression script can regenerate HQ from an already compressed standard file. | Script now skips existing HQ/cropped/known derivative records and preserves prior objects. It was not run against production. |
| Medium | A database exception becomes a successful empty page, which regeneration can cache for an hour. | Homepage and About regeneration now fail instead of replacing valid content with an empty portfolio. |
| Medium | About's hero image is absent from server HTML and waits for hydration. | A stable hero image is now rendered and preloaded immediately. |
| Medium | Viewer arrows and zoom controls are disabled. | Enabled the existing PhotoSwipe controls; added accessible dialog labeling. |
| Medium | Gallery and animated About content can remain invisible when JavaScript does not run. | Photos and About sections start visible; scroll animation is a progressive enhancement. Statistics start at their actual values. |
| Medium | Logout tries to remove an HttpOnly cookie with browser JavaScript. Missing admin configuration can also accept a missing password. | Logout now clears the cookie on the server; password validation fails closed. |
| Medium | Video thumbnails are unintentionally cropped by a stronger global image rule; the close button can leave a short viewport. | Thumbnails retain their frame; the player is bounded by viewport height. |
| Medium | Several visible descriptions are camera filenames or unreviewed editorial text. | Exact filename cases listed below; factual caption edits need the photographer's knowledge. |

The dependency updates address the published [Next.js AVIF image-processing advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) and [sharp/libheif advisories](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c). This audit did not attempt to exploit the live site. `npm audit --omit=dev` now reports zero known vulnerabilities. Eight reported vulnerabilities remain in development tooling: four moderate in the drizzle-kit/esbuild chain and four high in the Puppeteer/extract-zip chain. npm proposes breaking package changes for those; they were not forced into this patch.

**How the image changes work**

The database's existing HQ URL is an uncropped master. That distinction matters: blindly replacing every standard URL with HQ would restore unwanted edges or alter the composition of 11 existing crops. The public data now includes a derived `isCropped` boolean; no database schema migration is needed. `src/lib/gallery-image.ts` centralizes source selection. Existing crops use their saved display image, while uncropped photos use HQ.

New crops are generated from the master at up to 4096px/q95. Reverting uses the master directly, avoiding another lossy encode. The route validates input and rotated bounds, and previous display objects remain available to visitors with cached pages. Retaining those previous versions will modestly increase storage use; an eventual cleanup policy should respect the cache lifetime and retained masters.

The image optimizer still supplies appropriately sized AVIF/WebP thumbnails. Added 1536px and 2560px candidates reduce large jumps between available sizes. Lazy gallery images use `sizes="auto"` with fallback sizes, allowing supporting browsers to select based on the actual layout width. Older browsers retain explicit fallbacks. This follows the [documented image sizing behavior](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#sizes).

PhotoSwipe's full viewer code is loaded on opening, rather than eagerly imported with the homepage. Controls now expose next, previous, and zoom. Touch taps toggle controls; close remains explicit. Initialization handles unmounts, and animation respects reduced-motion preferences. The existing lightbox background appearance is preserved pending a design decision.

Source width and height for historical HQ files are not separately recorded in the database. Existing dimensions preserve the composition and viewer geometry; an original/archive migration should record exact dimensions for every variant so maximum zoom can use every available native pixel reliably.

**Production image delivery: the next highest-value action**

Cloudflare documents `r2.dev` as development-only, with variable rate limiting. A custom domain is required for Cloudflare CDN caching of public R2 objects. [Cloudflare public-bucket guidance](https://developers.cloudflare.com/r2/buckets/public-buckets/), [R2 caching guidance](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/).

Recommended destination: `images.eli-larson.com`, attached to the existing R2 bucket. This is a proposal, not an already configured hostname.

1. Attach the custom domain in Cloudflare and verify a known photo URL and its certificate.
2. Configure caching for generated photo objects. Existing objects need a cache rule or a deliberate metadata backfill; the new upload headers do not retroactively change old objects.
3. Set Vercel's `R2_PUBLIC_URL` to the verified HTTPS domain and redeploy the reviewed code.
4. Check cache HIT responses, cropped images, the homepage hero, and large viewer images from the new domain.
5. Keep the old hostname available during the transition for cached pages and links.

The code now maps existing public gallery URLs to `R2_PUBLIC_URL` without rewriting database rows. Image optimization allows the owned legacy host and configured host rather than every R2 or Vercel Blob customer hostname. Server-side crop/delete key resolution recognizes the legacy host during migration. New generated objects receive `public, max-age=31536000, immutable`; each edit already uses a new UUID filename.

No Cloudflare settings, DNS records, Vercel environment variables, production database rows, or R2 objects were changed during this audit.

**Original-file preservation**

The current upload path in `src/app/api/media/route.ts` deletes the uploaded original after generating 2400px/q82 and up-to-4096px/q95 files. These are both lossy derivatives. A higher quality setting later cannot recover pixels discarded by resizing, or detail discarded by earlier compression.

The recommended next version should archive original exports separately, record their object keys and exact dimensions, and generate every public derivative from that archive. A private original archive with public display derivatives is preferable to treating a lossy public WebP as the permanent master. This requires storage and schema decisions, so it was not introduced without a production migration plan. Re-uploading original exports may be necessary for images whose only surviving copy is already reduced.

The 11 existing cropped display files also retain their old resolution until deliberately regenerated from their saved masters and crop data. The new code protects their composition immediately; it does not claim to have upgraded already stored pixels. Production regeneration should be reviewed against the existing crops before replacing their URLs.

**Small presentation improvements included**

The overall layout, palette, wordmark, photo order, spacing, and homepage composition remain recognizable. Included polish is limited to photo navigation/zoom controls, keyboard-visible captions, a mobile gallery heading that stays together, larger mobile filter targets, and uncropped video thumbnails. Video preview playback now handles denied/interrupted play requests, defers direct-video fetching, and honors reduced motion. Invalid video links open a closable fallback rather than locking scrolling behind an invisible player.

About now uses a stable first landscape hero rather than rotating it through browser session storage. Its layout is unchanged. If rotation is important, a curated server-selected hero can preserve variety without delaying the first image request.

The social sharing image exposed a font-loading error in local builds. It now reads its bundled font using the Node runtime and successfully generates a 1200×630 PNG. Authentication routing was migrated from the deprecated middleware convention to Next's proxy convention. Sitemap regeneration now follows media updates.

**Caption cleanup**

These seven records display filename-like text as their description. Add concise, accurate descriptions in the admin editor; leave unverified dates, identities, scores, and context out until confirmed.

| Media ID | Current displayed text |
| --- | --- |
| 254 | dji fly 20260326 113624 0242 1774547405447 photo Edit |
| 252 | DSC02454 |
| 253 | ELI06095 |
| 248 | ELI09762 |
| 251 | DSC02557 |
| 255 | ELI08953 |
| 256 | ELI02826 |

Some other alt text is also a filename despite having a useful caption. The code preserves explicit alt text rather than silently overwriting editorial choices. The library includes filenames containing draft research notes and descriptions with internal factual tensions. For example, the fans/Creighton record discusses both January 21 and December 7 for the matchup. This warrants editorial review; the audit did not establish the correct date for that specific photo.

**Design ideas to approve separately**

| Idea | Visitor benefit | Suggested scope |
| --- | --- | --- |
| Dark focused photo viewer | Removes the visible gallery behind the selected photograph and improves caption/control contrast. | Keep the main site light; change only the open viewer. Current black opacity is applied in both CSS and PhotoSwipe, making it unusually transparent. |
| A few short photo stories | Shows anticipation, action, reaction, and aftermath as a deliberate sequence. | Add two or three stories of 6–10 images, with the existing grid still available. |
| A short curated first selection | Gives busy editors and hiring managers a strong impression before a long mobile scroll. | Choose 12–18 lead images, with an explicit route to all 54. Eli should select the sequence. |
| Shareable selections | Lets a prospect open a relevant set of basketball, track, portraits, or video work. | Stable links to curated selections and individual photos, without requiring an account. |
| Optional photo information | Preserves image area while making context available to interested viewers. | A collapsible caption/details control in the viewer, especially useful for long mobile captions. |

My first design choice would be the focused viewer; my first new portfolio feature would be photo stories. Neither requires abandoning the current identity. These larger presentation changes have not been applied.

**Additional maintenance backlog**

- CSV export supports quoted multiline captions, but import splits on line breaks before parsing quoted records. A proper record parser and round-trip tests should precede bulk caption imports containing line breaks.
- Admin delete/reorder and Add Video have paths that treat unsuccessful HTTP responses as success. Improve error reporting and restore optimistic state when persistence fails.
- Single-password authentication has no application-level login rate limit. Add a shared limiter or a verified hosting-layer rule; hosting configuration was not available to inspect. Route-level authorization checks would also provide defense beyond proxy routing.
- Featured-image updates unset the current image before successfully setting a replacement. Use a transaction and validate photo type to avoid inconsistent concurrent updates.
- `@vercel/postgres` is deprecated. Plan a separate migration to the supported database driver rather than combining that operational change with photo delivery fixes.
- The apex domain currently redirects to `www` with 307. Consider a permanent redirect in Vercel's domain settings once the canonical hostname choice is confirmed.
- Some small gray text and text over photos warrant a dedicated contrast/accessibility pass. The About hero also crops landscape images to a tall mobile frame; a curated focal point would be better than applying the same top alignment to every possible photo.
- Keep an eye on hero size, long captions, cached-image storage costs, and image optimizer usage after deployment. The new HQ sources increase cold origin fetch sizes even when the visitor receives a small optimized result.

**Validation and limits**

- ESLint and TypeScript checks pass.
- Seven regression tests cover crop-safe HQ selection, media-domain remapping, malformed inputs, resolution retention/no upscaling, rotation, EXIF orientation, and dominant-color extraction.
- A production preview build succeeds with an isolated snapshot of the 59 public items. It has no production database credentials or write access.
- The local homepage and About page were inspected at desktop and mobile sizes. Photo opening, next navigation, zoom control, video filtering, video opening, Escape/close, and landscape close-button placement were checked in the browser.
- Local HTTP checks verify that unauthenticated admin access redirects, media mutations return 401, missing-password login returns 401, logout expires the HttpOnly cookie, and the sharing image returns PNG successfully.
- The actual repository's build requires `POSTGRES_URL` to prerender its data-backed pages. Production database integration, authenticated uploading/cropping/deleting, and a Vercel deployment remain unverified here. The isolated preview validates rendering, not production database connectivity.
- PageSpeed Insights returned a quota error. No Lighthouse score, field Core Web Vitals score, or mobile-load improvement percentage is claimed. Existing Vercel Speed Insights is the appropriate place to compare real visitor performance after deployment. Useful targets are LCP ≤2.5 seconds, INP ≤200 ms, and CLS ≤0.1 at the 75th percentile, evaluated separately for mobile and desktop. [Core Web Vitals guidance](https://web.dev/articles/vitals).
- Browser checks were performed in the available Chromium-based browser. Real iPhone/Safari playback, touch gestures, slow cellular conditions, and screen-reader behavior still deserve a device pass.

Recommended order: review and deploy the focused code changes; configure the production media domain/cache; preserve original exports; regenerate the 11 legacy crops; correct captions; then choose a presentation enhancement.

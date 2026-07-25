# CMS Implementation Runbook

This runbook defines how agents should operate the CMS-backed content system in this repository without introducing regressions.

## Scope & Architecture

- App: `site/` (Next.js 16 + Payload CMS 3.85, deployed to Vercel, auto-deploys from `main`).
- **Production content DB: Neon Postgres** (`ep-still-leaf-ai7v69l8-pooler.c-4.us-east-1.aws.neon.tech`, db `neondb`). Local dev points at the SAME database via `DATABASE_URI`/`DATABASE_URL` in `site/.env` / `site/.env.local`.
- SQLite (`site/.cms-data/payload.db`) is **retired** — do not use it or any script that targets it.
- Booking + contact flows (consultations, availability, contact submissions) are Payload-native and were never JSON-backed. Do not touch them in content migrations.

## Source-of-Truth Policy (post-migration)

- Wired domains read from the CMS via the resolvers in `site/lib/content.ts`:
  - **Projects**: `/work`, `/work/[slug]`, `/work/tag/[tag]`, home featured grid, `sitemap.xml`
  - **Services**: `/services`, `/services/[slug]` (all 40)
  - **Team**: `/team`
  - **Pages**: `/` (home), `/about`, `/contact` — CMS drives seo/hero/media (+ contact flat groups: address, contactInfo, social, consultationForm, emailSignup); section copy passes through from JSON (rendered copy is component-hardcoded or structurally lossy in blocks)
  - **Case studies**: `/case-studies`, `/case-studies/[slug]`, `sitemap.xml` — CMS-only (no JSON fallback exists; empty collection renders the "coming soon" empty state by design)
  - **Globals**: navigation (`Nav`), site-styles + seo-defaults (`app/(site)/layout.tsx`)
- **JSON files in `content/` are the permanent fallback safety net, not dead weight.** Every JSON-backed resolver falls back to the sync JSON getter (with a `console.warn`) when the CMS errors or returns empty. Never remove this — it is what keeps pages rendering if Neon is unreachable or a collection is emptied.
- JSON getters (`site/lib/json-content.ts`) also define the canonical shapes; resolver output must deep-match them (see Parity Gate).
- All v1+v2 domains are wired; nothing remains JSON-only.

## ISR Propagation

- All CMS-wired pages export `revalidate = 300`. Admin edits go live within ~5 minutes, no redeploy.
- Pages prerender at build via the same resolvers; if the DB is unreachable at build time, JSON fallbacks keep the build green.
- `layout.tsx` intentionally has **no** `revalidate` export (it would clobber dynamic booking/contact segments). Nav/styles/seo globals re-render as part of each page's own ISR cycle.

## Canonical Slug Policy

- Project slugs are stored **bare** (`aku-world`, never `work/aku-world`). The `Projects` `beforeValidate` hook force-normalizes any input (`/work/x`, `work/x`) to bare — so seed lookups must use the bare form or they miss and collide on insert.
- Service slugs are stored as `services/<slug>` (the Services hook keeps the prefix). Resolvers accept any caller form and emit:
  - `getServiceSlugsResolved()` → bare slugs (route params)
  - `Service.slug` field → `/services/<slug>` (matches JSON files exactly; the services index compares against this form)
- Team/pages docs: stored bare (`team`); `getTeamResolved()` emits `/team` to match JSON.
- Case study slugs are stored **bare** (`amazon-music-live-infinite-playlist-tour`); `normalizeCaseStudySlug` is the canonical normalizer. Case studies have no JSON baseline — parity gate does not cover them.
- `normalizeProjectSlug` / `normalizeServiceSlug` in `site/lib/content.ts` are the canonical normalizers.

## Draft Preview Routes

- `site/app/preview/route.ts` enables Next draft mode; `site/app/preview/exit/route.ts` disables it.
- Auth is **verified**, not substring-matched: the route calls `payload.auth({ headers })` and returns 401 unless a valid Payload admin session cookie is present. Do not regress this to cookie-substring checks.
- Collection hooks (`payload/utils/previewLinks.ts`) generate `/preview?path=...&collection=...&slug=...` admin links; the `path` param is sanitized to same-origin relative paths.
- Resolvers are draft-aware via `isPreviewModeEnabled()`: draft mode bypasses the `status`/`isEnabled` filters.

## Media Reality on Vercel

- Serverless cannot persist `Media` collection uploads (`public/media` is ephemeral). **`heroImageLegacyUrl` / `legacyUrl` / `ogImageLegacyUrl` fields are authoritative**; resolvers use `resolveCmsMediaUrl()` first, then the legacy URL.
- Images are served from `site/public/images/**` via those legacy paths.
- `@payloadcms/storage-vercel-blob` is installed and **active in production** (store `store_08R2eupHppprM6h7`), gated on `BLOB_READ_WRITE_TOKEN` in `payload.config.ts`. Config notes:
  - The token is read via a `process.env` indirection so Turbopack cannot inline it at build time — keep it a true runtime read.
  - `disablePayloadAccessControl: true` on `media`: docs get direct `*.public.blob.vercel-storage.com` CDN URLs instead of proxying every image through a lambda (safe because Media read access is fully public).
  - If the token is ever absent, the plugin no-ops and uploads fall back to ephemeral local disk + legacyUrl fields.
- `resolveCmsMediaUrl()` prefers a media doc's `legacyUrl`, then its `url` (Blob URL for new uploads) — both shapes work everywhere.

## Seed / Publish / Parity Commands

All seed scripts run from `site/` against any base URL over REST:

```bash
export CMS_SEED_BASE_URL="https://beatrox-website.vercel.app"
export CMS_SEED_EMAIL="cms-seed@beatrox.com"
export CMS_SEED_PASSWORD="<password>"

npm run cms:import:projects   # upsert-by-slug from content/portfolio/*.json
npm run cms:import:services   # from content/services/*.json (auto-picks new files)
npm run cms:import:team       # from content/team.json
npm run cms:import:pages      # pages + navigation/site-styles/seo-defaults globals
npm run cms:import:media      # upload site/public/images/** → media collection (idempotent by filename)
node scripts/cms-import-case-study-amazon.mjs  # Amazon Infinite Playlist case study from content/portfolio/infinite-playlist.json
npm run cms:seed              # all of the above (media uploads tolerated to fail)
npm run cms:publish:site      # dry-run: report non-published/disabled docs
npm run cms:publish:site:apply # set status=published, isEnabled=true on projects/services/team/pages
npm run cms:parity            # the gate (see below)
```

- Seed scripts read from the **repo-root** `content/` (runtime reads `site/content/` — keep both copies in sync when editing JSON).
- The retired `bulk_publish_site_content.py` targeted SQLite; publishing is now REST-based (`scripts/cms-publish-site.mjs`).

## Parity Gate (blocks any page wiring)

`npm run cms:parity` bundles `scripts/cms-parity-check.mjs` with esbuild (env loaded via `scripts/load-env.mjs` **before** Payload config import — import order matters, do not inline it) and deep-compares resolver output vs JSON getters:

- published+enabled counts per collection must equal JSON source counts
- projects (slugs/list/every detail), services (slugs/list/every detail), team, **pages (home/about/contact)**, navigation, site-styles, seo-defaults — 68 comparisons
- fails if any resolver logged a fallback warning (vacuous parity)
- normalization rules (reviewed, rendering-equivalent): `''` ≡ missing, empty arrays ≡ missing, DB/upload artifacts (`id`, `createdAt`, `updatedAt`, image `width`/`height`) ignored, CMS `contentBlocks` skipped when `body` is present (the renderer prefers `body`); when CMS `body` is empty, block plain-text is compared against JSON `body`

**Requirement: 100% parity before wiring any new domain to the CMS.** Fix seed data or mappers, never the JSON baseline.

## Schema Changes (collections)

- `push: true` keeps Drizzle schema in sync, but on Vercel the push does **not** reliably run inside serverless lambdas. After deploying a collection schema change:
  1. run any local Payload init against the prod DB (`npm run cms:parity` is enough — local init pushes columns),
  2. then re-run the relevant seed.
- Symptom of a missed push: REST endpoints for that collection 500 on every request (queries reference missing columns).
- Adding optional fields is safe; renaming/removing fields requires a data migration plan.

## Published-State Requirements

- Public rendering filters: `status = published`, `isEnabled = true`, non-draft (unless draft preview mode).
- Seed scripts always write `status: 'published', isEnabled: true`.

## Redirects

- The `redirects` collection is maintained by collection hooks (e.g., project slug changes) and the hygiene scripts (`npm run redirects:hygiene[:apply]`, admin `/admin/redirect-hygiene`), but **runtime redirect execution (`proxy.ts`) is currently disabled** (in `_disabled-site/`). Live redirects today are hardcoded in `next.config.ts` (e.g., `/rentals` → external app).

## CRM, Scheduling & Admin Dashboard

- **CRM collections**: `clients` (unified contact record; `afterChange` hooks on `contact-submissions` and `consultations` upsert-by-email and auto-link via `site/lib/crm/link-client.ts`), `deals` (pipeline: lead → proposal-sent → negotiating → won/lost; `closedAt` auto-set), `activities` (notes/tasks/call log; `completedAt` auto-set). Submissions also trigger an internal notification email (`sendContactNotification` in `site/lib/email.ts`) — previously only bookings notified.
- **Admin nav groups**: CRM / Scheduling / Content / Settings (set via `admin.group` on each collection and global).
- **Custom admin views** (registered in `payload.config.ts` → `admin.components.views`, components under `site/components/payload/`):
  - `dashboard` — replaces the stock dashboard: KPI row (week-to-date leads/consults, proposals out, won MTD + revenue, pipeline value), GA4 traffic card, upcoming consultations, pipeline by stage, activity feed, quick actions. KPI math lives in `site/lib/kpi.ts` (shared with the weekly digest job).
  - `/admin/calendar` — month grid of consultations, status-colored, click-through to the doc.
- **Google Calendar two-way sync** (`site/lib/scheduling/google-calendar.ts`): cancelling a consultation deletes the GCal event, changing times on a confirmed booking patches it (attendees notified by Google). `freebusy.query` feeds the slot engine (`availability.ts`, 5-min `unstable_cache`) so external GCal events block booking slots.
- **Jobs queue** (`site/payload/jobs/`, scheduled via task `schedule` crons + `autoRun` every 15 min; Vercel cron in `site/vercel.json` hits `/api/payload-jobs/run` so jobs run with zero traffic — protected by `CRON_SECRET`):
  - `consultation-reminder` (hourly) — 24h reminder emails, stamps `reminderSentAt`.
  - `stale-lead-nudge` (daily ~8am PT) — digest of inquiries at `new` / deals at `lead` for 3+ days.
  - `weekly-kpi-digest` (Monday ~8am PT) — the KPI set from `strategy/operating-system/05_KPI_DASHBOARD.md`.
- **Payload email**: `nodemailerAdapter` over Resend SMTP when `RESEND_API_KEY` is set (password resets etc.); otherwise console fallback, same as `lib/email.ts`.
- **GA4 analytics**: `site/lib/analytics/ga4.ts` (`GA4_PROPERTY_ID` / `GA4_CLIENT_EMAIL` / `GA4_PRIVATE_KEY`, 1h cache, graceful placeholder when unset). Setup: `site/docs/GA4_SETUP.md`.
- **Lead attribution**: `utm` group (source/medium/campaign/gclid) on `contact-submissions` and `consultations`, captured by `site/components/AttributionFields.tsx` (hidden inputs, first-touch via sessionStorage) and passed through both server actions. `linkOrCreateClient` backfills `acquisitionSource`/`acquisitionCampaign` on clients (first-touch only, never overwrites; bare gclid ⇒ `google-ads`). Dashboard traffic card shows a CRM lead-sources list independent of GA4.
- **Proposals**: `deals` carry a `proposal` group (scopeItems/timeline/terms/validUntil), an auto-generated `proposalToken` (beforeValidate, unique), and `sentAt`/`viewedAt`/`acceptedAt`. Moving a deal to `proposal-sent` emails the client a public link (`sendProposalEmail`) once. Public page: `site/app/(site)/proposal/[token]/page.tsx` — token-gated (`overrideAccess`, noindex), stamps `viewedAt` on first view; print-to-PDF via browser. Acceptance stays manual (`acceptedAt`, no auto-close).
- **`cms:types` / `cms:importmap` run through `scripts/cms-generate.mjs`** (esbuild → ESM, like the parity script) because the stock `payload` CLI loads the config via `require()` and crashes on top-level await in `@payloadcms/richtext-lexical`. The runner pins `PAYLOAD_TS_OUTPUT_PATH` and `importMap.baseDir` to the real `site/` root (bundling relocates the config into `scripts/.tmp/`). New env vars: `GA4_PROPERTY_ID`, `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY`, `CRON_SECRET`.

## Content Architecture (July 2026 — post-Nathan-review)

- **About↔Services swap**: the About page's "Tech Capabilities" section (CMS `capabilitiesGrid` block on the `about` pages doc) renders the services link list via `site/components/ServicesLinkGrid.tsx` (grouped catalog, `SERVICE_CATEGORIES`); the image tile grid moved to the Services index "Our Services" section (`services/page.tsx` renders `<CapabilitiesGrid items={…}>` fed from the same about-page block). Titles stay on their original pages per owner.
- **Capability tiles** (`site/components/CapabilitiesGrid.tsx` + `site/lib/capabilities.ts`): all 12 link to `/services/*` landing pages (never `/work/*`); `lg:grid-cols-4`; label matching normalized (`&`↔`and`). Block items support optional `image`, `link`, `textPosition` (center/top/bottom/below/hidden) — see `capabilitiesGridBlock` in `site/payload/blocks/shared.ts`.
- **Service tags**: `projects.serviceTags` (relationship → services, hasMany) — drives (a) service-hub auto-related work on `services/[slug]` (manual `relatedWork` first, tag-matched appended, deduped, cap 6), and (b) the `ServiceTagCloud` on `/work` ("Browse by Service", count-sized pills → service hubs). `serviceTags` is CMS-only: JSON fallback emits `[]`, and the parity gate ignores the key (`IGNORED_KEYS`).
- **Image-level tags + per-page curation**: each row of `projects.images` carries its own `serviceTags`/`techTags` relationships (same taxonomies, `techTags` filtered to `pageType: tech`). They are **backend-only** — never rendered on public pages — and drive which photos appear on `/services/[slug]` (`serviceTags`) and `/tech/[slug]` (`techTags`) landing pages. Resolved via `getTaggedImagesForSlug(bareSlug, kind)` in `lib/content.ts` (automatic order: project order → image order, `imageIndex` = raw CMS `images` row index). Editing: Payload admin per-image pickers, or inline on `/work/[slug]` — `EditableImage` gained `serviceOptions`/`techOptions`/`selectedServiceIds`/`selectedTechIds` props (chip multi-selects in the edit panel, PATCH `images.N.serviceTags` / `images.N.techTags` with numeric ID arrays — the `images.` allowlist prefix already covers them), wired through `ProjectGallery` + the hero on the work page.
  - **Landing-page render** (`services/[slug]/page.tsx`, `tech/[slug]/page.tsx`): tagged photos interleave as 2-up `aspect-video` rows between body sections (2 per section), leftovers render as a "From Past Projects" gallery above Related Work / "Projects Using This Tech", and related-project card thumbnails use the page's tagged photo for that project (fallback: first non-empty image). When a page has no tagged photos, the legacy `media.galleryImages` inline single-image behavior is unchanged.
  - **`curatedImages`** (`services` collection, CMS-only, JSON fallback `[]`, `IGNORED_KEYS`): per-page pin/hide rows `{ project, imageIndex, position, hidden? }`. `mergeCuratedTaggedImages` applies them: hidden rows drop the photo; pinned photos hold their `position` (applied ascending, clamped); remaining auto photos fill the free slots top-down — so a newly tagged photo (no curated row) lands in the highest unpinned slot. Inline UI: `EditableCuratedImages` ("Arrange photos" badge in edit mode) diffs the arranged order against automatic and writes rows only for moved/hidden photos; "Reset to automatic" clears the array. `curatedImages` is allowlisted in `admin-update/route.ts`.
  - **Body formatting**: both landing pages share `site/components/ServiceBodySections.tsx` (boxed cards: trust → bordered ✓ cards, process → numbered `01`-chip cards, default items → bordered bullet cards, faq → divided list in a bordered panel; all `EditableText` `body.N.*` paths unchanged).
- **Inline editing widgets** (`site/components/admin/`): `EditableServiceTags` (chip multi-select on project pages → PATCHes `serviceTags` id array; `serviceTags` is allowlisted in `admin-update/route.ts`, which also revalidates `/services` + `/services/[slug]` on project updates) and `EditableGalleryGrid` (tile editor on the About page's capabilities section → PATCHes the whole `blocks.N.items` array with label/image/link/textPosition; media choices via `getMediaLibrary()` in `lib/content.ts`). Tile edits made on `/about` take effect on `/services` too (single data source: the about-page block).
- **LedTagWall removed** from `/work` (component deleted); category/type string tags (`hero.tags`, `/work/tag/[tag]`) remain.
- **Content audit**: `npm run content:audit` (read-only; `--apply-tags` opt-in writes suggested serviceTags for untagged projects) → `reports/content-audit.md` + `.json` at repo root: per-project images/tags/suggested serviceTags, duplicate service hero-image clusters with replacement candidates, tile link check, orphan checks.

## Rollback

- **Per wiring commit**: `git revert` the specific commit → pages render from JSON again; auto-deploy restores in ~2 min.
- **Safety net that never leaves**: JSON files stay in the repo; resolver fallbacks render from JSON if the CMS is empty/unreachable.
- DB-level recovery: Neon point-in-time restore / branches, not file backups.

## Troubleshooting

- **REST API 500s on all reads of a collection** → missing columns; run local Payload init (schema push), see Schema Changes.
- **Seed POST fails "Value must be unique" on slug** → the beforeValidate hook normalized your slug; look up with the normalized (bare) form.
- **Page renders but FAQ/list items show raw JSON strings** → body `items` rows must store `{question, answer}` in the dedicated fields, not stringified in `value`.
- **Service detail silently uses JSON** → resolver lookup missed; check stored slug form (`services/<slug>`) vs caller form.
- **OG images show `/og-default.jpg`** → `ogImageLegacyUrl` missing on the doc; re-seed.
- **Media upload fails `413 FUNCTION_PAYLOAD_TOO_LARGE`** → Vercel serverless requests cap at 4.5MB; recompress the source PNG/JPG in `site/public/images` (lossless `PIL optimize=True` recovered 23% on the one offender) and re-run `cms:import:media` (idempotent).
- **"client password must be a string"** → env vars not loaded/exported before Payload init.
- **Stale content after admin edit** → ISR window (~5 min); hard-revalidate by redeploying or touching the page's data.

## Agent Execution Standard

For CMS-related implementation tasks, agents must:

1. Confirm the domain's wiring status (CMS-wired vs JSON-only) before editing.
2. Keep resolver output shapes identical to the JSON getters; extend the union types in both files when shapes change.
3. Re-seed + `npm run cms:parity` (100% pass) before wiring any page.
4. Wire with `revalidate = 300`, one domain per commit, verify on production after each auto-deploy.
5. Never edit booking/contact flows as part of content work.

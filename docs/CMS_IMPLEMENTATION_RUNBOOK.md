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
- `@payloadcms/storage-vercel-blob` is installed and wired in `payload.config.ts`, gated on `BLOB_READ_WRITE_TOKEN`. When the token is absent the plugin is disabled and nothing changes. To activate: provision a Blob store in the Vercel project dashboard (Storage tab), let Vercel inject `BLOB_READ_WRITE_TOKEN` into env vars, redeploy.

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
- normalization rules (reviewed, rendering-equivalent): `''` ≡ missing, empty arrays ≡ missing

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
- **"client password must be a string"** → env vars not loaded/exported before Payload init.
- **Stale content after admin edit** → ISR window (~5 min); hard-revalidate by redeploying or touching the page's data.

## Agent Execution Standard

For CMS-related implementation tasks, agents must:

1. Confirm the domain's wiring status (CMS-wired vs JSON-only) before editing.
2. Keep resolver output shapes identical to the JSON getters; extend the union types in both files when shapes change.
3. Re-seed + `npm run cms:parity` (100% pass) before wiring any page.
4. Wire with `revalidate = 300`, one domain per commit, verify on production after each auto-deploy.
5. Never edit booking/contact flows as part of content work.

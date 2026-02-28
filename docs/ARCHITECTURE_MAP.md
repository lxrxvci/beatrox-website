# BEATROX CODEBASE ARCHITECTURE MAP

## 1. Executive Summary
The repository is a unified Next.js + Payload CMS system in `site/`, with Payload-backed editorial workflows now expanded beyond baseline pages/projects into redirect operations, publish-state enforcement, and case-study delivery.

Current state is **CMS-led for site-facing content domains**, with explicit public-vs-preview behavior:
- public routes show only published/enabled/non-draft entries,
- admin-session preview routes can expose draft/private content intentionally.

## 2. Tech Stack Overview
- Framework: Next.js App Router + React + TypeScript.
- CMS: Payload CMS v3 via `@payloadcms/next`.
- Database: SQLite via `@payloadcms/db-sqlite`.
- Styling: Tailwind CSS v4 + project CSS utilities.
- Runtime redirect execution: Next.js proxy layer in `site/proxy.ts`.
- Editorial preview: Next.js `draftMode` bridge in `site/app/(site)/preview/route.ts`.
- Existing external integrations remain:
  - YouTube tooling,
  - placeholder Formspree contact endpoint.

## 3. System Structure (Current)
- `site/app/(payload)/...`: Payload admin + APIs.
- `site/app/(site)/...`: Public site + preview endpoints.
  - Includes `/work`, `/work/tag/[tag]`, `/case-studies`, `/case-studies/[slug]`, and preview routes.
- `site/lib/content.ts`: CMS content gateway + publish/preview filtering logic.
- `site/payload/collections/*`: Collection models including `Projects`, `CaseStudies`, `Redirects`, `Pages`, `Services`, `Team`.
- `site/payload/globals/*`: `navigation`, `site-styles`, `seo-defaults`.
- `site/payload/utils/previewLinks.ts`: Central live/preview URL generation for admin UI.
- `site/scripts/*`: publish-state utility and redirect hygiene tooling.

## 4. Key Implemented Capabilities
- **Canonical project and tag routing**
  - Project slugs normalized to canonical short slugs.
  - Tag browsing standardized to `/work/tag/<tag>`.
  - `/work?tag=` redirects to canonical tag path.
- **Runtime redirect resolution**
  - `site/proxy.ts` reads redirect rules and applies 301/302 at request time.
- **Redirect hygiene operations**
  - Script + admin workflow for detecting/fixing self-redirects and flattenable chains.
  - Loop-risk redirects are flagged for manual handling.
- **Publish-state enforcement**
  - Bulk publishing utility exists for historical content normalization.
  - Frontend reads are preview-aware and gate normal traffic to published/enabled/non-draft entries.
- **Case studies as a first-class domain**
  - `CaseStudies` collection added in Payload.
  - Public index/detail routes added.
  - Included in sitemap generation.
- **Admin live/draft preview links**
  - Site-facing collections expose `liveUrl` and `previewUrl`.
  - Preview URL flow requires admin session cookie and enables draft mode for review.

## 5. Content and Request Flow (Text)
`Payload Admin -> SQLite -> site/lib/content.ts -> App Router pages -> HTML/metadata/sitemap`

`Incoming request -> site/proxy.ts -> optional redirect resolution -> route handler/page render`

`Admin preview click -> /preview?path=... -> draftMode enabled -> draft/private visible for that session`

## 6. Current CMS Domain Inventory
- Collections:
  - `users`, `media`, `redirects`, `pages`, `projects`, `services`, `team`, `case-studies`.
- Globals:
  - `navigation`, `site-styles`, `seo-defaults`.

## 7. Known Gaps / Risks
- Contact submission path is still placeholder-only (no hardened internal form backend).
- Content resolver logic is still centralized in `site/lib/content.ts` and remains broad.
- Some legacy JSON fallback patterns still exist for non-project domains; migration status differs by domain.
- Redirect hygiene can auto-fix safe classes only; loop-risk and ambiguous redirect intent still require manual operator review.

## 8. Build Guidance for Future Agents
- Treat Payload as source of truth for site-facing content models.
- Keep canonical slug/tag policy aligned with the runbook.
- Pair schema/data/resolver/route updates in one pass.
- When adding redirects or slug migrations, include hygiene validation and public-route checks.
- Keep architecture-map updates high-level; operational steps belong in `docs/CMS_IMPLEMENTATION_RUNBOOK.md`.

# CMS Implementation Runbook

This runbook defines how agents should implement and migrate CMS-backed content in this repository on the first pass, without introducing regressions.

## Scope

- App: `site/` (Next.js + Payload CMS).
- Source of truth: Payload collections/globals.
- Database: SQLite (`site/.cms-data/payload.db`).
- Current enforcement scope: site-facing collections (`projects`, `case-studies`, `pages`, `services`, `team`) with rollout maturity varying by domain.

## Canonical Slug Policy

- Canonical project slug format is short and route-safe: `<slug>`.
- Do not store prefixed project slugs like `work/<slug>` in CMS.
- Frontend project routes are always `/work/<slug>`.
- Normalize all incoming slug inputs by:
  - lowercasing,
  - trimming,
  - removing leading `/`,
  - removing leading `work/`.

## Tag Policy

- Projects must be browseable by tags.
- Canonical tag routes are `/work/tag/<tag>`.
- `/work?tag=<tag>` is allowed as an entry URL but should redirect to canonical tag routes.
- Tag values should be normalized kebab-case.

## Site Settings Management

- Site-wide configuration is edited in Payload Globals only:
  - `navigation`
  - `site-styles`
  - `seo-defaults`
- Do not create hardcoded equivalents in frontend route files.
- Keep path values internal (`/path`) and keep SEO templates valid (`%s` placeholder).

## Publish-State Backfill

- One-time publish utility for site-facing content:
  - dry run: `npm run cms:publish:site`
  - apply: `npm run cms:publish:site:apply`
- Targeted collections: projects, services, pages, team.
- Utility enforces:
  - custom `status=published` (where present)
  - Payload internal `_status=published`
  - `isEnabled=true` (where present)
- Execution model:
  - run dry-run first and review summary,
  - apply only after confirming target-environment DB backup exists,
  - rerun dry-run after apply to verify no remaining changes.

## CMS-First Read Policy

- For migrated domains, do not silently fall back to JSON file content.
- For projects:
  - `getAllProjectsResolved()` returns CMS results or `[]` on failure.
  - `getProjectResolved()` returns CMS result or `null` on failure.
  - `getProjectSlugsResolved()` returns CMS slugs or `[]` on failure.
- Log CMS read failures explicitly for diagnosis.
- For domains still transitioning off JSON, keep fallback behavior explicit and documented until cutover.

## Migration Order (First Pass)

1. **Schema readiness**
   - Confirm/introduce required fields in Payload collections.
   - Keep existing field keys when possible to avoid editor disruption.
2. **Data migration**
   - Run slug migration to canonical short slugs.
   - Add/update redirect entries for legacy paths.
3. **Resolver cutover**
   - Switch runtime reads to CMS-only for migrated domain.
   - Keep temporary legacy slug lookup only for compatibility.
4. **Route/UI alignment**
   - Ensure listing/detail/tag routes use normalized slugs and tags.
5. **Validation**
   - Verify published/enabled filtering and admin editability.

## Idempotent Update Strategy

- Migrations must be safe to rerun:
  - detect no-op rows,
  - skip conflicting records,
  - upsert redirects instead of blind inserts.
- Scripts should support `--dry-run` where practical.

## Published-State Requirements

- Public rendering must filter:
  - `status = published`
  - `isEnabled = true`
  - `draft = false` in Payload reads
- Admin can still edit drafts/versioned content in Payload UI.
- Preview rendering (draft mode enabled) may bypass normal public filters for editorial verification only.

## Runtime Redirect Contract

- Redirect execution occurs at request time in `site/proxy.ts`.
- Redirect source of truth is the Payload `redirects` collection.
- Redirect lookup flow:
  - normalize incoming request path,
  - resolve matching `from` entry,
  - apply configured `to` target with `301` or `302`.
- Keep exclusions for framework/API/static routes so redirect execution applies only to site-facing paths.
- Any redirect schema/key change requires local runtime verification of proxy behavior before merge.

## Required Validation Checklist

- `/work` renders only CMS projects.
- `/work/<slug>` resolves canonical slugs.
- Legacy-prefixed slugs redirect or resolve safely.
- `/work/tag/<tag>` renders only matching published/enabled projects.
- `/work?tag=<tag>` redirects to canonical tag route.
- `/case-studies` and `/case-studies/<slug>` enforce published/enabled/non-draft visibility on public routes.
- Editing project title/content/tags in Payload Admin is reflected on frontend.
- No hardcoded project copy introduced in route components.
- Redirect hygiene checks pass in both modes:
  - script: `npm run redirects:hygiene`
  - admin: `/admin/redirect-hygiene`
- Verify all targeted live content has Payload `_status=published`.
- Verify `liveUrl` and `previewUrl` fields exist and link correctly for site-facing collections.

## Redirect Hygiene Operations

- Dry run (predeploy/CI): `npm run redirects:hygiene`
- Apply safe fixes: `npm run redirects:hygiene:apply`
- Admin one-click report/fix page: `/admin/redirect-hygiene`
- Safe auto-fixes include:
  - self-redirect removal (`from == to`)
  - chain flatten updates (`A -> B -> C` becomes `A -> C`)
- Loop risks are reported for manual review and not auto-fixed by default.
- Operator sequence:
  1. Run dry-run and review findings.
  2. Resolve high-risk manual items (loop-risk, ambiguous intent).
  3. Run apply for safe auto-fixes.
  4. Rerun dry-run until clean or only accepted manual exceptions remain.

## Case Studies Collection

- `CaseStudies` is additive and coexists with `Projects`.
- Public routes:
  - `/case-studies`
  - `/case-studies/<slug>`
- Visibility rule matches other content domains:
  - published + enabled + non-draft on normal routes
  - draft/private only in preview mode
- Slug governance:
  - use short canonical slug format (`<slug>`),
  - do not store prefixed slugs like `case-studies/<slug>`.

## Live and Draft Preview Links

- Site-facing collections expose admin-readable URL fields:
  - `liveUrl`
  - `previewUrl`
- `previewUrl` targets `/preview?path=...` and requires active Payload admin session cookie.
- Exit preview mode at `/preview/exit`.
- Preview links are intended for editorial verification of draft/private entries without exposing them on normal frontend routes.
- Preview route contract:
  - requests without valid admin session must not enable preview,
  - successful preview requests enable draft mode and redirect to requested path,
  - exit route disables draft mode and restores public rendering behavior.

## Rollback Plan

- If migration introduces issues:
  - restore DB from backup copy of `payload.db`,
  - revert resolver changes to last known-good commit,
  - rerun migration in dry-run mode and inspect conflicts.

## Troubleshooting

- **Project missing from frontend**:
  - check `status`, `isEnabled`, and slug value in Payload.
- **Case study missing from frontend**:
  - check `status`, `isEnabled`, `_status`, and slug normalization.
- **Tag page empty**:
  - verify normalized tag exists on project tags (or hero tags fallback).
- **Unexpected 404**:
  - confirm canonical slug normalization and redirect behavior.
- **Admin shows content but frontend stale**:
  - check query filters and route generation from `getProjectSlugsResolved()`.
- **Preview link opens public content instead of draft/private**:
  - confirm active admin session cookie exists,
  - confirm `/preview` successfully enabled draft mode,
  - confirm resolver for that domain is preview-aware.

## Known Warnings / Residual Risks

- Existing local Next.js/Turbopack warnings may still appear and are tracked separately from CMS correctness.
- Redirect hygiene automation only applies safe transforms; loop-risk and intent-sensitive redirects still require manual review.
- Full fallback removal is domain-specific and still in progress outside fully cut-over domains.

## Agent Execution Standard

For CMS-related implementation tasks, agents must:

1. Confirm domain source-of-truth policy.
2. Define canonical identifiers (slug/tag) before coding.
3. Implement idempotent migration path.
4. Update runtime resolvers and route consumers together.
5. Run validation checklist before concluding work.

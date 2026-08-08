# Elite SEO Audit: Beatrox (Live Site + GBP), 2026-08-08

**Target:** https://www.beatrox.com (production deployment e550be5, promoted 2026-08-08 ~23:45 UTC) + Google Business Profile (live + verified per client, 2026-08-08).
**Evidence:** `audit-evidence/live-2026-08-08/` (78 sitemap URLs + robots.txt crawled, all HTTP 200, zero fetch failures; per-page HTML + headers; extraction.md; legacy-urls.txt; content_lint.log; nap_parity.log; mechanical-checks.md; offsite.md).
**Supersedes:** the 2026-08-07 staged re-audit (composite 44). This is the first audit of the live domain with the GBP in scope.
**Dash-law note:** this document is em dash free per content_lint.py.

---

## 1. Verdict

**Composite: 49/100. NOT ELITE.** Up from 44 on the strength of domain wiring, GA4, the mesh, and GBP creation, but the live crawl surfaced a new P0 class: the live site renders a large share of its copy from the Payload CMS database, which still holds the pre-cleanup strings. The Phase A lint cleanup fixed the JSON content layer; the CMS layer was never re-synced, so titles, metas, and body copy with em dashes are what Google actually gets on most pages. Separately, 29 legacy Squarespace URLs 404, bleeding indexed link equity.

## 2. Pillar Scores

| Pillar | Weight | Was | Now | Rationale |
|---|---|---|---|---|
| P1 GBP Readiness | 22% | 1 | 5 | Profile exists and is verified (client-confirmed 2026-08-08), domain wired, NAP parity passes on rendered pages. Not yet publicly visible (new-profile lag), media/posts/reviews unverified, no review content. Anchor 4 to 7 band; scored 5 pending public visibility and dashboard parity check. |
| P2 Reviews | 16% | 1 | 1 | Zero reviews on the new profile; no testimonials on money pages. SOP exists in blueprint Section 13, not yet running. |
| P3 Content / E-E-A-T | 20% | 7 | 6 | Structure is elite (per-service pages, mesh, FAQ, case studies) but the live rendered copy fails the lint gate via stale CMS strings: em dashes sitewide in titles ("X [em dash] BEATROX" pattern), in meta descriptions on all 41 service/tech pages, and in body copy on 47 of 78 pages (evidence: content_lint.log). Deck alts fixed in JSON, unverified in CMS-rendered output. Deviation cap (no city in homepage H1/title) still applies. |
| P4 Schema / Technical | 12% | 8 | 7 | Strong where present (65 of 78 pages carry valid stacks; LocalBusiness with full property set; Service + Breadcrumb + FAQPage on detail pages; Person nodes on /team). New gaps: 13 pages emit no JSON-LD at all (/about, /work, /tech, /book, /contact, /videos, /case-studies + 6 case-study details); beatrox-website.vercel.app serves 200 duplicate content with no redirect (canonicals mitigate but do not consolidate); /home serves a duplicate homepage 200. GA4 now live sitewide. |
| P5 NAP / Citations | 10% | 5 | 5 | Rendered NAP parity: PASS (interpreted; nap_parity.log). All 78 pages carry the exact visible address and phone; LocalBusiness name matches. Off-site: zero citations; Google's index still shows the legacy 8625 NE Halsey St address in snippets (ages out as the new site re-indexes, accelerated by the legacy redirect map); "Beatrox Records Warehouse" (521 N Tillamook St) is an unrelated name-confusion risk to monitor. |
| P6 Architecture | 7% | 6 | 6 | Mesh live (/services to /tech and back, verified in crawl), clean URLs, tag pages noindexed. But 29 legacy Squarespace URLs 404, including Google-indexed ones: /sound-equipment-rentals, /led-video-wall-rentals-portland, /drone-light-shows, /create-our-future-experiential-event, plus old portfolio and blog slugs (legacy-urls.txt). Indexed equity is hitting dead ends. |
| P7 Competitive | 7% | 4 | 4 (est) | Competitor picture refreshed but still without a live Maps pack pull (environment cannot query the local index): Pro Connect Group (pcg.live, founded 2014, active citations/PR), Seamless Event Solutions, AV Rental Services, MeyerPro all show street addresses and deep service pages. Review counts in the vertical appear low (WeddingWire 5.0/2 for PCG). Manual incognito Maps check still required. |
| P8 Conversion | 6% | 6 | 7 | GA4 (G-CQMP5KHQ5S) verified on all 78 crawled pages. 4-field contact form, map embed, trust line, /book flow live. Remaining: conversion events + thank-you states unverified; no call tracking. |

Composite math: (5 x .22 + 1 x .16 + 6 x .20 + 7 x .12 + 5 x .10 + 6 x .07 + 4 x .07 + 7 x .06) x 10 = 49.2.

Elite gate status: composite 49 (< 85), pillars below 8: all but none at 8, P0s open (L-01, L-02 below), lint FAIL on live rendered pages, nap_parity interpreted PASS.

## 3. New Findings (this audit)

### L-01 (P0) Legacy Squarespace URLs 404: indexed equity bleeding
- Evidence: `audit-evidence/live-2026-08-08/legacy-urls.txt`. 39 old paths probed: 2 redirect (the two DJ entries added today), 8 valid 200s, 29 return 404, including 5+ URLs currently in Google's index.
- RequiredState: every legacy path 301/308s to its closest live equivalent: old portfolio slugs to /work/[slug], /sound-equipment-rentals and /led-video-wall-rentals-portland to the matching rentals.beatrox.com categories, /drone-light-shows to /services/drone-light-shows, /blog/* to / or the closest content, /home to /.
- agentActionability: code (next.config.ts redirect map from legacy-urls.txt).

### L-02 (P0) CMS database holds pre-cleanup copy; live pages fail the Dash Law
- Evidence: `audit-evidence/live-2026-08-08/content_lint.log`: 343 violations in crawled HTML after excluding evidence artifacts. Titles sitewide carry "[em dash] BEATROX"; all 41 service/tech pages have em dashes in meta descriptions (the "Portland, OR [em dash]" pattern); body copy on 47 of 78 pages.
- Root cause: `getSeoDefaults()` and service/page content resolve from the Payload CMS database, which was imported from the pre-cleanup JSON and never re-synced. The cleaned JSON layer only renders as fallback.
- RequiredState: re-import/sync the cleaned `site/content/*.json` into the CMS (scripts exist: cms:import:pages, cms:import:projects), or run a CMS-side migration replacing U+2014 per content-style.md. Re-crawl and lint rendered pages to zero genuine violations. NOTE: the CMS import path must preserve any edits made in the admin since the original import; diff before overwriting.
- agentActionability: code/data migration.

### L-03 (P1) beatrox-website.vercel.app serves 200 duplicate content
- Evidence: mechanical-checks.md. The vercel.app host returns the full site with no redirect. Canonicals point to www.beatrox.com (mitigation verified) but the host does not consolidate.
- RequiredState: 301 the vercel.app host to www.beatrox.com (middleware host check or Vercel-level redirect).
- agentActionability: code.

### L-04 (P1) /home serves a duplicate homepage 200 with self-canonical
- Evidence: legacy-urls.txt. Same title as /.
- RequiredState: 301 /home to /.
- agentActionability: code (one redirect line).

### L-05 (P2) 13 pages emit no JSON-LD
- Evidence: extraction.md. /about, /work, /tech, /book, /contact, /videos, /case-studies + all 6 case-study detail pages.
- RequiredState: per OP-08/OP-11, no sitewide LocalBusiness duplication; add WebPage + BreadcrumbList on index pages, ContactPage on /contact, AboutPage on /about, and CreativeWork/Article-appropriate types on case studies, all referencing #localbusiness by @id.
- agentActionability: code.

### L-06 (P2) GBP not yet publicly visible
- Evidence: offsite.md; research found zero public local signals (no knowledge panel, no Maps presence in corroborating sources). Client confirms live + verified 2026-08-08.
- Interpretation: normal new-profile propagation lag (days). No action beyond the blueprint rollout (media, posts, services) and a re-check in 7 to 14 days. If still invisible in 2 weeks, check the dashboard for a soft suspension (exact-name + address search test).

## 4. Findings Closed Since the Staged Re-Audit

| ID | Finding | Verification |
|---|---|---|
| P1-04 | Domain not wired | www.beatrox.com 200 on Vercel, apex 308s to www, sitemap/robots/canonicals resolve on the real domain (headers.log, root.headers.txt) |
| P8-03 | GA4 absent | G-CQMP5KHQ5S present on all 78 crawled pages (mechanical-checks.md) |
| P3-04 | Service mesh fragmented | /services to /tech cross-links live in rendered HTML; A-to-Z catalog + 31 tech links present (extraction.md) |
| P3-06 | Generic deck image alts | Fixed in content JSONs; live verification blocked by L-02 (CMS staleness); close on re-crawl after CMS sync |
| P1-01 | No GBP | Profile live + verified (client-confirmed); public visibility pending (L-06) |
| P1-02 | Hours absent | /contact hours + openingHoursSpecification live; GBP hours set per blueprint |
| Lint gate | content_lint on content trees | PASSES on codebase JSON/tsx; FAILS on live rendered pages until L-02 closes |
| nap_parity | NAP drift | PASSES (interpreted) on all 78 rendered pages (nap_parity.log) |

Open from prior directive, unchanged: P2-01 (reviews), P5-02 (citations), P7-01 (live pack verification).

## 5. GBP Audit (profile live + verified, dashboard fields client-confirmed)

**UPDATE 2026-08-08: the client confirmed the blueprint is FULLY IMPLEMENTED in the dashboard (all fields per Sections 1 to 15), the Tuesday hours typo is fixed, and the sitemap was submitted in Search Console.** Remaining P1 movement is now propagation (public visibility, L-06) and the 7 to 14 day re-check.

Public-signal audit (all that is externally visible): profile not yet surfacing publicly (L-06). NAP on the website matches the blueprint exactly, so once the profile propagates, website justifications and parity checks have a clean source.

Dashboard parity checklist for the client (confirm against the GBP manager; every item is specified verbatim in `gbp-blueprint.md` v2):
1. Name exactly `Beatrox` (no LLC, no keywords, no all-caps).
2. Primary category `Event management company`; secondaries `Marketing agency`, `Event technology service`, `Audiovisual equipment rental service`, `Video production service`.
3. Description: the 743-char block from blueprint Section 3 (decline the AI-drafted suggestion).
4. Services: the 13 entries with their section mapping (blueprint Section 4 table).
5. Hours: Mon to Fri 9:00 to 18:00; opening date set to the 2011 LLC registration date.
6. Phone `(503) 515-4715`; website link with `utm_source=google&utm_medium=organic&utm_campaign=gbp-listing`; appointment link to /book with `gbp-appt` campaign.
7. Address SHOWN (signage confirmed); service area Portland, OR only.
8. Media: logo 720x720, cover 1024x576, 20+ real photos per the shot list; at least one video.
9. First post published (Week 1 of the calendar).

Scoring consequence: P1 moves from 5 toward 8 as items 1 to 9 are confirmed; P2 stays 1 until the review SOP produces velocity.

## 6. Remediation Order (next batch)

1. L-02 CMS dash purge + re-crawl lint (P0; also carries P3-06 alt verification live). Effort M, impact: lint gate + rendered-copy quality sitewide.
2. L-01 legacy 301 map incl. L-04 /home (P0/P1). Effort S (mechanical from legacy-urls.txt), impact: reclaims indexed equity, kills 404s Google is actively serving.
3. L-03 vercel.app 301 (P1). Effort S.
4. L-05 JSON-LD on 13 bare pages (P2). Effort S to M.
5. GBP blueprint field entry + media/posts (client, blueprint Sections 1 to 15). Effort M.
6. Review SOP start + citations build-out (client). Effort ongoing.
7. Manual pack verification + GBP visibility re-check in 7 to 14 days.

Post-remediation re-audit projection: L-01 to L-05 closed lifts P3 to 7 (cap), P4 to 8 to 9, P6 to 8; with GBP parity confirmed and reviews/citations started, composite projects to roughly 65 to 70. Elite (85 with all pillars >= 8) then hinges on P2 reviews and P5 citations, which are velocity plays measured in months, not code.

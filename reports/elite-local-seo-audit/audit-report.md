# Elite Local SEO Audit: Beatrox
**Location:** Portland, OR | **Vertical:** other (experiential design and event production) | **Business type:** Hybrid (storefront plus service area, Portland metro and nationwide)
**Audit date:** 2026-08-07 | **Website:** https://beatrox-website.vercel.app (production candidate; canonical target https://www.beatrox.com) | **GBP:** does not exist

---

## RE-AUDIT ADDENDUM (2026-08-07, staged branch seo/elite-local-remediation)

Preview verified: https://beatrox-website-1or8tyjxj-lxrxvcis-projects.vercel.app (artifacts in audit-evidence/reaudit/). 17 of 26 directive findings closed or deviation-recorded; evidence citations per finding in remediation-directive.json.

| Pillar | Weight | Before | After | Gate note |
|--------|--------|--------|-------|-----------|
| P1 GBP Readiness | 22% | 1 | 1 | Website-side readiness done (NAP, hours, map, blueprint); profile still absent |
| P2 Reviews | 16% | 1 | 1 | Unchanged; needs the manual review program |
| P3 Content | 20% | 5 | 7 | Deviation cap (client-declined city in H1/title, global strategy) |
| P4 Schema/Tech | 12% | 6 | 8 | Full stack live; CWV unverified keeps it under 9 |
| P5 NAP/Citations | 10% | 4 | 5 | Website NAP exact; GBP and citations absent |
| P6 Architecture | 7% | 6 | 6 | Unchanged; rentals domain decision open |
| P7 Competitive | 7% | 4 est | 4 est | Unchanged; pack invisible without GBP |
| P8 Conversion | 6% | 4 | 6 | Map, trust line live; form trimmed in repo; GA4 env still missing |
| **Composite** | | **34** | **44** | NOT ELITE: 2 P0s open (GBP creation, domain wiring) |

Remaining blockers are business actions, not code: create and verify the GBP, wire www.beatrox.com, set GA4 env vars, promote CMS content (homepage title/H1, contact form fields, about/contact/team seo titles), start the review program, build citations. Full detail in the directive reaudit properties.

---

## Composite Score: 34/100: NOT ELITE

Elite requires: composite >= 85, every pillar >= 8, zero P0 findings, content lint pass, NAP parity pass.

| Pillar | Weight | Score /10 | Weighted | Status |
|--------|--------|-----------|----------|--------|
| P1 GBP Readiness and Parity | 22% | 1 | 2.2 | FAIL |
| P2 Reviews and Reputation | 16% | 1 | 1.6 | FAIL |
| P3 Content Quality and E-E-A-T | 20% | 5 | 10.0 | FAIL |
| P4 Schema and Technical | 12% | 6 | 7.2 | FAIL |
| P5 NAP and Citations | 10% | 4 | 4.0 | FAIL |
| P6 Architecture and Internal Linking | 7% | 6 | 4.2 | FAIL |
| P7 Competitive Position | 7% | 4 (estimated) | 2.8 | FAIL |
| P8 Conversion and Funnel | 6% | 4 | 2.4 | FAIL |
| **Total** | **100%** | | **34.4** | |

**Three-mode view:** Pack readiness 2/10 | Organic readiness 6/10 | AI-search readiness 4/10

## Executive Summary

Beatrox has a genuinely strong on-page foundation: dedicated service pages at 859 to 1,161 words with FAQ and Service schema, clean URLs, fast server-rendered HTML, and a local niche (experiential production plus drone shows, laser shows, and LED walls) that no Portland competitor occupies. The three biggest gaps are structural, not cosmetic: there is no Google Business Profile at all, there is no review footprint anywhere, and the domain strategy is unresolved (the crawled deployment canonicals to www.beatrox.com while serving on a vercel.app host). The fastest wins are claiming and verifying the GBP, fixing the homepage title and H1 to carry "Portland," and wiring GA4 so conversions are measurable. Elite requires the GBP to exist with full parity, a review program producing 15 to 20 plus reviews, homepage copy depth, and the schema stack completed (geo, hours, @id, full offer catalog).

## Competitive Benchmark (top 3 local competitors)

Evidence: audit-evidence/competitors/*.txt (search API snapshots, 2026-08-07; GBP categories and review counts need manual Maps verification, finding P7-01).

| Metric | Beatrox | MeyerPro | The AV Department | Pro Sound & Lighting | Leader |
|--------|---------|----------|-------------------|----------------------|--------|
| Reviews (count / rating) | 0 / none (no GBP) | Not confirmed; 41 yr company | Google 5.0 (5) | ~56, 5 star snippet (MapQuest) | Pro Sound & Lighting |
| Review recency | n/a | Unverified | Unverified | Unverified | n/a |
| Primary category | n/a (no GBP) | Unverified | Unverified | AV rental per MapQuest | n/a |
| Service pages | 15 /services + 31 /tech | Deep per-service tree | Per-service plus itemized rental price list | Deep per-category rental catalog | MeyerPro |
| Content depth (money pages) | 859-1,161 words/service page | Deep | Deep plus published pricing | Deep catalog | Tie: MeyerPro / AV Dept |

Niche note: drone light show and laser show SERPs for Portland are 100 percent national players with thin Portland landing pages. No local competitor combines experiential production plus drone, laser, and LED wall inventory. That is an open pack lane.

## Findings by Pillar

### P1 GBP Readiness and Parity: 1/10

Rubric anchor 1: no profile exists. Every GBP-01 through GBP-30 checklist item is open. The website side is partially ready (NAP on contact page matches intended GBP NAP exactly; 15 live service pages can back categories and services) but hours, map embed, and a finalized canonical domain are missing, which blocks full parity even after the profile is created.

- **P1-01 (P0, manual) [PACK] [AI]:** No Google Business Profile exists. Pack visibility is zero by definition. Evidence: intake record; audit-evidence/competitors/serp-notes-event-production-portland.txt (Beatrox absent from all sampled query spaces).
- **P1-02 (P1, content) [PACK] [AI]:** No business hours anywhere on the website or in schema; GBP hours parity (GBP-12) has no website source. Evidence: audit-evidence/contact.html (no hours), audit-evidence/homepage.html (LocalBusiness block, no openingHours).
- **P1-03 (P2, manual):** Only 15 of 46 services have live pages under /services; GBP Services section parity (GBP-08) can only mirror what exists. Evidence: audit-evidence/sitemap.xml (15 /services/* URLs), audit-evidence/services.html.

### P2 Reviews and Reputation: 1/10

No GBP means zero Google reviews. No testimonials or review content on any money page (OP-40). No third-party review profiles confirmed (Yelp, Clutch, Facebook). AI eligibility: below every threshold (rating, count, response rate).

- **P2-01 (P2, content/manual) [PACK] [AI]:** Zero reviews or testimonials visible on money pages; no review acquisition program exists. Evidence: audit-evidence/homepage.html, audit-evidence/service-event-production.html (no review content).

### P3 Content Quality and E-E-A-T: 5/10

Strengths: per-service pages with Capabilities, Process, FAQ, CTA structure at 859 to 1,161 words; real project portfolio with named clients (Super Bowl 2020, BuzzFeed); team page with named staff and roles; FAQPage content on service pages. Weaknesses: thin homepage, missing city in homepage title and H1 (mandatory check), duplicated brand suffix in several titles, generic deck image alts.

- **P3-01 (P1, content) [ORGANIC] [AI]:** Homepage H1 "Beatrox Experiential and Event Production" contains the service keyword but not the primary city (OP-17, OP-23 mandatory check). Note: this H1 was set by explicit client directive on 2026-08-07; remediation options in directive, client may record a deviation. Evidence: audit-evidence/homepage.html (H1 verbatim).
- **P3-02 (P1, content) [ORGANIC] [AI]:** Homepage title "BEATROX — Experiential Design & Event Production" lacks the primary city (OP-14, OP-15 mandatory check). Evidence: audit-evidence/homepage.html (title verbatim).
- **P3-03 (P1, content) [ORGANIC] [AI]:** Homepage body copy is approximately 338 words including chrome, below the 400 to 600 word money-homepage standard (OP-23). Evidence: audit-evidence/homepage.html, crawl word count.
- **P3-05 (P2, code) [ORGANIC]:** Title brand duplication on multiple pages, rendered verbatim as "Services — BEATROX | BEATROX", "Work — BEATROX | BEATROX", "Contact BEATROX — Book a Consultation | BEATROX" (OP-13, OP-14). Evidence: audit-evidence/services.html, work.html, contact.html (titles verbatim).
- **P3-07 (P3, content) [ORGANIC]:** Rendered em dashes in titles and metadata site-wide (Dash Law; content_lint.py gate). Lint output is noisy (1205 flagged lines, predominantly Tailwind classes and code comments) but genuine prose em dashes render live, e.g. /book title. Evidence: audit-evidence/content_lint.txt, audit-evidence/book.html.
- **P3-06 (P3, content) [ORGANIC]:** Generic deck image alt text ("Aku World deck image 4", "Drone Light Shows image 3") misses local and service relevance (OP-22). Evidence: audit-evidence/service-drone-light-shows.html, work.html.

### P4 Schema and Technical: 6/10

Strengths: valid JSON-LD on every page, Service plus BreadcrumbList plus FAQPage on service pages, ItemList on /services, HTTPS everywhere, clean robots.txt, all images carry alt attributes, SSR content fully crawlable (OP-68 pass). Weaknesses: incomplete LocalBusiness property stack, sitewide entity duplication, missing canonical on /book, synthetic sitemap lastmod.

- **P4-01 (P1, code) [ORGANIC]:** /book renders without a canonical tag; its generateMetadata omits canonicalPath. Evidence: audit-evidence/book.html (no canonical), site/app/(site)/book/page.tsx:7-11.
- **P4-03 (P2, code) [ORGANIC] [AI]:** LocalBusiness block lacks geo, openingHours, @id, hasMap, and image; areaServed is a free-text string ("Portland, OR and worldwide") instead of structured entities (OP-04, OP-05). Evidence: audit-evidence/homepage.html (full block), site/lib/schema.ts (buildLocalBusinessSchema).
- **P4-02 (P2, code) [ORGANIC] [AI]:** Full LocalBusiness with address is emitted sitewide on every page (OP-08), and Organization plus LocalBusiness duplicate the same entity with no shared @id (OP-07). Evidence: audit-evidence/*.html (identical block on all pages), site/app/(site)/layout.tsx:97-98.
- **P4-04 (P2, code) [ORGANIC] [AI]:** Live schema offer catalog covers only 8 of 46 services (OP-06). Evidence: audit-evidence/homepage.html (LocalBusiness block), schema/schema-beatrox-locbiz.jsonld (orphaned file, 8 offers), site/lib/schema.ts.
- **P4-05 (P3, code) [ORGANIC] [AI]:** Sitemap lastmod is a single build timestamp across all 79 URLs, not per-page freshness (OP-57, OP-70). Evidence: audit-evidence/sitemap.xml, site/app/(site)/sitemap.ts:24.
- **P4-06 (P3, code):** schema/schema-beatrox-locbiz.jsonld is orphaned (not served anywhere); it drifts from the live schema (richer content, different name string). Evidence: repo grep, zero references.

### P5 NAP and Citations: 4/10

Contact page NAP matches the intended GBP NAP exactly. Phone digits are consistent sitewide. But the footer address renders with drift ("1313 SE 3rd Ave Portland , OR 97214", missing comma and stray space), the business name appears as "BEATROX" and "Beatrox LLC" but never as the intended GBP name "Beatrox" in exact case, and no core citations exist (Bing Places, Apple Business Connect, Yelp, Facebook, BBB all absent; GBP itself absent).

- **P5-01 (P1, code) [PACK] [AI]:** Footer address formatting drift vs contact page exact string (OP-61). Evidence: audit-evidence/homepage.html:1 (footer) vs audit-evidence/contact.html:1.
- **P5-03 (P1, content) [PACK] [AI]:** Name case non-parity: site uses "BEATROX" (styling) and "Beatrox LLC" (legal); intended GBP name is "Beatrox". nap_parity.py confirms zero exact-case "Beatrox" instances in rendered content sources. Evidence: audit-evidence/nap_parity.txt, site/content/contact.json:29.
- **P5-02 (P2, manual) [PACK] [AI]:** No core citations (Bing Places, Apple Business Connect, Yelp, Facebook, BBB). Evidence: competitor research notes; unverified beyond absence in sampled SERPs.

### P6 Architecture and Internal Linking: 6/10

Clean descriptive URLs, every money page within 2 clicks, nav exposes Services, no orphan money pages found, no doorway pages, no city-list stuffing (OP-45 pass). Issues: service equity split across two namespaces, rentals handed off to an external domain.

- **P6-01 (P1, config) [ORGANIC] [PACK]:** /rentals permanently redirects (308) to an external vercel.app deployment branding itself "BEATROX LLC" with its own self-canonical; the in-repo rentals landing page is dead code. Splits entity and link signals across two hosts. Evidence: audit-evidence/rentals.html, site/next.config redirects.
- **P3-04 (P2, code/content) [ORGANIC]:** 46 services split across /services/* (15) and /tech/* (31) with /services index linking only 15; fragments the service mesh (OP-24, OP-33, OP-34). Evidence: audit-evidence/sitemap.xml, audit-evidence/services.html.

### P7 Competitive Position: 4/10 (estimated)

Estimated per rubric (no geo-grid run). Organic niche is uncontested locally (drone, laser, LED wall, experiential production combination), but with no GBP the business is invisible in the pack for every non-brand query. MeyerPro is the closest all-around local competitor; Pro Sound & Lighting holds the strongest visible review base (~56).

- **P7-01 (P2, manual) [PACK]:** Competitor GBP primary categories and review counts captured from a search API, not live Maps; verify top-3 category stacks manually (GC-20) before finalizing Beatrox categories. Evidence: audit-evidence/competitors/*.txt.

### P8 Conversion and Funnel: 4/10

Clear primary CTA ("Book a Consultation") in hero and persistent nav, tel: link in the footer of every page, booking flow states what happens next. Failures: oversized contact form, no trust signals near CTAs, no conversion measurement live, no map embed.

- **P8-01 (P1, code) [ORGANIC] [PACK]:** Contact form carries roughly 12 user-facing fields including 12 service checkboxes, event date, and budget; standard is 3 to 5 (OP-48). Evidence: audit-evidence/contact.html (form inventory).
- **P8-02 (P1, content) [ORGANIC]:** No trust signal above the fold or adjacent to any CTA: no reviews, ratings, client logos, or years-in-business near hero or form (OP-46, OP-49). Evidence: audit-evidence/homepage.html, contact.html.
- **P8-03 (P1, config) [ORGANIC]:** GA4 snippet is env-gated and the env var is unset on the live deployment; zero conversion events fire; no thank-you page tracking (OP-51, OP-63). Evidence: audit-evidence/homepage.html (no googletagmanager reference), site/app/(site)/layout.tsx:123-139.
- **P8-04 (P2, code) [PACK]:** No embedded Google Map on /contact or anywhere (OP-50). Evidence: audit-evidence/contact.html.

## Remediation Summary

- P0 findings: 2 (P1-01 no GBP; P1-04 domain strategy, see directive) (must close before Elite)
- P1 findings: 9
- P2/P3 findings: 10
- Code-actionable (K3): 12 | Config: 3 | Content: 4 | Manual (client): 5
- Full machine-actionable directive: remediation-directive.json (same directory)

## Path to Elite

1. Manual, week 1: create and verify the GBP (video verification shot list in GBP blueprint), decide the canonical domain and wire www.beatrox.com to this deployment. Closes P0-01, P0-02. P1 moves 1 to 7.
2. Code sprint: homepage title and H1 city inclusion (or recorded deviation), title suffix bug, footer NAP string, /book canonical, schema stack (geo, hours, @id, hasMap, full offer catalog), GA4 env, map embed, contact form trim. Closes 8 P1s. P3 to 7, P4 to 8, P5 to 7, P8 to 7.
3. Content sprint: homepage to 400 to 600 words with Portland entities, review/testimonial blocks on money pages, consolidate /tech into /services or cross-link the mesh. P3 to 8, P6 to 8.
4. Manual, weeks 2 to 6: review acquisition program (target 15 to 20 Google reviews, 4.5 plus), citations build-out, GBP services and media per blueprint. P2 to 7, P5 to 8, P1 to 9.
5. Re-audit gate: lint pass on generated content, nap_parity pass against live GBP, composite >= 85 with all pillars >= 8.

Expected post-remediation composite: 82 to 88 depending on review velocity; reviews are the long pole.

## Accepted Deviations (if any)

Recorded 2026-08-07, client direction: **Beatrox is a global company, not hyper-local to Portland or the Pacific Northwest.** The brand's proof points are Netflix, Adidas, and Super Bowl-scale work. Consequences:

- P3-01 (city in homepage H1): DECLINED. The H1 stays "Beatrox Experiential and Event Production" exactly as directed. P3 caps at 7 under the deviation rule.
- P3-02 (city in homepage title): DECLINED for the main site. The title targets the global head term instead: "Experiential Design & Event Production | BEATROX".
- The Portland intro section on the homepage was rewritten to global positioning ("Based in Portland, producing worldwide") rather than hyper-local entity copy.
- Schema areaServed reduced to the studio city plus the United States; metro city lists removed.
- **All hyper-local Portland SEO scope moves to the rentals property (rentals.beatrox.com)**: local title tags and content, Portland rental queries ("led video wall rental portland", "audiovisual equipment rental portland"), and any future location or service-area pages live there. The GBP remains a single hybrid profile for Beatrox at 1313 SE 3rd Ave (one profile per business per address; a second profile for rentals is a suspension risk, GC-06/GC-07).

Composite is therefore reported as "Elite with deviations" once the remaining gates close; P0s must still close.

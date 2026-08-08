# Beatrox Elite SEO Master Plan (Full Site + GBP Strategy)

**Date:** 2026-08-08
**Scope:** beatrox.com (national/global experiential production brand) + rentals.beatrox.com (hyper-local Portland/PNW rentals arm) + Google Business Profile strategy.
**Method:** Elite Local SEO Audit skill pipeline, prior audit evidence (`audit-evidence/`, re-audit addendum 2026-08-07), plus fresh July-2026 protocol research (Whitespark LSRF 2026, Google Search Central May 2026 AI guide, GBP guideline pages fetched 2026-08-08, Sterling Sky, BrightLocal, Search Engine Land).
**Status:** PLAN ONLY. No site changes in this document. Client intake confirmed 2026-08-08: founded 2011; exterior Beatrox signage exists at 1313 SE 3rd Ave (address-shown hybrid model). Rentals launches on the main `Beatrox` GBP and migrates to a dedicated `Beatrox Rentals` profile once signage, phone, and verification assets exist.

---

## 1. Executive Summary

**How elite is the SEO today: 44/100 composite. Not Elite.** The codebase-side work on branch `seo/elite-local-remediation` is genuinely strong (schema stack, titles, NAP parity, content structure all near Elite). What holds the score down is not code: there is no Google Business Profile (P0), the canonical domain www.beatrox.com is not wired (P0), zero reviews exist anywhere (P0-equivalent for local and AI visibility), no citations exist, and the rentals site (the entire hyper-local play) is a client-rendered SPA that serves an empty 4 KB shell to crawlers and AI bots.

**The single biggest structural insight:** Beatrox is two SEO businesses wearing one brand.

1. **beatrox.com** competes for national B2B/agency queries ("experiential marketing agency", "event production company"). Won with topical authority, case-study content, entity building, and digital PR. The map pack barely matters here.
2. **rentals.beatrox.com** competes for local pack queries ("led video wall rental portland"). Won with GBP excellence, the `Audiovisual equipment rental service` category, proximity, and review velocity. This is the only part of the business with true local-intent demand, and it is currently invisible to crawlers.

**GBP answer (Section 6):** ONE profile now, named `Beatrox`, primary category `Event management company`, with the rentals arm carried on it (rental service entries + the `Audiovisual equipment rental service` category). Per client decision 2026-08-08, rentals migrates to a dedicated `Beatrox Rentals` profile once rentals signage, a separate phone line, and video-verification assets exist. The full migration checklist is in blueprint v2 Appendix B.

---

## 2. Current Elite Scorecard

Scores from the evidence-based re-audit (2026-08-07, staged preview), with notes on what changed since (services index GES restructure + FAQ, rentals domain live). A fresh evidence crawl is Phase 0 of implementation; directional changes marked with ~.

| Pillar | Weight | Score | Elite gate (>=8) | What is missing |
|---|---|---|---|---|
| P1 GBP Readiness | 22% | 1 | FAIL | No GBP exists (P0). Domain not wired (P0). Site-side parity (hours, schema, NAP) is done. |
| P2 Reviews | 16% | 1 | FAIL | Zero reviews, zero testimonials on money pages, no acquisition program. AI eligibility filter territory (sub-3.4 = exclusion; absent = invisible). |
| P3 Content / E-E-A-T | 20% | 7 | FAIL (capped) | Capped at 7 by accepted deviation (no city in homepage H1/title, deliberate global-brand choice). Open: service mesh fragmentation (P3-04), deck image alts (P3-06), ~1,000 em-dash lint violations in rendered content (blocks the Elite lint gate). |
| P4 Schema / Technical | 12% | 8 | PASS~ | LocalBusiness stack, Service, Breadcrumb, FAQPage, VideoObject all live. Keep validators green; add Person schema for leadership (2026 E-E-A-T practice). |
| P5 NAP / Citations | 10% | 5 | FAIL | Website NAP fixed. No external citations (Bing Places, Apple Business Connect, Yelp, Facebook, BBB). nap_parity script still flags "Beatrox" never rendered as exact-case plain text. |
| P6 Architecture | 7% | 6 | FAIL | /services (15 pages) and /tech (31 pages) are two silos that never cross-link. Rentals dead code behind the 308. ~Improving with rentals.beatrox.com live. |
| P7 Competitive | 7% | 4 (est) | FAIL | Competitor GBP data came from search APIs, never verified against live Maps (P7-01). Portland incumbents all run one-brand production+rental models with low review counts: winnable. |
| P8 Conversion | 6% | 6 | FAIL | Form trimmed to 4 fields, map embedded, trust line live. GA4 env var unset in production = zero conversion measurement (P8-03). No thank-you events. |

**Composite: 44/100.** Elite requires composite >= 85, every pillar >= 8, zero P0s, content_lint pass, nap_parity pass.

**The honest headline:** the website is roughly 80% of the way to Elite on the pillars code can fix. The unfixable-by-code 60 points (GBP, reviews, citations, domain wiring, analytics) are now the entire ballgame.

---

## 3. July 2026 Protocol Alignment

What the current (mid-2026) rulebook says, mapped against Beatrox. Sources cited inline.

| 2026 protocol | Source | Beatrox status |
|---|---|---|
| Primary GBP category is the #1 pack factor, weight up vs 2023 | Whitespark LSRF 2026 (Nov 2025), whitespark.ca/local-search-ranking-factors | No profile. Blueprint ready with `Event management company`. |
| "Open at time of search" is a new top-5 pack factor; address-shown beats SAB-hidden (new #7) | Whitespark 2026 | Hours now on /contact + schema (P1-02 closed). Address display model pending client confirmation. |
| Review recency jumped #93 to #11; 4 to 8/month steady velocity; 4.5-star floor; respond to 100% within 24h | Whitespark 2026; BrightLocal 2026 survey | Zero reviews. SOP written in blueprint Section 13. |
| Diversity Update: one company cannot hold top pack + top organic for the same query; GBP landing page and organic target should be deliberately different URLs | Sterling Sky (updated Aug 2026); Search Engine Land case study (Mar 2026) | Relevant to rentals: GBP link vs organic target split planned in blueprint v2. |
| FAQ rich results fully deprecated May 7, 2026 (GSC/RRT support removed June 2026). Keep FAQPage schema as machine-readable grounding; never justify FAQ work as a SERP feature | Search Engine Land (May 8, 2026); skill OP-39 | Compliant: FAQPage kept on /services + detail pages for AI/voice parsing, no SERP-feature expectation. |
| GBP Q&A removed (API killed Nov 3, 2025; public section removed Dec 3, 2025), replaced by Gemini "Ask Maps" answering from profile fields + website + reviews | Search Engine Roundtable (Dec 2025); Socius (Feb 2026) | Blueprint v2 drops Q&A seeding; FAQ content lives on the website where Ask Maps reads it. |
| Google's first official AI-optimization guide (May 15, 2026): "it is still SEO." Killed myths: llms.txt (dead), content chunking, AI-rewrite projects, mention-seeding, schema-as-AI-lever. Wins: non-commodity first-hand content, deep single pages, named authors | Google Search Central (May 2026) | Aligned by design: real project portfolio, named team, SSR content. No llms.txt planned. Rentals SPA violates "crawlable content" outright. |
| AI Overview citation share is a KPI separate from rank (only ~17 to 54% of AIO citations come from top-10 organic); ~82% of B2B tech queries render AIOs | Glenn Gabe (May 2026); BrightEdge (Feb 2026) | Not measured. AI share-of-model tracking added to plan (OP-71). |
| Case-study SEO is the standout 2026 B2B tactic: original data, disclosed methodology, named clients | Google May 2026 guide; practitioner consensus | Beatrox has 17 project pages with Adidas/Netflix-scale brands. Underexploited: needs problem/fix/result structure with metrics. |
| Location pages only with genuine presence and 40 to 60%+ unique local proof; May 2026 core hammered thin near-me content | Google spam policy; Whitespark 2026 | Compliant by strategy: zero city-page sprawl on beatrox.com; Portland/PNW pages legitimate on rentals (real presence). |
| March 2026 core: 79.5% of top-3 URLs churned; winners were official/institutional sites, niche specialists, brands | Massive Designs volatility timeline (Jul 2026) | Supports the niche-specialist positioning over generalist copy. |
| Industry-relevant links beat volume; unstructured citations (press, best-of lists) are top AI-visibility factors | Whitespark 2026 | Digital PR program defined in Section 4. |
| CWV at 75th percentile (LCP <=2.5s, INP <=200ms, CLS <=0.1) as tiebreaker; Dec 2025 update raised the bar | web.dev; Dataslayer (Jul 2026) | ISR restored sitewide (commit 181f09e); needs field-data verification once on the real domain. |
| Video verification is the 2026 default for new GBPs; 30 to 40% first-attempt failure; signage must match name exactly | Sterling Sky (Aug 2026); JXT Group (Apr 2026) | Shot list in blueprint Section 14; signage confirmation pending. |
| Suspension sweeps cluster in April and October; batch edits of high-trust fields are the top practitioner-seen trigger | J. Cerme sweep report (Apr 2026); GBP Fixers | Edit-spacing rule in blueprint; schedule GBP creation accordingly (August is a safe window). |

---

## 4. The 100%-Optimized Structure (National Brand + Hyper-Local Arm)

### 4.1 beatrox.com: the national authority play

Target queries: "experiential marketing agency", "event production company", "brand activation agency", service terms with no geo modifier. These rank on topical authority and entity strength, not the map pack.

1. **Entity home (mostly done).** LocalBusiness+Organization anchor on the homepage with stable `@id`, sameAs chain, geo, hours, offer catalog of 46 services. Remaining: render "Beatrox" once as exact-case plain text (footer NAP block) so nap_parity passes; add Person schema for named leadership (Nathan Jenkins, Joey Paulekas, et al.) with sameAs links; pursue a Wikidata entry once press coverage supports notability.
2. **Two hubs, one mesh (fixes P3-04, P6).** /services (15 production+rental pages) and /tech (31 capability pages) currently never cross-link. Fix: related-services modules on every detail page (service to its tech capabilities and back), the /services A-to-Z catalog links all 46, and breadcrumb/anchor text carries exact service phrases. No new pages needed; pure internal-linking work.
3. **Case-study engine (the 2026 moat).** Upgrade the 17 /work pages from gallery pages to decision-grade case studies: problem, approach, result with real metrics (attendance, dwell time, impressions, build dimensions), named client, named Beatrox lead. This is exactly the "non-commodity content" the May 2026 Google guide rewards and AI engines cite. Priority: Run for the Oceans, Aku World, Projekt X, Myshelter, Super Bowl 2020 AR mirror, Netflix Comic-Con.
4. **Team/About as E-E-A-T surface.** Named authors with verifiable off-site credentials (touring credits, ImagineX, Sky Lites). About page carries founding story with a confirmed founding year.
5. **No city-page sprawl.** Portland/PNW is real; everything else is served-nationwide copy. Any future location content must pass the substitution test with 60%+ unique local proof, which in practice means: only build a city page when Beatrox has completed real projects there with photos and a case study (e.g., a legitimate "Empire State Building projection" NYC proof point could support one strong NYC page, not a template).
6. **Digital PR + curated lists (AI visibility).** Targets: Clutch and comparable B2B review platforms (doubles as review surface for the agency side), event-industry press (Event Marketer, BizBash, EXHIBITOR), Portland business media (Portland Business Journal, Oregon Business), "best experiential agencies" listicles. These are simultaneously link equity, unstructured citations, and the #1 AI-visibility factor class.

### 4.2 rentals.beatrox.com: the hyper-local pack play (currently broken)

Target queries: "led video wall rental portland", "sound equipment rental portland", "dj equipment rental portland", "backline rental portland", "pa system rental vancouver wa". These are pack queries: proximity + category + reviews + a crawlable local website.

The 2026-07-22 rentals audit (`reports/beatrox-rentals-audit.md`) found the site is a pure client-side React SPA: every route serves an identical 4 KB shell. Under OP-68 this fails outright: Googlebot renders eventually, but AI crawlers (GPTBot et al.) do not execute JavaScript, and the content simply does not exist in the served HTML. The hyper-local play currently has no on-page SEO at all.

Required structure (implementation is out of scope here):

1. **SSR or prerender every route** (the audit recommends the same). Non-negotiable foundation.
2. **One page per rental category**, 800 to 1,500 words each: LED video walls, sound equipment, DJ equipment, backline and stage, lighting systems, laser systems (all six exist in `content/rentals.json`). Each with pricing guidance (rentals are price-queried; "from $X/day" transparency wins), inventory specs, delivery area, FAQ, and Portland entity references (Central Eastside, Oregon Convention Center, Moda Center, Pioneer Courthouse Square, Vancouver WA, Beaverton, Lake Oswego).
3. **LocalBusiness schema on rentals.beatrox.com** with the same NAP, its own `@id` (`https://rentals.beatrox.com/#localbusiness`), areaServed Portland metro + PNW cities. If a second GBP ever launches, this schema becomes its parity anchor.
4. **NAP as plain HTML text in the footer**, identical strings to the main site and GBP.
5. **Fix canonicals/OG/sitemap** (they point at beatrox.com and the old vercel.app host), kill soft-404s, submit the rentals sitemap to GSC and Bing WMT separately.
6. **Review and proof surface:** testimonials from Portland rental clients on the money pages (no AggregateRating self-serving markup on LocalBusiness; stars come from GBP).
7. **Diversity Update split:** the rentals GBP (if created) links to the rentals homepage; the page optimized for organic "led video wall rental portland" is the LED category page, deliberately a different URL.

### 4.3 Shared infrastructure

- Wire www.beatrox.com (P0, P1-04): DNS + Vercel domain + 301 from the vercel.app host. Everything canonical already points there; the site just does not answer there yet.
- Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` and add conversion events (form submit, booking, tel: click) with thank-you states (P8-03, OP-51).
- Em-dash remediation: ~1,000 genuine violations across `content/` and `site/content/` JSON prose plus hardcoded tsx strings. Mechanical find-and-fix; the Elite lint gate cannot pass until zero. (Note: lint double-hyphen hits are false positives from Tailwind/CSS; only true prose dashes count.)
- Deck image alt rewrite (P3-06).
- Bing Webmaster Tools verification (ChatGPT search leans on Bing's index, OP-69).

---

## 5. Gap List to Elite (Ordered Execution Plan)

Phase 0: fresh evidence crawl of the staged preview (post services-rework) to re-baseline scores.

**Phase A: code/ops, week 1 to 2 (agent-executable)**
1. Wire www.beatrox.com; verify 301s, sitemap, robots, canonicals resolve on the real domain. Closes P1-04 (P0).
2. Em-dash lint remediation across content trees and tsx strings. Closes the lint gate.
3. Service mesh cross-linking (/services to /tech and back). Closes P3-04.
4. Render "Beatrox" exact-case in footer NAP; re-run nap_parity. 
5. GA4 env + conversion events + thank-you states. Closes P8-03.
6. Deck image alts. Closes P3-06.
7. Person schema for leadership; remove rentals dead code (`site/app/(site)/rentals/page.tsx`, decide fate of `site/content/rentals.json`).

**Phase B: GBP creation, week 2 to 4 (client executes, blueprint v2 ready)**
8. Verify domain in Search Console on the managing Google account first (instant-verification path).
9. Create the `Beatrox` profile per blueprint v2. Video verification shot list ready. August is outside the April/October sweep windows.
10. Confirm founding year and address display model (pending client answers) before publishing.

**Phase C: citations + reviews, week 3 to 8 (client, scripted)**
11. Citations in order: Bing Places, Apple Business Connect, Facebook, Yelp, BBB, then Clutch/LinkedIn (B2B tier). NAP strings copied char-for-char from the website.
12. Review SOP live: ask at project wrap / gear return, 4 to 8 per month steady, 100% responses within 24h, no incentives, no keyword coaching.

**Phase D: rentals site remediation, week 4 to 10 (separate repo)**
13. SSR/prerender, per-category local pages, rentals LocalBusiness schema, canonical/sitemap fixes, Portland entity copy.
14. Manual competitor pack verification (incognito Maps: "AV rental Portland", "event production company Portland"): categories via page-source/GMBspy, review counts, SAB-vs-storefront. Closes P7-01 and calibrates the rentals category choice.

**Phase E: measurement, ongoing**
15. AI share-of-model: monthly, 10 to 20 priority queries across ChatGPT, Perplexity, Gemini, AI Overviews (OP-71). Track AIO citation share separately from rank.
16. Geo-grid tracking for Portland rental queries once the GBP is live.
17. Quarterly: category re-validation (taxonomy updates monthly), money-page freshness, GBP posts cadence.

---

## 6. The GBP Question: One Profile or Two?

### What Google's guidelines actually say (fetched verbatim 2026-08-08, support.google.com/business/answer/3038177)

- "There should only be one profile per business."
- Two brands at one address: allowed **only if the brands operate independently** (Google's own example is KFC/Taco Bell co-located franchises).
- Sub-brand naming is explicitly fine ("Nordstrom" / "Nordstrom Rack"), so `Beatrox` + `Beatrox Rentals` is acceptable naming IF independence is real.
- Departments need their own customer entrance, distinct categories, distinct staff: big-box scale, not applicable here.
- Joy Hawkins' Google-confirmed litmus test (Sterling Sky, Jul 2025): two listings at one address survive only when the businesses are in **completely different industries** with different categories, services, and customer intents. Her test: "If your second business feels like it could just be another page on your existing website, you probably don't qualify."
- Multiple profiles at one address are a top-3 suspension trigger in 2026 practitioner reporting; suspension reports rose 80%+ globally, with algorithmic sweeps each April and October.

### Applied to Beatrox

The honest tension: an experiential production agency and an AV rental house are **adjacent** industries under the event-services umbrella (shared address, likely shared staff, overlapping `Event technology service` category). That fails the strict Hawkins test. BUT the countervailing facts are unusually strong: rentals already has its own domain (rentals.beatrox.com), genuinely different customer intent (a producer renting a PA for a wedding vs a global brand team scoping a Comic-Con activation), and a genuinely different category (`Audiovisual equipment rental service` vs `Event management company`).

Market context: every Portland incumbent (Seamless Event Solutions, West Coast Event Productions, AV Rental Services) runs production and rental under ONE brand and ONE profile. 4Wall, the closest national analog, runs one brand with per-city listings, never a service/rentals brand split at one address.

### Recommendation (updated with client intake, 2026-08-08)

**Phase 1, now: ONE GBP named `Beatrox`.** Primary `Event management company`; secondaries include `Audiovisual equipment rental service` so the single profile is eligible for rental queries while it is the only profile. Address SHOWN (hybrid): exterior Beatrox signage exists at 1313 SE 3rd Ave per client confirmation, the studio receives clients by appointment, and showing the address is a new top-10 pack factor in Whitespark 2026 (SAB-hidden carries a structural handicap). The profile's job for the agency side is entity anchoring, the Portland address, and the review surface; national clients arrive via referral, organic, and AI citations, not the pack.

**Phase 2, when assets exist (client-confirmed migration):** rentals launches on the main profile in Phase 1 and migrates to a dedicated `Beatrox Rentals` profile once the independence assets are physically real. Client confirmed all six conditions are achievable. The ordered migration checklist lives in blueprint v2 Appendix B; the short version:

1. Install `Beatrox Rentals` signage at 1313 SE 3rd Ave, register a DBA if possible, provision the separate rentals phone line. CLIENT TO BUILD.
2. Complete the rentals site SSR remediation (Phase D) first. Do NOT launch the second GBP against a client-rendered shell.
3. Film the rentals verification video (rentals signage, inventory, staff-only access) before creating the profile.
4. Create `Beatrox Rentals`: primary `Audiovisual equipment rental service`, secondaries `Party equipment rental service` + `Event technology service`, website rentals.beatrox.com.
5. Stagger the main-profile changes one week apart after the rentals profile is live: first remove the `Audiovisual equipment rental service` category, then remove the four rental service entries (zero-overlap rule).
6. Never create the second profile while the main one is under review or inside its first 90 days. Existing reviews stay on the main profile (Google does not transfer reviews); the rentals profile builds its own stream from gear-return asks.

**Why Phase 2 is worth it:** local-pack ranking for "LED wall rental Portland" practically requires the `Audiovisual equipment rental service` PRIMARY category, which the agency profile can never honestly carry. Portland incumbents show low review counts, so a dedicated rentals GBP with a steady review program could plausibly lead that pack within 6 to 12 months of launch. Sequencing matters: launching both at once, or launching the second before the independence assets physically exist, is the exact pattern that triggers same-address suspensions and can take the main profile down with it.

Blueprint v2 (`gbp-blueprint.md`, rewritten today) contains the full field-by-field setup for the `Beatrox` profile (rentals included), plus Appendix B with the complete, ready-to-deploy `Beatrox Rentals` profile and the ordered migration checklist.

---

## 7. What Elite Looks Like When Done (Scorecard Projection)

| Pillar | Now | After Phase A-E | Note |
|---|---|---|---|
| P1 GBP | 1 | 9 | Profile live, verified, full parity |
| P2 Reviews | 1 | 8 | 4 to 8/month velocity, 4.5+ floor, 100% responses |
| P3 Content | 7 | 8 to 9 | Mesh fixed, lint clean, case studies deepened; deviation cap revisited |
| P4 Schema | 8 | 9 | Person nodes added, validators green on real domain |
| P5 Citations | 5 | 9 | Core + B2B tiers live, parity script green |
| P6 Architecture | 6 | 9 | One mesh, rentals SSR live, clean splits |
| P7 Competitive | 4 | 8 | Verified against live Maps data; rental pack top-3 in reach |
| P8 Conversion | 6 | 9 | GA4 events, thank-you states, call tracking |
| **Composite** | **44** | **~87 to 90** | Elite threshold: 85 with all pillars >= 8 |

---

## Appendix: Evidence and Source Register

- Prior audit: `reports/elite-local-seo-audit/audit-report.md` + re-audit addendum; directive: `remediation-directive.json` (26 findings, 17 closed, 9 open as of 2026-08-07).
- Crawl evidence: `audit-evidence/` (2026-08-07), `audit-evidence/reaudit/`.
- Rentals audit: `reports/beatrox-rentals-audit.md` (2026-07-22, separate repo lxrxvci/beatrox-rentals).
- Whitespark 2026 Local Search Ranking Factors: https://whitespark.ca/local-search-ranking-factors/ (Nov 2025)
- Google Search Central, "Optimizing your website for generative AI features": May 15, 2026
- Google GBP Guidelines: https://support.google.com/business/answer/3038177 (fetched 2026-08-08)
- FAQ deprecation: Search Engine Land, May 8, 2026 (searchengineland.com/google-to-no-longer-support-faq-rich-results-476957)
- Q&A removal / Ask Maps: Search Engine Roundtable, Dec 2025; Google Keyword blog, Mar 12, 2026
- Diversity Update: Sterling Sky (updated Aug 2026); Search Engine Land case study (Mar 31, 2026)
- Two-listings-at-one-address: Sterling Sky (Jul 24, 2025), sterlingsky.ca/two-google-business-profiles-same-address; Moz (Jul 2024)
- GBP category taxonomy confirmation: Dalton Luka (May 2026), Local Dominator (Feb 2026), VOXA (Jul 2025) category lists
- Verification: Sterling Sky video verification guide (Aug 2026); JXT Group (Apr 2026)
- Reviews: BrightLocal 2026 Local Consumer Review Survey; Sterling Sky review-text ranking test

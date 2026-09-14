# Beatrox Master Plan — Nathan's Sep 9 Priorities (SEO + Rentals + Front/Twilio)

**Date:** 2026-09-13
**Source:** Nathan Jenkins email, Sep 9 2026 ("Beatrox SEO + Rentals + Front/Twilio Setup Priorities") + "Beatrox LLC Website Terms of Service & Terms and Conditions.md" (effective Sep 12, 2026)
**Status:** Phase 1 code complete (legal pages, both sites). Phase 3 code complete (GA4 events, sitemap, schema, robots, redirects, alt text). Phase 4 in progress on `~/beatrox-rentals`: 4.1 re-audit done (Square migration fixed payments, JWT/race/bypass all resolved; still open: test-item live in DB, ADMIN_EMAILS unset, GA4 env unset); 4.2/4.4 code fixes done (migration 025 deactivates test item, sitemap test-product filter, LocalBusiness tel/geo/priceRange, Stripe→Square docs); 4.3 prerendering done (Playwright postbuild, 86/86 routes, verified through `vercel build` filesystem-first routing; watch first Vercel deploy log for Chromium install). All uncommitted. Remaining: 4.5 Artfox inventory (needs specs/pricing/qty from Nathan), 4.6 landing pages (keyword map sign-off first). Blocked: GSC access, Twilio/Front (Nathan), legal review before deploy.

---

## 0. Executive summary

Nathan's email assumes beatrox.com has significant indexing defects. **Investigation shows the main site is in much better shape than assumed** — redirects, canonicals, sitemap, and NAP are already clean. The real fires are elsewhere:

1. **No legal pages exist anywhere** (`/terms`, `/privacy` all 404). This is now a *hard blocker* for Twilio A2P 10DLC approval — as of June 30, 2026, Twilio rejects campaign submissions without live privacy-policy and SMS-terms URLs. The ToS Nathan sent is ready to publish; a Privacy Policy + SMS Terms still need to be drafted.
2. **rentals.beatrox.com is a pure client-side SPA** (separate repo `lxrxvci/beatrox-rentals`, local `~/beatrox-rentals/`) that serves HTTP 200 + an identical empty shell for *every possible URL*. This single fact explains nearly all of the GSC "soft 404 / crawled-not-indexed / discovered-not-indexed" clusters on the rental subdomain. It also has a live test product (`/product/test-item-1`) in its sitemap.
3. **Zero conversion tracking**: GA4 (`G-CQMP5KHQ5S`) loads but records no events — forms, tel: clicks, and rental click-throughs are invisible.
4. The Front/Twilio plan Nathan drafted is fundamentally sound; corrections are in console navigation, campaign-type choice, and the website prerequisites that must ship first.

**Recommended order:** Legal pages first (unblocks 10DLC clock) → start Twilio/Front registration in parallel (10–15 day carrier vetting) → main-site SEO hygiene + GSC validation → rentals app SSR + landing-page build-out (largest effort).

---

## 1. Findings — what's actually true today

### 1.1 Main site (beatrox.com) — healthy

Verified in code and live:

- **Host canonicalization clean**: apex/http all 308 to `https://www.beatrox.com/` in ≤2 hops; HSTS on.
- **Legacy Squarespace redirects comprehensive**: all 26 real slugs from `exports/Squarespace-Wordpress-Export-02-25-2026.xml` return 308 to sensible targets (`site/next.config.ts:8-161`). `/home`, `/blog`, `/shop`, `/faq`, `/portfolio` covered; 19 legacy portfolio slugs + 31 `/services/*` → `/tech/*` mappings in place.
- **Sitemap clean**: 78 URLs, all live 200s, no obsolete entries (`site/app/(site)/sitemap.ts`). Deliberately excludes noindex tag pages and the DJ slug that redirects to the rentals app.
- **Canonicals consistent sitewide** via `metadataBase` + `seoToMetadata` (`site/lib/metadata.ts`); self-referencing on every page type; noindex pages self-canonicalize correctly.
- **NAP migration in code is complete**: zero "Halsey" references in any shipped file. `1313 SE 3rd Ave, Portland, OR 97214` lives in exactly two sources of truth — `site/content/contact.json:19-24` and `site/lib/schema.ts:10-13` — and renders in the footer, contact page, and LocalBusiness JSON-LD. Old-address exposure remaining is **off-site only** (Google snippets/citations/GBP), per `reports/elite-local-seo-audit/audit-2026-08-08-live.md:22`.
- **CWV posture good**: poster facades on YouTube embeds, `preload="metadata"` on self-hosted video, lazy iframes. Homepage TTFB ~0.23s from PDX edge.
- **H1s**: exactly one per page, verified across all templates.
- **Titles/meta descriptions** unique on sampled pages; JSON-LD LocalBusiness + Service/FAQ/Breadcrumb/Person coverage is solid.

**Conclusion for Nathan:** his SEO checklist items (redirects, sitemap, canonicals, H1s, address) are largely *already done*. The GSC errors he sees are most likely (a) stale reports from the Squarespace era, (b) the rentals subdomain (see below), or (c) genuinely missing legal pages. First action is **validate fixes in GSC**, not change the site.

### 1.2 Main site — real gaps

| # | Gap | Evidence | Severity |
|---|-----|----------|----------|
| G1 | No legal pages (`/terms`, `/privacy`, etc. all 404); footer has no legal links | live probe; `site/components/Footer.tsx` | **Critical** (blocks 10DLC; GA4 running w/o privacy policy) |
| G2 | GA4 loads but **zero conversion events** — no events on contact/booking form success, tel: links, or rentals outbound clicks | `site/app/(site)/layout.tsx:121-136`; no `gtag('event')` anywhere | High |
| G3 | Sitemap lacks `lastModified`; CMS-driven `/[slug]` pages not included | `site/app/(site)/sitemap.ts` | Medium |
| G4 | Stray untracked `sitemap-beatrox-combined.xml` at repo root (162 URLs, wrong homepage form) | repo root | Low (confusion hazard) |
| G5 | `/portfolio/:path*` not redirected (only bare `/portfolio`); `/about-1` unmapped (404 today — likely correct, verify in GSC) | `site/next.config.ts:47-51` | Low–Medium |
| G6 | Schema gaps: no `VideoObject` on video pages, no `CreativeWork` on project pages, no `WebSite` node | `site/lib/schema.ts` | Medium (rich results) |
| G7 | Generic alt text on hero images ("About page hero", "Services hero media") | `about/page.tsx:53,83,111`, `services/page.tsx:234` | Low |
| G8 | Homepage sitemap entry has trailing slash vs canonical without (textual mismatch only) | sitemap.ts:30-35 vs layout canonical | Trivial |
| G9 | robots.txt doesn't disallow `/preview`, `/proposal`, `/api` (crawl-budget hygiene) | `site/public/robots.txt` | Low |

### 1.3 rentals.beatrox.com — the actual fire

**Architecture:** separate repo `lxrxvci/beatrox-rentals` (Vite 7 + React 19 SPA, react-router 7, Vercel serverless `api/`, Neon Postgres inventory, Stripe, Resend). Prior full audit: `reports/beatrox-rentals-audit.md` (2026-07-22).

Live-verified 2026-09-13:

1. **Infinite soft-404 space**: every URL — real or garbage — returns 200 with the identical 4,656-byte shell. `/this-page-does-not-exist-xyz` → 200. This is almost certainly the source of the GSC soft-404 and not-indexed clusters.
2. **No SSR/prerender**: all 84 sitemap URLs serve byte-identical HTML (homepage title, no H1, no crawlable links). Google must render JS to differentiate anything.
3. **Test data live**: `/product/test-item-1` is a live, sitemap-listed product.
4. **Schema points at the wrong entity URL**: rentals JSON-LD Organization/LocalBusiness `url` = `https://beatrox.com` instead of the rentals host; no telephone/geo.
5. **Sitemap has no `<lastmod>`**.
6. Go-live readiness from the July audit is **unverified**: Stripe keys, Resend key, `EXTENSION_PAYMENT_BYPASS` flag, JWT dev-secret fallback, double-booking race — must be re-checked in that repo before driving traffic.
7. **"Artfox Pro Flex Outdoor P3.91" inventory does not exist in any data source** — not in this repo, not in the rentals seed (50 products: 12 sound / 12 dj / 12 led-wall / 14 lights-lasers per the audit). Live LED copy mentions "P2.6, P3.9, P4.8" generically.

### 1.4 Nathan's rental page list — gap analysis

| Target page | Status today |
|---|---|
| LED Video Wall Rental Portland | Main site `/services/led-video-wall-rentals` (full SEO page) + rentals `/category/led-wall` (thin) |
| Sound Equipment Rental Portland | Main `/services/sound-equipment-rentals` + rentals `/category/sound` |
| DJ Equipment Rental Portland | Rentals `/category/dj` only (main-site page intentionally 301s there) |
| Lighting Rental Portland | Main `/services/lighting-services`; rentals `/category/lights-lasers` (combined w/ lasers) |
| Corporate AV Rental Portland | **Missing everywhere** (closest: `/tech/av-equipment-sourcing-rentals`) |
| Stage Rental Portland | Partial: `/services/backline-stage-rental` (backline-focused); no rentals category |
| Wireless Microphone Rental Portland | **Missing** (an item inside sound category copy only) |
| Projection/Projector Rental Portland | **Missing** (main has `/services/projection-mapping`, a production service) |
| Backline Rental Portland | Main `/services/backline-stage-rental`; no rentals category |
| Event Production Portland | Main `/services/event-production` (strong page — correctly stays on main site) |

Secondary list (LED Screen, Concert Sound, PA System, CDJ, Stage Lighting, Conference AV, Live Sound, Festival Production Oregon, LED Video Wall Oregon, Event Production Oregon) — none exist; several are close variants of primary pages and should be handled as sections/anchors or consolidated pages to avoid cannibalization.

**Cannibalization guard** (Nathan explicitly wants the sites to complement, not compete): main site keeps the premium/production-framed pages and the broad service terms it already ranks for; the rentals app owns "rental" transactional intent. Cross-link contextually; do not duplicate the same keyword target on both. Event Production stays on beatrox.com. Detailed keyword mapping is Phase 4.2 below.

### 1.5 Front + Twilio — validated, with corrections

Nathan's 12-step draft is sound. Corrections from current docs (full cited report in conversation; key sources: Front help center Twilio article updated Jul 2026, Twilio A2P 10DLC docs):

- **Number purchase path**: current console is **Phone Numbers → Manage → Buy a number** (not "Products & Services → Numbers & Senders"). 503 inventory is largely exhausted — **971 is the realistic Portland area code** (same overlay geography).
- **A2P registration happens in Trust Hub** (Messaging → Regulatory Compliance), four stages: Customer Profile → Brand → Campaign → **Number registration** (the commonly missed step — number must be added to the Messaging Service sender pool; association can take 24h).
- **Brand type**: Beatrox has an EIN → **Low-Volume Standard Brand** + **Low-Volume Mixed campaign** ($4.50 one-time + $15 vetting + $1.50/mo). Not Sole Proprietor.
- **Customer Profile must match IRS records byte-for-byte** — "Beatrox" vs "Beatrox LLC" mismatch = rejection. Confirm legal name as filed.
- **Crew texting requires documented opt-in**, same as customers: add an SMS-consent clause (unchecked checkbox/signature) to freelancer/vendor onboarding paperwork; that signed form is the opt-in proof submitted during campaign registration.
- **Keep Twilio's default Advanced Opt-Out (STOP/HELP)** on the Messaging Service — carriers test it automatically.
- **Front gotchas**: one webhook per number (use a fresh number with nothing else connected); Messaging Service must be set to **"Defer to Sender's Webhook"** or inbound won't reach Front; MMS supported (jpeg/gif/png/vCard); no group SMS (bulk send fans out to 1:1 threads); only 100 most recent messages import as history.
- **Front tier ambiguity**: help docs say Twilio channel requires Professional ($65/seat/mo annual); pricing page suggests Starter may allow a single SMS-only channel. Since Beatrox wants email + SMS unified, budget for **Professional, 3 seats ≈ $195/mo**; total stack ≈ **$205–215/mo + ~$20 one-time**.
- **Timeline**: brand approval minutes–7 days; **campaign vetting currently 10–15 days** (backlog; rejections return one issue at a time and resubmission resets the clock). Realistic end-to-end **2–3 weeks clean, 4–6 with rejection cycles**. Do not announce the number before campaign approval — unregistered traffic is hard-blocked (error 30034) and still billed.
- **Oregon HB 3865 (2025)** classifies texts as telephone solicitation — another reason to keep marketing strictly off this number; consented operational messaging is unaffected.
- **Alternative worth one conversation**: Quo (ex-OpenPhone) ≈ $45/mo all-in for 3 users vs ≈ $210/mo — but no email helpdesk. Front+Twilio is right *if* email will live in Front too. Flag the delta to Nathan; his stated architecture stands.

---

## 2. Execution plan

### Phase 1 — Legal pages (unblocks everything; ~1 day + review)

1. Publish the ToS Nathan sent as `/terms` on beatrox.com (markdown → page component; effective date Sep 12, 2026). Add canonical + metadata; add to sitemap.
2. Draft and publish **Privacy Policy** at `/privacy` — must include the 10DLC mobile-data clause ("No mobile information will be shared with third parties or affiliates for marketing or promotional purposes") and cover GA4, contact/booking forms, rentals transactions.
3. Draft **SMS Terms & Conditions** (8 required elements: program name, description, msg & data rates, frequency, support contact, **bolded HELP/STOP**, privacy link, carrier non-liability) — either a `/sms-terms` page or a dedicated section linked wherever numbers are collected.
4. Footer: add Terms / Privacy links (and SMS terms where relevant) — `site/components/Footer.tsx`.
5. Mirror the legal pages on rentals.beatrox.com (footer links + pages) — vetters open both properties.
6. Send drafts to Nathan for legal review before publish (he owns final wording).

### Phase 2 — Twilio + Front (start immediately after Phase 1 publishes; mostly waiting on carriers)

Sequence per Nathan's draft, corrected per §1.5:

1. Nathan creates Twilio account under Beatrox LLC, adds billing, upgrades from trial, grants us admin.
2. Buy 971 (or 503 if available) SMS+MMS local number. Fresh number — nothing else connected.
3. Trust Hub: Customer Profile (EIN, legal name byte-exact, 1313 SE 3rd Ave address) → Low-Volume Standard Brand → Low-Volume Mixed campaign with operational description + 2–5 sample messages in Nathan's voice (crew availability, booking confirmation, schedule change, logistics — with brand name and "Reply STOP to opt out").
4. Attach number to the auto-created Messaging Service; set **"Defer to Sender's Webhook"**; keep default STOP/HELP handling.
5. While vetting runs: create Front workspace, "Beatrox Production" shared inbox, 3 seats (Nathan, Production Coordinator, Desi), tags (REALM / WONDERLOVE / BEATROX PROJECT / RENTAL / VENDOR / CREW / AVAILABLE / UNAVAILABLE / TENTATIVE / RATE EXCEPTION / TECHNICAL ESCALATION / URGENT), assignment rules (routine→Coordinator, admin/payment→Desi, technical→Nathan, emergency→Nathan+Coordinator), and the 9 canned SMS templates Nathan listed.
6. On campaign approval: connect Twilio channel in Front (SID + Auth Token), run end-to-end tests (inbound, outbound, MMS, STOP/HELP, webhook behavior), then begin the gradual migration — new production conversations originate from the Beatrox number; freelancers keep using normal SMS.
7. AI stays conservative per Nathan's Phase 1 (classification, summaries, availability extraction, drafts; human approves sends).

**Access/info request to send Nathan** (he explicitly asked): Twilio admin access + card; EIN + IRS-exact legal name + entity type; opt-in method decision (recommend the onboarding-paperwork consent clause) + one signed sample; 2–5 sample messages; monthly volume estimate; yes/no on ever sending marketing from this number; Front workspace admin invite + billing + 3 seat emails; area-code preference; area-code/number-inventory check at purchase time.

### Phase 3 — Main-site SEO hygiene + GSC validation (~1–2 days, this repo)

1. **GSC first**: pull coverage reports (404s, soft 404s, redirect errors, duplicate/canonical, crawled/discovered-not-indexed). Cross-reference against live probe results (§1.1) — most legacy-URL errors are expected to be stale; **validate fixes in GSC** rather than changing working redirects. Flag any URL that is genuinely broken vs. the probe table.
2. Add GA4 conversion events: contact-form success, booking-form success, tel: clicks (footer/contact/home CTA), outbound clicks to rentals.beatrox.com, booking funnel steps. Mark form success + tel: as key events in GA4.
3. Sitemap: add `lastModified`, include CMS `/[slug]` pages; align homepage trailing-slash form with canonical; delete stray repo-root `sitemap-beatrox-combined.xml`.
4. robots.txt: disallow `/preview`, `/proposal`, `/api`.
5. Add `/portfolio/:path*` → `/work` redirect (decide `/about-1` based on GSC data).
6. Schema: `VideoObject` on `/videos/*` and project video embeds; `CreativeWork` on `/work/[slug]`; `WebSite` node sitewide.
7. Improve generic hero alt text (about/services/tech heroes).
8. NAP off-site: GBP + top directories — verify 1313 SE 3rd Ave everywhere (per elite-local-seo-audit offsite findings); this is the only place "8625 NE Halsey" still lives.
9. Internal linking pass: services ↔ related work ↔ rentals cross-links (contextual, one direction of authority per keyword).

### Phase 4 — rentals.beatrox.com build-out (largest effort; separate repo `~/beatrox-rentals`)

Ordered by dependency:

1. **Go-live readiness re-audit** (half day): verify July audit's business-critical items are resolved — Stripe live keys, Resend key, `EXTENSION_PAYMENT_BYPASS` removed, JWT secret, double-booking race, admin auth. Do not drive SEO traffic to a broken checkout.
2. **Kill the soft-404 space**: real 404 status for unknown routes; remove `/product/test-item-1` (and any test data) from DB + sitemap.
3. **SSR/prerender**: the SPA must serve crawler-readable HTML per route (prerender static landing/category pages at minimum; evaluate react-router 7 SSR vs. vite-prerender vs. a migration to Next.js — the audit already prescribed this as Phase D). Until this ships, landing-page copy is invisible to Google.
4. **Fix entity/schema**: rentals LocalBusiness with own `@id` (`https://rentals.beatrox.com/#localbusiness`), correct `url`, telephone, geo; fix canonicals/OG/sitemap domains; add `lastmod`.
5. **Inventory data**: add Artfox Pro Flex Outdoor P3.91 panels (and any other real owned inventory) to the Neon seed + productDetails, with real specs. Nathan explicitly wants the LED page to reference actual inventory.
6. **Landing pages** (substantive, per Nathan's required anatomy: focused H1, overview, real inventory/packages, applications, tech specs, dry-vs-operated, delivery/setup, FAQ, service area, quote CTA, internal links). Priority order:
   - P1: LED Video Wall Rental Portland (flagship — Artfox content), Sound, DJ, Lighting, Corporate AV (net-new), Stage (net-new)
   - P2: Wireless Microphone, Projection/Projector, Backline, plus Oregon-state variants and secondary terms — mapped to avoid both keyword cannibalization with beatrox.com and thin-page duplication within the rentals app.
7. **Sales-progression CTAs** reflecting Nathan's ladder (Dry Rental → +Technician → Package → Full Production → Production Management → Custom Environment → Experiential) with the upper rungs handing off to beatrox.com.
8. Reviews surface + GBP alignment per `reports/elite-local-seo-audit/gbp-blueprint.md` (one Beatrox GBP now; dedicated Beatrox Rentals profile later).
9. Separate GSC property verification + Bing submission for the subdomain.

### Phase 5 — Reporting back to Nathan

- GSC validation results (what was stale vs. fixed).
- Live URL inventory for both sites.
- 10DLC campaign approval + Front go-live confirmation.
- Rentals landing-page launch list with target keywords.

---

## 3. Dependencies, owners, timeline

| Workstream | Depends on | Effort | Wall-clock |
|---|---|---|---|
| Phase 1 legal pages | Nathan legal review of drafts | ~1 day + review | Days 1–3 |
| Phase 2 Twilio/Front | Phase 1 live URLs; Nathan's EIN/access | ~1 day setup + carrier wait | Start day 3; live ~week 3–4 |
| Phase 3 main-site SEO | GSC access | 1–2 days | Week 1 |
| Phase 4 rentals | Readiness re-audit; SSR decision | Largest — weeks | Weeks 2–6+ |

**Decision points for Nathan/Matthew:**
1. Approve drafting Privacy Policy + SMS Terms (Phase 1.2–1.3) — Nathan reviews before publish.
2. Front Professional ($65/seat, ~$210/mo total) vs. Quo (~$45/mo) — confirm Front given email+SMS unification.
3. 971 vs 503 area code (503 likely unavailable).
4. Rentals SSR approach: prerender vs. full SSR vs. Next.js migration (scoping decision in Phase 4.3).
5. Keyword map sign-off for the 10+10 rental pages (Phase 4.6) to lock the no-cannibalization boundary between the two sites.

# Beatrox Keyword Map — beatrox.com × rentals.beatrox.com

**Date:** 2026-09-13
**Prepared for:** Nathan Jenkins / Matthew (sign-off section by section)
**Inputs:** Nathan's keyword email (2026-09-09), completed site audits (2026-09-13), spot-reads of `site/content/services/*.json` (main) and `app/src/pages/CategoryPage.tsx`, `App.tsx`, `index.html` (rentals), plus 5 live SERP checks for Portland phrasing.

---

## 0. Recommended site boundary (one-paragraph summary)

**rentals.beatrox.com owns every keyword that contains "rental/rentals" or names a piece of rentable gear** (LED video wall rental, sound equipment rental, DJ equipment rental, lighting rental, corporate AV rental, stage rental, wireless microphone rental, projector rental, backline rental — all Portland/Oregon variants). These are transactional queries from people who want to see inventory, a day rate, and a checkout or quote button — exactly what the rental SPA does, and the model already works (rentals.beatrox.com is already surfacing as a top result for DJ-equipment queries in Portland). **beatrox.com owns every keyword that describes hiring a team or an outcome** (event production Portland/Oregon, festival production Oregon, lighting services, projection mapping, experiential design) — production-service intent where the buyer is purchasing design, engineering, and crew, not gear. The two properties never target the same head term: where a main-site service page currently collides with a rentals category (LED, sound, backline/stage), the main page is retitled and reframed toward the operated/production end of the sales ladder and links down to rentals for dry hire; rentals pages link up the ladder (Rental + Technician → Full Technical Production → Experiential Design) with service-language anchors to beatrox.com. Sign-off on this boundary is the precondition for everything below.

---

## 1. Keyword → URL assignment table

Every keyword from Nathan's 2026-09-09 list, assigned to exactly one canonical target.

| # | Keyword | Target URL | Site | Status | Intent type | Notes |
|---|---------|-----------|------|--------|-------------|-------|
| P1 | LED Video Wall Rental Portland | `rentals.beatrox.com/category/led-wall` | rentals | exists / expand | transactional rental | Currently titled "LED Video Wall Rentals in Portland, OR \| BEATROX LLC". Expand with Artfox Pro Flex Outdoor P3.91 inventory, specs, packages, FAQ. |
| P2 | Sound Equipment Rental Portland | `rentals.beatrox.com/category/sound` | rentals | exists / expand | transactional rental | Current title is "Sound System Rentals in Portland, OR" — good; retitle to include "Sound Equipment" (see §2.4). Add PA/speaker/concert sections. |
| P3 | DJ Equipment Rental Portland | `rentals.beatrox.com/category/dj` | rentals | exists / expand | transactional rental | Main site already 301s `/services/dj-equipment-rentals` here — the precedent for this whole map. Add FAQ + packages. |
| P4 | Lighting Rental Portland | `rentals.beatrox.com/category/lights-lasers` | rentals | exists / expand | transactional rental | Current title "Lighting & Laser Rentals in Portland, OR" already matches. Add stage-lighting section + FAQ. |
| P5 | Corporate AV Rental Portland | `rentals.beatrox.com/category/corporate-av` | rentals | **new** | transactional rental | New page spec §3.1. Cross-category bundle page. |
| P6 | Stage Rental Portland | `rentals.beatrox.com/category/staging` | rentals | **new** | transactional rental | New page spec §3.2. **Blocked on inventory question** (§5 Q1). |
| P7 | Wireless Microphone Rental Portland | `rentals.beatrox.com/category/microphones` | rentals | **new** | transactional rental | New page spec §3.3. Draws on existing sound inventory (wireless mics already listed in sound category copy). |
| P8 | Projection / Projector Rental Portland | `rentals.beatrox.com/category/projection` | rentals | **new** | transactional rental | New page spec §3.4. **Blocked on inventory question** (§5 Q1). |
| P9 | Backline Rental Portland | `rentals.beatrox.com/category/backline` | rentals | **new** | transactional rental | New page spec §3.5. **Blocked on inventory question** (§5 Q1). |
| P10 | Event Production Portland | `beatrox.com/services/event-production` | main | exists / expand | production service | Already titled "Event Production Company Portland, OR". Add Oregon-state section + festival link (see S9/S10). |
| S1 | LED Screen Rental Portland | `rentals.beatrox.com/category/led-wall` (`#led-screen` section) | rentals | exists / expand | transactional rental | Synonym cluster — consolidate on one page (§2.5a). |
| S2 | Concert Sound Rental Portland | `rentals.beatrox.com/category/sound` (`#concert-sound` section) | rentals | exists / expand | transactional rental | Line-array/festival-grade section of sound page (§2.5b). |
| S3 | PA System Rental Portland | `rentals.beatrox.com/category/sound` (`#pa-systems` section) | rentals | exists / expand | transactional rental | Small-event/corporate PA section of sound page (§2.5b). |
| S4 | CDJ Rental Portland | `rentals.beatrox.com/category/dj` + `/product/*` model pages | rentals | exists | transactional rental | Category owns head term; product pages own model terms ("CDJ-3000 rental Portland") (§2.5c). |
| S5 | Stage Lighting Rental Portland | `rentals.beatrox.com/category/lights-lasers` (`#stage-lighting` section) | rentals | exists / expand | transactional rental | Section + FAQ on existing category. |
| S6 | Conference AV Portland | `rentals.beatrox.com/category/corporate-av` (`#conference-av` section) | rentals | **new** | transactional rental | Same buyer, same kit as P5 — consolidate (§2.5d). |
| S7 | Live Sound Portland | `rentals.beatrox.com/category/sound` (`#live-sound` section) | rentals | exists / expand | mixed | Section framed around "rental + engineer," with ladder link to main's sound page (§2.5b). |
| S8 | Festival Production Oregon | `beatrox.com/services/festival-production` | main | **new (optional)** | production service | Distinct intent/geo from P10; recommend a dedicated page if content can be substantive (§2.6c). |
| S9 | LED Video Wall Rental Oregon | `rentals.beatrox.com/category/led-wall` (statewide section) | rentals | exists / expand | transactional rental | No separate Oregon page — would be ~90% duplicate (§2.6a). |
| S10 | Event Production Oregon | `beatrox.com/services/event-production` (statewide section) | main | exists / expand | production service | Same ruling — statewide section on the Portland page (§2.6b). |

**Additions not on Nathan's list** (rationale in §4): "speaker rental Portland," "AV rental Portland," "video wall rental Portland," "projector and screen rental Portland," "line array rental Portland."

---

## 2. Cannibalization rulings

### 2.1 LED Video Wall Rental Portland — rentals owns it

**Ruling:** `rentals.beatrox.com/category/led-wall` is the sole canonical target for the rental head term. Main-site `/services/led-video-wall-rentals` is **retitled and reframed, not redirected.**

**Why rentals owns the term:** the query is transactional — the searcher wants panels, a price, and availability. The rentals page can show real inventory (Artfox Pro Flex Outdoor P3.91), day rates, and checkout; the main page cannot. With prerendering now live, the rentals page is fully crawlable, and the DJ precedent shows Google will rank the subdomain for exactly this query class.

**Why reframe instead of redirect for the main page:** the main page carries real content equity — its trust block cites Adidas × Parley Run for the Oceans, Amazon Music Live at Outside Lands/Stagecoach, fine-pitch-to-festival-scale capability, and on-site LED technicians. That is *production* proof, and it supports the upper rungs of the sales ladder (Full Technical Production, Custom Stage/Environment, Experiential Design). A 301 would hand that equity to a category page whose content is a product grid — a topical mismatch that wastes it. **However:** if after ~8 weeks post-reframe both pages still flip-flop for the rental query, escalate to a 301 from `/services/led-video-wall-rentals` → the rentals category, and migrate the portfolio proof into `/services/event-production` and `/case-studies/*` first. Redirect is the fallback, not the first move.

**On-page changes for the main page (the "loser"):**
- SEO title: "LED Video Wall Rentals Portland, OR" → **"LED Video Wall Design & Production — Portland, OR | BEATROX"**
- H1: "LED Video Wall Rentals" → **"LED Video Wall Systems, Designed & Operated"**
- Intro rewrite: lead with design, integration, media servers, content, and crewed operation; mention rentals once, in a link-out.
- Add a prominent module above the fold: *"Just need panels? Rent LED video wall inventory direct →"* linking to `rentals.beatrox.com/category/led-wall` with anchor **"LED video wall rentals in Portland"** (exact-match, one instance — this deliberately transfers rental relevance to the subdomain).
- Keep the slug (`/services/led-video-wall-rentals`) for now; slugs matter far less than title/H1/body. Self-canonical. Do **not** canonical to the rentals page (cross-property canonicals between different intents are unreliable).

### 2.2 Sound Equipment Rental Portland — rentals owns it

**Ruling:** `rentals.beatrox.com/category/sound` owns the head term. Main `/services/sound-equipment-rentals` is reframed toward engineer-led production.

**Why:** same transactional logic as LED. The main page's actual content is already engineer-led — capabilities are "Line Array PA Systems… Front of House Audio Engineering (A1), Monitor Engineering (A2)," and the trust block leads with touring-grade brands, certified A1/A2 engineers, and RF coordination. That page is really a *live sound production* page wearing a rental title.

**On-page changes for main:**
- SEO title: "Sound Equipment Rentals Portland, OR" → **"Live Sound Production & Audio Engineering — Portland, OR | BEATROX"**
- H1: "Sound Equipment Rentals" → **"Live Sound, Engineered"** (or similar production framing)
- Keep the A1/A2/RF-coordination content — it is exactly what differentiates this page from a rental grid.
- One exact-match link out: *"Browse rentable PA systems, consoles, and wireless mics →"* anchor **"sound equipment rentals in Portland"** to the rentals category.
- Optional later cleanup: 301 the slug to `/services/live-sound-production` once the reframe is stable. Not required on day one.

**On-page changes for rentals:** retitle the category from "Sound System Rentals in Portland, OR" to **"Sound Equipment Rentals Portland, OR — PA Systems, Speakers & Consoles | BEATROX LLC"** (captures P2 head term plus the "speaker rental" variant; see §4).

### 2.3 Lighting — minimal collision, small fixes only

**Ruling:** `rentals.beatrox.com/category/lights-lasers` owns "Lighting Rental Portland" and "Stage Lighting Rental Portland." Main `/services/lighting-services` keeps service/design intent — it is already titled "Event Lighting Services Portland, OR" and never uses "rental" in its title, so the boundary here is nearly clean already.

**On-page changes:** (a) rentals category adds a `#stage-lighting` section (movers, wash packages, console + LD options) and a matching FAQ entry; (b) main page adds one link-down module ("Need fixtures only? Browse lighting rentals →"); (c) rentals page must avoid drifting into "lighting design services" language — its operated option is "Rental + Technician," and anything beyond that links up to the main page with a service anchor.

### 2.4 Backline & Stage — rentals owns (pending inventory), main reframes

**Ruling:** new `rentals.beatrox.com/category/backline` and `/category/staging` own "Backline Rental Portland" and "Stage Rental Portland" **if Nathan confirms dry-hire inventory** (§5 Q1). Main `/services/backline-stage-rental` (currently titled "Backline & Stage Rental Portland, OR") is reframed to touring/festival production: its content is already crew-led (Joey Paulekas / Odesza touring pedigree, "Backline Technician Support," "Touring Stage Packages").

**On-page changes for main:** title → **"Backline & Staging Production for Tours and Festivals | BEATROX"**; H1 → "Backline & Stage Production"; one exact-match link out to each new rentals category once live. If inventory is *not* confirmed, hold the new rentals categories and leave the main page as-is until §5 Q1 is answered — do not publish thin rental pages for gear we can't dry-hire.

### 2.5 Near-duplicate secondary clusters — consolidate, with anchors

**General principle:** separate pages for synonyms of the same inventory produce thin, 80–90% duplicate pages that split link equity and risk doorway-page signals. One substantive page per *inventory cluster*, with named section anchors and FAQ entries capturing the variant phrasings.

- **(a) LED Screen vs LED Video Wall** → one page (`/category/led-wall`). "LED screen rental" is the lay phrasing of the same product; SERPs treat them interchangeably. Capture via an H2 ("LED screen rentals — panels, processors & packages"), the meta description, and an FAQ ("Is an LED screen the same as an LED video wall?"). No second page.
- **(b) PA System vs Sound Equipment vs Concert Sound vs Live Sound** → one page (`/category/sound`) with three anchored sections: `#pa-systems` (small/corporate/wedding PAs — the "PA system rental" searcher), `#concert-sound` (line arrays, subs, festival-grade — the "concert sound rental" searcher), `#live-sound` (rental + engineer framing, links up to main's reframed live-sound page). Rationale: identical inventory and buyer journey; four pages would be four thin pages. Informational variants ("what size PA do I need for 200 people") belong in `/guides/*`, which link back to the category.
- **(c) CDJ vs DJ Equipment** → category owns "DJ equipment rental"; **product pages own model-level terms** ("CDJ-3000 rental Portland," "DJM-A9 rental"). A standalone "CDJ rental Portland" page would duplicate the category; instead give the category a `#cdj` section and ensure each CDJ product page has model + "rental Portland" in its title/H1. This is the one cluster where multiple indexable pages are correct — product pages are genuinely distinct content (specs, pricing, availability per unit).
- **(d) Conference AV vs Corporate AV** → one new page (`/category/corporate-av`) with a `#conference-av` use-case section. Same buyer (meeting/event planner), same kit (projectors, wireless mics, compact PA, small LED). Conference AV gets an H2, FAQ, and meta mention, not its own page.

### 2.6 Oregon-state variants — sections, not pages (with one exception)

- **(a) LED Video Wall Rental Oregon** → statewide "Serving all of Oregon" section on `/category/led-wall` (delivery zones: Portland metro, Salem, Eugene, Bend; delivery-fee note). A separate `/oregon` page would be ~90% duplicate of the Portland page — rental inventory doesn't change by geography. Same ruling applies to all rentals categories.
- **(b) Event Production Oregon** → statewide section on `/services/event-production` (the page already says "nationwide" — sharpen it with Oregon-specific venue/city references). No separate page.
- **(c) Festival Production Oregon** → **exception: recommend a new dedicated page** `/services/festival-production`. The intent is distinct (multi-day site builds, staging/rigging, power, permitting, artist advancing — not ballroom AV), the geography modifier is the head term rather than a variant, and Beatrox's portfolio and crew bios support substantive, non-duplicate content. If the page can't reach ~800+ substantive words with real festival proof, fold it into `/services/event-production` as a section instead — do not publish it thin.

### 2.7 Watch-item: `/tech/av-equipment-sourcing-rentals` (main)

This existing main-site page partially overlaps the new rentals "Corporate AV Rental" page. Ruling: keep it on main but reframe its target toward *sourcing/procurement for productions and installations* (B2B, project-based), strip any "AV rental Portland" phrasing from its title/H1, and have it link to the rentals corporate-AV page for self-service event rentals. No redirect needed — the intents (procurement consulting vs. rent-a-projector) are genuinely different.

---

## 3. New-page specs (rentals-side gaps)

All five follow the standard anatomy: focused H1 → service overview → actual inventory/packages → applications → tech specs → dry rental vs operated options → delivery/setup → FAQ → service area → quote/availability CTA → internal links. All need inventory-category support in `App.tsx`/`CategoryPage.tsx` (a new `categoryInfo` entry plus inventory items tagged to the category), plus inclusion in the prerender route list and sitemap.

### 3.1 Corporate AV Rental Portland

- **Slug:** `rentals.beatrox.com/category/corporate-av`
- **H1:** Corporate AV Rentals in Portland, OR
- **Title tag:** Corporate AV Rental Portland, OR — Conference & Event AV | BEATROX LLC (78 chars — trim to "Corporate AV Rental Portland, OR | BEATROX LLC" if enforcing 60)
- **Meta description (~155):** "Corporate AV rentals in Portland, OR: projectors, wireless mics, PA systems & LED walls for conferences, keynotes & galas. Delivery & setup available." (150)
- **Section outline:**
  1. Overview — AV rental for meetings, conferences, galas, trade shows; one quote for the whole kit
  2. Packages — Meeting Room Kit (projector + screen + 2 wireless mics + compact PA), Conference Kit (adds LED wall / dual projection + 8 mics + console), Gala/Keynote Kit (adds stage lighting + staging)
  3. Inventory — cross-category grid pulling from sound (mics, small PA), projection (§3.4), LED wall, lights
  4. Applications — conferences (`#conference-av`, targets S6), corporate keynotes, nonprofit galas, trade-show booths, hybrid/streamed meetings
  5. Tech specs — projector lumens by room size, mic channel counts, LED pitch cheat-sheet
  6. Dry rental vs operated — self-serve checkout vs "AV technician on site" add-on (Rental + Technician rung)
  7. Delivery & setup — hotel/venue delivery windows, Oregon Convention Center / Pearl District hotel familiarity
  8. FAQ — include "Do you deliver and set up?", "What AV do I need for a 200-person conference?", "Conference AV vs venue in-house AV?"
  9. Service area — Portland metro + statewide delivery
  10. CTA — "Check availability / Get a quote" + ladder link: "Need full event production? → beatrox.com/services/event-production"
- **Draws from:** existing sound, led-wall, lights-lasers inventory + new projection category (§3.4). This is a bundle/landing page over real inventory, so it is honest even before projection is stocked — but projectors are the #1 corporate-AV ask, so launch timing should follow §5 Q1.
- **Internal links in:** rentals homepage (category nav + homepage package card), `/category/sound` ("building a conference rig?"), relevant `/product/*` pages (mics, small PA), `/guides/*` AV-planning guide.
- **Internal links out:** `/category/sound`, `/category/led-wall`, `/category/projection`, `beatrox.com/services/event-production` (ladder), `/guides/*`.

### 3.2 Stage Rental Portland

- **Slug:** `rentals.beatrox.com/category/staging`
- **H1:** Stage & Riser Rentals in Portland, OR
- **Title tag:** Stage Rental Portland, OR — Stages, Risers & Platforms | BEATROX LLC
- **Meta description (~155):** "Stage rental in Portland, OR: modular stage decks, drum risers, and platform packages with delivery, installation, and crew options. Get a quote today." (151)
- **Section outline:**
  1. Overview — modular staging for concerts, corporate, festivals, ceremonies
  2. Inventory/packages — stage decks by size/height, drum risers, ADA ramps, skirting, stairs; small/medium/large stage packages with dimensions
  3. Applications — bands & concerts, keynote stages, fashion/runway, graduations, outdoor festivals
  4. Tech specs — deck dimensions, weight ratings, height options, guardrails, load-in requirements
  5. Dry vs operated — staging is heavy/liability-sensitive: default to delivery + install; dry hire only for qualified production companies (state this honestly)
  6. Delivery/setup — install crew, leveling on uneven ground, permits note for outdoor public spaces
  7. FAQ — "How much does it cost to rent a stage in Portland?", "What size stage for a 5-piece band?", "Do you handle outdoor stages?"
  8. Service area + CTA — quote-first (staging is rarely add-to-cart)
  9. Ladder link — "Full stage design & custom builds → beatrox.com/services/stage-design" and `/tech/staging-rigging`
- **Draws from:** main site `/tech/staging-rigging` capability content for specs language; actual deck/riser inventory **must be confirmed (§5 Q1)**. If Beatrox subrents staging, say "sourced and installed by our crew" rather than listing phantom SKUs.
- **Internal links in:** homepage, `/category/backline` (§3.5), `/category/sound` (concert section), `/category/corporate-av` (gala kit).
- **Internal links out:** `/category/backline`, `/category/lights-lasers` (stage lighting), `beatrox.com/tech/staging-rigging` (ladder), `beatrox.com/services/stage-design` (ladder).

### 3.3 Wireless Microphone Rental Portland

- **Slug:** `rentals.beatrox.com/category/microphones`
- **H1:** Wireless Microphone Rentals in Portland, OR
- **Title tag:** Wireless Microphone Rental Portland, OR | BEATROX LLC
- **Meta description (~155):** "Rent wireless microphones in Portland, OR: handheld, lavalier, and headset systems with fresh batteries, tested frequencies, and same-day pickup options." (153)
- **Section outline:**
  1. Overview — wireless mic rental for events, weddings, conferences, performances
  2. Inventory/packages — handheld, lavalier, headset systems; single-mic rental; 4/8-channel racks with antennas (RF-coordinated packages)
  3. Applications — weddings & officiants, corporate presenters, panels, live performance, houses of worship
  4. Tech specs — frequency bands, channel counts, range, battery life, receiver outputs; compatibility notes
  5. Dry vs operated — dry hire common here (emphasize pickup); operated option = A2/RF tech for multi-channel shows (links to main's reframed live-sound page)
  6. Delivery/pickup/setup — pickup in Portland, delivery add-on, frequency coordination note
  7. FAQ — "How many wireless mics can run at once?", "Handheld vs lavalier for a wedding?", "Do you rent microphone packages with a PA?" (cross-link `#pa-systems`)
  8. Service area + CTA
- **Draws from:** existing sound-category inventory — the sound category copy already lists "wireless microphones" among its rentals, so SKUs likely exist; they need to be tagged into the new category and given mic-specific product pages.
- **Internal links in:** `/category/sound` (hero-adjacent module + `#pa-systems` section), `/category/corporate-av` (conference kit), mic `/product/*` pages, `/guides/*` ("how many mics do I need").
- **Internal links out:** `/category/sound`, `/category/corporate-av`, `beatrox.com/services/sound-equipment-rentals` (post-reframe live-sound page — ladder for multi-channel operated shows), `/guides/*`.

### 3.4 Projection / Projector Rental Portland

- **Slug:** `rentals.beatrox.com/category/projection`
- **H1:** Projector & Screen Rentals in Portland, OR
- **Title tag:** Projector Rental Portland, OR — Projectors & Screens | BEATROX LLC
- **Meta description (~155):** "Projector and screen rentals in Portland, OR: bright laser projectors, fast-fold screens, and full packages for conferences, movie nights, and events." (150)
- **Section outline:**
  1. Overview — projector rental for meetings, screenings, outdoor movies, galas
  2. Inventory/packages — by lumen class (3K room / 6–10K ballroom / 20K large-venue), fast-fold screens (front/rear), projector + screen + PA bundles
  3. Applications — corporate presentations (`#conference-av` cross-link), outdoor movie nights, weddings (slideshows), gallery/art projection
  4. Tech specs — lumens vs ambient light guide, throw distance, resolution/inputs (HDMI/SDI), screen sizes
  5. Dry vs operated — dry hire for simple setups; operated + mapping for anything large-format → ladder to `beatrox.com/services/projection-mapping` for complex/mapped work
  6. Delivery/setup — screen assembly, focus/keystone, cabling
  7. FAQ — "What brightness projector do I need?", "Projector vs LED wall?" (cross-link `/category/led-wall`), "Do you rent screens too?"
  8. Service area + CTA
- **Draws from:** new projector/screen inventory — **must be confirmed (§5 Q1)**. Important boundary: this page is *dry-hire projectors + screens*; `beatrox.com/services/projection-mapping` stays a design/production service and is never retitled toward "projector rental."
- **Internal links in:** homepage, `/category/corporate-av` (meeting kit), `/category/led-wall` (FAQ cross-link), `/guides/*`.
- **Internal links out:** `/category/corporate-av`, `/category/sound` (movie-night bundles), `beatrox.com/services/projection-mapping` (ladder), `/category/led-wall`.

### 3.5 Backline Rental Portland

- **Slug:** `rentals.beatrox.com/category/backline`
- **H1:** Backline Rentals in Portland, OR
- **Title tag:** Backline Rental Portland, OR — Drums, Amps & Keyboards | BEATROX LLC
- **Meta description (~155):** "Backline rental in Portland, OR: drum kits, guitar and bass amps, and keyboards for touring acts, festivals, and one-off shows. Tech support available." (151)
- **Section outline:**
  1. Overview — backline for touring artists, festivals, venue shows, studio sessions
  2. Inventory/packages — drum kits (shell packs + hardware), guitar/bass amp rigs, keyboards/synths, full backline packages by genre/rider
  3. Applications — touring riders, festival changeovers, one-off gigs, rehearsal
  4. Tech specs — per-item spec sheets (models, wattage, sizes), rider-friendly one-sheet PDF
  5. Dry vs operated — dry hire for tours with their own crew; Backline Technician add-on (Rental + Technician) → ladder to main's reframed backline production page
  6. Delivery/setup — venue delivery, festival changeover support, advance-the-show contact
  7. FAQ — "Can you match a rider?", "Do you deliver to venues?", "Backline for fly-dates?"
  8. Service area + CTA — quote-first; riders don't fit add-to-cart
- **Draws from:** main `/services/backline-stage-rental` capability language (drum kits, amps, keys, monitors/IEMs) for structure; actual inventory list **must be confirmed (§5 Q1)**.
- **Internal links in:** homepage, `/category/staging` (§3.2), `/category/sound` (`#concert-sound`), `/category/dj` (shared live-event audience).
- **Internal links out:** `/category/staging`, `/category/sound`, `beatrox.com/services/backline-stage-rental` (post-reframe — ladder), `beatrox.com/services/tour-management` (ladder).

---

## 4. Cross-linking rules between the two properties

1. **One exact-match hand-off link per page pair.** Where a main page cedes a rental keyword, it links to the owning rentals page exactly once, with the rental keyword as anchor ("LED video wall rentals in Portland," "sound equipment rentals in Portland"). This is deliberate relevance transfer, not spam — one instance, in a visible module, never in the footer.
2. **Rentals pages link up the ladder with service-language anchors only** — "event production company in Portland," "full technical production," "custom stage design," "experiential design & brand activations" → to `/services/event-production`, `/tech/staging-rigging`, `/services/experiential-events` etc. Rentals pages never link to main with rental-keyword anchors (that would re-create the competition we're removing).
3. **Ladder placement on rentals pages:** the "dry rental vs operated" section carries the Rental + Technician option in-house; everything from Equipment Package upward carries a "Need a crew to run it?" link to the matching main service page. FAQ gets one ladder link max.
4. **Homepages cross-link once, brand anchors:** beatrox.com footer/nav → "Self-service equipment rentals — rentals.beatrox.com"; rentals.beatrox.com footer → "Full-service event production — beatrox.com."
5. **Product pages (`/product/*`)** link to their parent category (exact-match OK — internal to rentals) and to one relevant guide; they link to main only via the shared footer, not in body copy.
6. **Guides (`/guides/*`)** link to the relevant category with exact-match anchors (internal, fine) and to main for production topics ("when to hire a production company" → `/services/event-production`).
7. **No cross-property canonicals.** Every page on both sites is self-canonical. The only sanctioned cross-property redirect is the existing DJ 301 pattern (main service page → rentals category), reserved for pages where main has zero unique production content worth keeping (the escalation path in §2.1).
8. **JSON-LD separation:** rentals pages carry `Product`/`RentalService`-flavored structured data with Square-consistent pricing; main pages carry `Service`/`ProfessionalService`. Neither site marks up the other's offerings.

---

## 5. Missed keyword variants (additions to Nathan's list)

SERP checks today (5 searches) confirm how Portland competitors phrase rental queries — [Oregon Audio Rentals](https://oregonaudiorentals.com/) leads with "speaker rental," [Pro Sound & Lighting](https://prosoundonline.com/) with "sound & lighting rentals," [Meeting Tomorrow](https://meetingtomorrow.com/portland/audio-visual-rentals/) and [Seamless Events](https://www.seamlessevents.com/audio-visual-equipment-rental-conference-av-services-portland-oregon/) with "AV rental," and [nwvideowall.com](https://www.nwvideowall.com/portland) / [pixthis.com](https://pixthis.com/latest-news/led-wall-and-projector-solutions/) with "video wall" (no "LED"). Also notable: **rentals.beatrox.com already appeared as a top organic result for the DJ-equipment query** — direct evidence the transactional-on-subdomain strategy is working.

Recommended additions:

| Keyword | Assigned to | Rationale |
|---------|-------------|-----------|
| speaker rental Portland | `/category/sound` (title + H2 + FAQ) | The most common lay phrasing for P2; competitors rank with it. Covered by the retitle in §2.2. |
| AV rental Portland / audio visual rental Portland | `/category/corporate-av` (title + overview) | The actual head term of the corporate cluster — bigger than "corporate AV rental." Title leads with "Corporate AV Rental" to capture both. |
| video wall rental Portland (no "LED") | `/category/led-wall` (meta + H2) | Competitors rank on the shorter phrase; zero-cost to include. |
| projector and screen rental Portland | `/category/projection` (H1 includes both) | Searchers pair them; the H1 "Projector & Screen Rentals" covers it. |
| line array rental Portland | `/category/sound` (`#concert-sound`) + product pages | High-intent pro query; product pages (QSC KLA12, RCF HDL20a — already in inventory) catch model terms. |
| sound system rental Portland | `/category/sound` | Already the current category title — keep the phrase in the meta description after the retitle. |
| party equipment rental Portland | **Do not target** (note only) | SERPs are dominated by wedding/party rental houses ([WCEP](https://wcep.com/event-rentals/crowd-control/stanchions/), PartyWorks) — wrong audience, wrong price point. A `/guides/*` article could capture it informationally later, but it should not get a page. |

---

## 6. Open questions for Nathan

1. **Dry-hire inventory (blocks P6, P8, P9 and parts of P5/P7):** Does Beatrox actually stock projectors/screens, backline (drums/amps/keys), staging decks/risers, and standalone wireless mic systems for dry hire — or are those operated-only or subrented today? If operated-only, the corresponding new pages should launch as quote-first "Rental + Technician" pages (no add-to-cart), or be deferred.
2. **Artfox Pro Flex Outdoor P3.91:** panel count, panel specs, processor/ground-support pairing, and day/week pricing — needed to build out `/category/led-wall` inventory, packages, and the pricing FAQ.
3. **Sign-off on main-site retitles:** OK to change SEO titles/H1s on `/services/led-video-wall-rentals` and `/services/sound-equipment-rentals` (§2.1, §2.2)? These are the two highest-stakes on-page changes in this map.
4. **Pricing display policy:** Should new category pages show day rates publicly (like current products), or quote-only? Consistency matters for both UX and structured data.
5. **Delivery radius & fees:** What are the real delivery zones/fees for Portland metro vs Salem/Eugene/Bend? Needed to write honest "Serving Oregon" sections (S9, S10) and delivery FAQs.
6. **Subrental honesty:** For categories where stock is thin, is "sourced via partner inventory, managed by Beatrox" an acceptable on-page framing, or should we hold the page?
7. **Festival Production Oregon page:** Is there enough festival-specific portfolio/crew proof (photos, case studies, named events) to support a dedicated `/services/festival-production` page (§2.6c), or should it stay a section of `/services/event-production` for now?

---

## Sign-off checklist

- [ ] §0 Site boundary (rentals = rental/gear terms; main = production/service terms)
- [ ] §1 Assignment table (one canonical URL per keyword)
- [ ] §2.1 LED ruling (reframe now, 301 fallback after 8 weeks)
- [ ] §2.2 Sound ruling (reframe main to live-sound production; retitle rentals category)
- [ ] §2.3–2.4 Lighting / Backline & Stage rulings
- [ ] §2.5 Consolidation clusters (anchors, not pages — except CDJ product pages)
- [ ] §2.6 Oregon variants (sections; Festival Production page exception)
- [ ] §3 New-page specs ×5 (each blocked/unblocked per §6 Q1)
- [ ] §4 Cross-linking rules
- [ ] §5 Added variants (incl. decision not to target "party equipment rental")
- [ ] §6 Open questions answered

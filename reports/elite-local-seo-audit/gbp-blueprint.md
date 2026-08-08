# GBP Blueprint v2: Beatrox

**Generated 2026-08-08 under explicit user override of the Elite gate (site composite 44/100; gate bypass requested directly). Supersedes the 2026-08-07 v1 blueprint.**
**Parity source: each field lists the website page or file it matches. All generated text passed content_lint.py (no banned dashes) and the character limits in gbp-field-spec.md.**
**Client intake confirmed 2026-08-08: founded 2011; exterior Beatrox signage exists at 1313 SE 3rd Ave. Rentals launches ON the main Beatrox profile now (rental services and the `Audiovisual equipment rental service` category included) and migrates to a dedicated `Beatrox Rentals` profile once rentals signage, a separate phone line, and verification assets exist (Appendix B).**

## v1 to v2 change log (July 2026 protocol corrections)

1. Q&A seeding REMOVED. Google killed the Q&A API (Nov 3, 2025) and removed the public Q&A section from Maps (Dec 3, 2025). Replacement: Ask Maps answers from profile fields + website + reviews. The v1 Q&A seeds migrate to website FAQ content (Section 11).
2. FAQ rich results fully deprecated May 7, 2026. FAQPage schema stays as machine-readable grounding; never sold as a SERP feature (OP-39).
3. Categories re-confirmed against three live 2026 taxonomy scrapes (Dalton Luka May 2026, Local Dominator Feb 2026, VOXA). `Audio visual consultant` downgraded to verify-in-picker; `Marketing agency` added.
4. Address model resolved: SHOW the address (hybrid). Signage confirmed; address-shown is a new top-10 pack factor (Whitespark 2026).
5. Diversity Update landing-page logic added (Sterling Sky Aug 2026; SEL case study Mar 2026).
6. Two-phase profile roadmap added: `Beatrox` now, `Beatrox Rentals` at month 3 to 6 (Appendix B), per client confirmation that all independence conditions are achievable.
7. Review ops updated: recency is the #11 pack factor (was #93); no keyword coaching (Sterling Sky controlled test); 2026 enforcement climate noted.

---

## 1. Business Name

`Beatrox`

Compliance: no keywords, taglines, locations, or service terms. Do NOT use "BEATROX" (all-caps prohibited unless a true acronym) and do NOT append "LLC" (legal suffix requires consistent real-world proof). Parity: LocalBusiness schema `name` is "Beatrox" (site/lib/schema.ts:110); footer copyright reads "Beatrox LLC".

## 2. Categories

- **Primary:** `Event management company` (no "Event production company" category exists in the taxonomy; this is the closest specific match and reads B2B, unlike `Event planner`, which pulls consumer/wedding intent).
- **Secondary (BrightLocal optimum is 4 additional):**
  1. `Marketing agency` (the experiential marketing agency positioning; /services index H2 and intro copy)
  2. `Event technology service` (LED walls, projection mapping, media servers; /services/led-video-wall-rentals, /tech pages)
  3. `Audiovisual equipment rental service` (rentals arm; /services/sound-equipment-rentals, /services/dj-equipment-rentals, /services/backline-stage-rental). REMOVE from this profile the day the `Beatrox Rentals` profile launches (Appendix B).
  4. `Video production service` (/services/audio-production, 3D animation, AV content design)
- Verify-in-picker candidate: `Audio visual consultant` (unconfirmed in 2026 taxonomy scrapes; add only if present and evidenced by /tech/consultation pages).
- Do NOT add: `Stage lighting equipment supplier` (supplier implies sales; use only if gear sales are real), `Party equipment rental service` (consumer intent; belongs on the rentals profile instead).

Parity: every category has live website pages. Before locking, extract the top-3 Portland pack competitors' category stacks via Maps page-source or GMBspy (finding P7-01). Change one category at a time; expect 2 to 4 weeks of fluctuation; primary changes can trigger re-verification.

## 3. Business Description (<=750 chars, first 250 engineered)

```
Beatrox is an experiential marketing agency and full-service event production company based in Portland, Oregon, producing brand activations, festivals, corporate events, and permanent installations across the United States and worldwide.

Our in-house team designs, builds, and runs every technical layer: LED video walls, drone light shows, laser shows, projection mapping, custom fabrication, lighting design, and concert-grade audio.

Agencies, brands, and venues get one accountable partner from first sketch to final strike. Founded in 2011, our crew brings over 20 years of touring and broadcast experience, from Super Bowl activations to immersive environments for global brands. Rentals serve the Portland metro and Pacific Northwest.
```

Chars: see lint report (validated <=750) | Parity: homepage positioning + /services intro ("full-service event production company and experiential marketing agency", services/page.tsx) + about.json founding story | Policy: no URLs, no promos, no phone, no ALL-CAPS prose words, no em dashes.
Founding year CONFIRMED 2011 (client, 2026-08-08). GBP may offer an AI-drafted description in the edit flow; decline it and paste this text.

## 4. Services (mirror website service pages exactly)

**How the editor works:** GBP shows your categories as sections in the services editor. Per Google: "If your business has multiple categories, group services together into sections under the appropriate category." In the most common dashboard variant you must pick one of your categories first, then add the custom service under it. The Section column below is the exact mapping. Also expect Google to auto-populate suggested services scraped from the website; prune anything irrelevant at setup and re-check monthly.

| # | Service name (<=58) | GBP section (category) | Description (<=300) | Price | Website source |
|---|--------------------|------------------------|---------------------|-------|----------------|
| 1 | Full Service Event Production | Event management company | Concept to strike: creative direction, technical design, fabrication, crewing, and show calling for brand activations, festivals, and corporate events. One accountable team from first sketch to final strike. | (blank) | /services/event-production |
| 2 | Event Planning and Logistics | Event management company | Venue sourcing, permits, site plans, production management, and tour management. The operational backbone behind complex shows. | (blank) | /services/event-planning-logistics |
| 3 | Custom Fabrication | Event management company | CNC machining, scenic assembly, and custom builds for stages, booths, and permanent installations. Drafting, engineering certification, and permit submittal support. | (blank) | /services/custom-fabrication |
| 4 | Experiential Events and Brand Activations | Marketing agency | Immersive brand experiences: interactive installations, real-time AR/VR/XR content, and multimedia displays built to be shared. Designed and fabricated in house. | (blank) | /services/experiential-events |
| 5 | Projection Mapping | Event technology service | Building-scale projection mapping and interactive AR, from brand activations to landmark installs. Content, media servers, and alignment handled in house. | (blank) | /services/projection-mapping |
| 6 | Drone Light Shows | Event technology service | Custom drone light shows with full FAA compliance, produced with Sky Lites Drone Shows. Choreographed formations for festivals, product launches, and city celebrations. | (blank) | /services/drone-light-shows |
| 7 | Laser Light Shows | Event technology service | High-power aerial and graphic laser shows for concerts, festivals, and brand events. Variance handling, safety officer, and operation included. | (blank) | /services/laser-shows |
| 8 | Lighting Design and Services | Event technology service | Lighting design, integration, and full-service event lighting: consoles, fixtures, and programmers for tours, festivals, and corporate shows. | (blank) | /services/lighting-services |
| 9 | LED Video Wall Rentals | Audiovisual equipment rental service | Fine-pitch indoor panels to festival-scale outdoor walls, with processors, rigging, and LED technicians. Dry hire or full show support across the Portland metro and nationwide tours. | (blank) | /services/led-video-wall-rentals |
| 10 | Sound Equipment Rentals | Audiovisual equipment rental service | PA systems, line arrays, monitors, and microphones with audio engineers available. Concert-grade sound for events of any size. | (blank) | /services/sound-equipment-rentals |
| 11 | DJ Equipment Rentals | Audiovisual equipment rental service | Club-standard DJ gear: CDJs, mixers, controllers, and turntables. Delivery, setup, and tech support available across the Portland metro. | (blank) | /services/dj-equipment-rentals |
| 12 | Backline and Stage Rental | Audiovisual equipment rental service | Drum kits, amps, instruments, staging, and rigging for touring artists and festivals. Advance-friendly inventory with crew support. | (blank) | /services/backline-stage-rental |
| 13 | AV Content and Video Production | Video production service | Show content produced in house: 3D animation, motion capture, real-time renders, and video for LED walls, projection mapping, and broadcast. Post-production and playback engineering included. | (blank) | /services/audio-production + /tech 3D animation pages |

Predefined services: check every category-linked service Google offers that is genuinely delivered (feeds "Provides X" justifications). Custom services: the 13 above. Every category section carries at least one service, which is what evidences the category to Google. On Appendix B launch, move entries 9 to 12 to the rentals profile and keep this list production-only.
2026 note: Google shows AI-generated service summaries on knowledge panels, assembled from these entries plus the website; exact, consistent naming is the lever.

## 5. Products

Not applicable: Beatrox is a service business. Use Services only.

## 6. Attributes (all applicable, category-gated)

Set after category selection reveals the available set. Candidates: wheelchair accessible entrance/parking (only if true at 1313 SE 3rd Ave), accepts credit cards/NFC, LGBTQ+ friendly, identity attributes only if accurate. Caveat: the "onsite services" and "online appointments" attributes can suppress justifications in the local pack (Sterling Sky test); if justifications never appear, remove those two and re-check after 48 hours. Every attribute must be verifiable in person or on the website.

## 7. Hours and Opening Date

- Opening date: set to the 2011 date on the Beatrox LLC registration (client to supply exact month and day). Google displays "15+ years in business" in local results; if left unset, Google infers the date from third parties and is often wrong.
- Regular (client-set in GBP 2026-08-08, pending review at capture): Sunday 11:00 AM to 10:00 PM; Monday to Thursday 12:00 PM to 10:00 PM; Friday 12:00 PM to 2:00 AM; Saturday 11:00 AM to 2:00 AM. KNOWN TYPO: GBP shows Tuesday opening 12:00 AM; client confirmed 2026-08-08 it should be 12:00 PM. Fix in the GBP dashboard.
- Parity DONE: /contact copy and openingHoursSpecification (site/lib/schema.ts) both updated to this exact schedule on 2026-08-08 (overnight closes use Google's single-spec late-night pattern). rentals.beatrox.com schema mirrors it (Appendix B parity).
- Website copy fix DONE: /contact now says "PT" instead of "PST".
- Special hours: set proactively for all public holidays when Google prompts.
- More hours: "Online service hours" only if consultations genuinely happen outside office hours.
- Open-at-time-of-search is a top-5 pack factor in 2026. Never falsify hours.

## 8. Contact and Links

- Phone: `(503) 515-4715` (matches site/content/contact.json exactly; schema E.164 +15035154715 carries identical digits). If call tracking is ever added: tracking number primary, real number secondary.
- Website: `https://www.beatrox.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp-listing` (ONLY after the www.beatrox.com domain is wired, finding P1-04; never point the profile at the vercel.app host).
- Appointment link: `https://www.beatrox.com/book?utm_source=google&utm_medium=organic&utm_campaign=gbp-appt`
- GBP landing page decision (Diversity Update): homepage. The pack listing and the organic homepage reinforce the same entity for brand and Portland queries; the service queries are targeted by dedicated /services and /tech pages, deliberately different URLs from the GBP link, so no pack/organic self-collision.

## 9. Service Area and Address Display (hybrid, confirmed)

Address hidden: NO. Exterior Beatrox signage exists (client-confirmed 2026-08-08), the studio receives clients by appointment, and address-shown is a top-10 pack factor (Whitespark 2026, #7). Requirement: permanent signage must be maintained and the studio staffed during stated hours; both are verification subjects.
Service areas: keep minimal. `Portland, OR` only. The brand is global, so do not stack 20 metros; GBP service areas do not drive ranking (proximity to the address dominates), and the hyper-local rental play belongs to rentals.beatrox.com content, not this profile. Parity: matches areaServed schema (Portland, OR + United States).

## 10. Media Plan

- Logo: 720x720 PNG, Beatrox symbol mark centered (export square version of /brand/beatrox-symbol.png).
- Cover: 1024x576, a real show photo (LED wall live at an event), no text overlay, no logo-as-cover.
- Photo shot list (20+ minimum, real jobs only, no stock, no AI):
  - 3+ exterior/interior of the 1313 SE 3rd Ave studio, including the signage (doubles as verification evidence)
  - 3+ team-at-work: fabrication shop, LED wall assembly, show-calling position
  - 4+ live shows: LED walls, laser show, drone show, projection mapping
  - 3+ rental inventory: LED panels, PA stacks, DJ gear, backline
  - 3+ finished installs: booths, permanent installations
  - Source candidates already on site: /work galleries (Run for the Oceans, Aku World, Projekt X, Myshelter)
- Video: 10 to 20s live-show recap, 1080p under 75MB (existing showreel footage).
- Cadence: 2 to 4 photos per week for 2 months, then monthly minimum. Geotagging: not used (debunked; Google strips EXIF on upload).

## 11. Ask Maps Readiness (replaces Q&A seeding; feature removed Dec 2025)

Google's Q&A is gone; Gemini "Ask Maps" now answers from profile fields, reviews, posts, and WEBSITE content. The control surface is the website FAQ. The v1 Q&A seeds become on-site FAQ entries:

| Question | Where it lives |
|----------|----------------|
| What does a full-service event production company do? | /services FAQ (live) |
| What is the difference between an experiential marketing agency and an event production company? | /services FAQ (live) |
| Do you work outside Portland, Oregon? | /services FAQ (live) |
| Can I rent equipment without booking full production? | /services FAQ (live) |
| How far in advance should we start the conversation? | /services FAQ (live) |
| Do you rent LED video walls in Portland? | rentals.beatrox.com LED category page FAQ (Phase D) |
| Can you produce a drone light show at my event in Oregon? | /services/drone-light-shows FAQ (verify present) |
| Can I visit your shop to plan my event? | /contact page copy (add: visits by appointment) |

Keep FAQPage schema on those pages: the rich result is dead, but the markup is still parsed by Google, AI engines, and voice assistants (OP-39, OP-67).

## 12. Posts Calendar (4 weeks, then weekly cadence)

Posts are an engagement and justification asset, not a ranking signal (Sterling Sky). Weekly minimum for an active-profile signal. 1200x900 images, central 80% safe zone, CTA button, UTM-tagged links.

| Week | Type | Topic | Copy (<=1,500) | Image |
|------|------|-------|----------------|-------|
| 1 | Update | Profile launch | Beatrox is an experiential marketing agency and event production company in Portland, Oregon. From LED video walls and drone light shows to custom fabrication and full event production, our Central Eastside studio designs, builds, and runs every technical layer in house. Book a consultation to start your project. CTA: Book (/book, gbp-appt UTM) | Live show wide shot |
| 2 | Update | LED video wall rentals | Fine-pitch indoor panels to festival-scale outdoor walls. Beatrox rents LED video walls with processors, rigging, and technicians across the Portland metro and nationwide. CTA: Learn more (/services/led-video-wall-rentals, gbp-post UTM) | LED wall close-up |
| 3 | Update | Drone and laser shows | Custom drone light shows with full FAA compliance, plus high-power laser shows for festivals and brand events. Produced from Portland, staged anywhere. CTA: Learn more (/services/drone-light-shows, gbp-post UTM) | Drone show night shot |
| 4 | Update | Case study spotlight | From Super Bowl activations to immersive brand environments at Comic-Con, see the work our Portland team produces for global brands. CTA: Learn more (/work, gbp-post UTM) | Best portfolio frame |

## 13. Review Operations

- Trigger: project wrap, final invoice, or gear return. Ask every client, every time.
- Ask script (email or SMS): "Thank you for building with Beatrox. If the show landed the way you hoped, would you share a sentence or two about your experience on our Google profile? It helps other teams find us: [short review link]"
- Do NOT coach keywords. Sterling Sky's controlled test found keyword-rich reviews had no positive ranking effect; detailed, specific, unprompted language is what feeds AI review summaries. Never incentivize (2026 enforcement: 600% increase in review deletions, FTC fines per violation).
- Velocity target: 4 to 8 new reviews per month, steady. Recency is the #11 pack factor in 2026 (was #93); a steady trickle beats any burst. The Portland rental incumbents show low review counts, so 6 to 12 months of steady velocity is a realistic pack-leadership path for the rentals profile.
- Responses: 100% response rate, within 24 hours, 50+ words, personalized, name the service naturally. Negative: respond within 24h, no defensiveness, move to a call, state the fix.
- Platforms: Google first, then Clutch and LinkedIn (B2B agency tier), then Facebook and Yelp for citation parity. Never solicit Yelp reviews (their policy).

## 14. Verification and Suspension Avoidance (2026)

- Verify www.beatrox.com in Search Console on the managing Google account BEFORE claiming (only real instant-verification path).
- Expect video verification (2026 default; 30 to 40% first-attempt failure rate). Shot list, hybrid storefront variant: street sign + building number at 1313 SE 3rd Ave, permanent exterior signage reading Beatrox (confirmed exists), entrance, interior studio + fabrication shop, staff-only areas, equipment and inventory, unlock the door on camera. One continuous unedited take, 1 to 2 minutes, filmed in-app with location services ON, no faces.
- Edit spacing: about 1 week between high-trust edits (name, address, primary category, phone, website). Batched edits are the top practitioner-seen suspension trigger.
- Keep reinstatement evidence on file: Beatrox LLC registration, utility bill for the address, lease, signage photos.
- Avoid major profile work in April and October (algorithmic suspension sweeps; April 27, 2026 wave documented). August/September 2026 is a clean window.
- Never create a second profile for the same business, and never create a replacement profile if suspended (appeal the original).

## 15. Maintenance Cadence

Weekly: one post, 2 to 4 photos, respond to all reviews within 24 hours. Monthly: hours audit, service-list parity re-check against the website, review velocity review, special-hours check. Quarterly: category re-validation (taxonomy updates monthly), freshness updates to the linked homepage and service pages.

---

## Appendix B: `Beatrox Rentals` Profile (confirmed migration target)

**Client decision 2026-08-08: rentals starts on the main `Beatrox` profile and migrates here once the independence assets exist.** Until then, the main profile carries the four rental service entries (Section 4, rows 3 and 9 to 11) and the `Audiovisual equipment rental service` category, and rental reviews accrue to the main profile.

**Migration checklist (execute in this order, one high-trust change per week):**
1. Install `Beatrox Rentals` signage at 1313 SE 3rd Ave; register a DBA if possible; provision the separate rentals phone line and update rentals.beatrox.com NAP to it.
2. Complete the rentals site SSR remediation (Phase D) so rentals.beatrox.com stands alone with its own NAP footer, category pages, and LocalBusiness schema (@id https://rentals.beatrox.com/#localbusiness).
3. Film the rentals verification video (rentals signage, warehouse inventory, staff-only access) BEFORE creating the profile.
4. Create the `Beatrox Rentals` profile per this appendix. Never create it while the main profile is under review or inside its first 90 days.
5. The week the rentals profile goes live: remove `Audiovisual equipment rental service` from the main profile's categories.
6. The following week: remove the four rental service entries from the main profile (they live on the rentals profile from then on).
7. Update the rentals GBP website link UTM and confirm the Diversity Update split (Section B5).
Note: reviews already on the main profile stay there (Google does not transfer reviews between profiles); the rentals profile builds its own review stream from gear-return asks.

### B1. Name
`Beatrox Rentals` (sub-brand naming is explicitly allowed: Google's Nordstrom/Nordstrom Rack precedent)

### B2. Categories
- Primary: `Audiovisual equipment rental service`
- Secondary: `Party equipment rental service`, `Event technology service`
- Same-day action: remove `Audiovisual equipment rental service` from the Beatrox profile (zero-overlap rule).

### B3. Description (<=750 chars)

```
Beatrox Rentals is an audiovisual equipment rental service in Portland, Oregon, supplying LED video walls, sound systems, DJ equipment, backline, staging, lighting, and laser systems for events across the Portland metro and Pacific Northwest.

Every rental ships from our Central Eastside warehouse with delivery, setup, and experienced technicians available. From Oregon Convention Center ballrooms to festival main stages, our touring-grade inventory is the same gear our production crew runs at national events.

Dry hire or full show support, single day or multi-week runs. Book online for same-week availability.
```

### B4. Services (6, mirror rentals.beatrox.com category pages)

Same editor mechanics as the main profile: categories appear as sections; add each custom service under the section named below. DJ gear sits under Party equipment rental service deliberately: it is the consumer-intent category and needs at least one service as evidence.

| # | Service name | GBP section (category) | Description (<=300) | Website source |
|---|--------------|------------------------|---------------------|----------------|
| 1 | LED Video Wall Rentals | Audiovisual equipment rental service | Fine-pitch indoor to festival-scale outdoor LED walls with processors, rigging, and technicians. Delivery and setup across Portland and the Pacific Northwest. | rentals.beatrox.com LED category |
| 2 | Sound Equipment Rentals | Audiovisual equipment rental service | PA systems, line arrays, monitors, and microphones, concert-grade, with audio engineers available. Serving Portland events of any size. | rentals.beatrox.com sound category |
| 3 | Backline and Stage Rental | Audiovisual equipment rental service | Drum kits, amps, instruments, staging, and rigging for touring artists and festivals. Advance-friendly inventory with crew support. | rentals.beatrox.com backline category |
| 4 | DJ Equipment Rentals | Party equipment rental service | Club-standard CDJs, mixers, controllers, and turntables with delivery, setup, and tech support across the Portland metro. | rentals.beatrox.com DJ category |
| 5 | Lighting System Rentals | Event technology service | Event lighting packages: moving heads, washes, consoles, and control, with programmers available for shows across the Pacific Northwest. | rentals.beatrox.com lighting category |
| 6 | Laser System Rentals | Event technology service | High-power laser systems with variance handling and safety officer included, for concerts, festivals, and brand events in Portland and beyond. | rentals.beatrox.com laser category |

### B5. Links and Diversity Update split
- Website: `https://rentals.beatrox.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp-listing`
- Appointment: `https://rentals.beatrox.com/booking?utm_source=google&utm_medium=organic&utm_campaign=gbp-appt` (or the live booking route)
- Diversity Update: the GBP links to the rentals homepage; the page optimized organically for "led video wall rental portland" is the LED category page, a deliberately different URL, so pack and organic do not cannibalize each other.

### B6. Everything else
Hours: same Mon to Fri 9 to 6 unless the rental counter keeps different hours (confirm). Address: shown, same street address, with Beatrox Rentals signage (both brands' signage can coexist; each profile's video shows its own sign). Media: rental inventory, warehouse, loading, technician shots. Reviews: separate ask stream triggered on gear return. Posts: inventory spotlights, package deals (Offer posts with real terms), seasonal event prep.

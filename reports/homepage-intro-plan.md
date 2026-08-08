# Homepage Intro Restructure Plan (Positioning Section)

**Date:** 2026-08-08
**Status:** PLAN ONLY. Awaiting go-ahead.
**Trigger:** client feedback: the first paragraph block on the landing page "feels chunky and odd". Apply the same atomization logic used on /services and planned for /work.
**Target code:** `site/app/(site)/page.tsx:73-98` (the "One team from first sketch to final strike" positioning section; hardcoded tsx, NOT CMS-driven, so this is a one-file change with no CMS sync step).

---

## 1. Diagnosis: why it feels chunky

Current section = overline + H2 + three stacked paragraphs, all `text-base`, all `max-w-3xl`, all left-aligned, ~120 words:

1. **No visual rhythm.** Three identical paragraphs in one measure after a full-screen hero reads as a gray wall. Nothing guides the eye; every benchmark pattern (VTProDesign, Instrument, 4Wall) alternates copy with atomized units (chips, stats, cards).
2. **Paragraph 2 duplicates the next section.** The "every technical layer stays in house: LED video walls, drone light shows, laser shows..." sentence is a services list, and the ServicesTeaser panel immediately below presents exactly those capabilities visually. Reading a list right before seeing the same list as cards is the "odd" repetition.
3. **The best proof is buried and unlinked.** Paragraph 3 contains the strongest credibility claims on the entire site (projection on the Empire State Building, Adidas AR mirror at Super Bowl 2020, Netflix at Comic-Con) as the LAST paragraph, plain text, no links. Same stranded-entity problem the /work page had.
4. **Rhythm mismatch with the rest of the page.** Everything after this section is visual (AboutTeaser, ServicesTeaser, WorkTeaser panels, marquee). The one prose-heavy block sticks out as the only unbroken text.

## 2. Target structure (same logic as /work)

Keep the section position (it is the OP-23 "what, who, why trust" block) but restructure inside it:

1. **Overline + H2: unchanged** ("Based in Portland, producing worldwide" / "One team from first sketch to final strike").
2. **One compact paragraph (~55 words), merging paragraphs 1 and 2:**
   > Beatrox is an experiential design and event production company. From our Portland, Oregon studio we design, fabricate, and deploy productions for agencies, brands, and venues worldwide, with every technical layer in house: LED video walls, drone light shows, projection mapping, custom fabrication, lighting, and audio.
   
   (The service keywords stay for entity/keyword retention, but as one sentence, not a paragraph. The ServicesTeaser below then SHOWS them.)
3. **Proof strip: 3 linked field-note chips** (same idiom as the /work field notes: accent number, linked title, one line). This replaces paragraph 3 and turns the buried proof into linked, crawlable entities:
   - `01  Empire State Building` : Projection mapping on a global landmark for PROJECTING CHANGE: Racing Extinction. → /work/projecting-change-racing-extinction
   - `02  Adidas at Super Bowl 2020` : An interactive AR mirror built for one of the biggest audiences in sports. → /work/super-bowl-2020
   - `03  Netflix at Comic-Con` : Immersive exhibition environments for Disenchantment and El Camino. → /work/disenchantment
   
   Layout: 3 columns on desktop, stacked on mobile, inside the same section (not a new full-bleed band), so the block reads as intro + proof in one glance.

## 3. Constraints and parity checks

- **Entity parity:** "Empire State Building", "Adidas", "Super Bowl 2020", "Netflix", "Comic-Con", "Portland, Oregon" must all remain in the rendered HTML (they all do, in the chips/paragraph).
- **Keyword retention:** the service keywords (LED video walls, drone light shows, projection mapping, custom fabrication, lighting, audio) stay in the compact paragraph. "Experiential design and event production company" stays verbatim (H1/title alignment with the global-brand deviation).
- **Word count:** section goes from ~120 to ~100 words; homepage total stays in the 450 to 550 band (OP-23 floor is fine; re-audit measured ~476 with chrome).
- **No em dashes** (content_lint passes); chips link text is the entity name (descriptive anchors).
- **Hero overlay untouched** (IntroGate/HomeHero are separate systems).
- Mobile: chips stack single column.

## 4. Acceptance criteria

1. The positioning section contains exactly one prose paragraph of 45 to 60 words plus the 3-chip proof strip; no stacked paragraph series remains.
2. All six entities in constraint 1 present in rendered HTML; all 3 chips link to live /work pages.
3. `npx tsc --noEmit` passes; content_lint passes (only known classname false positives).
4. Screenshots desktop + mobile show the new rhythm (paragraph + 3 chips) before deploy.

## 5. Explicitly out of scope

- Hero, intro overlay, teasers, marquee, and all other homepage sections.
- homepage.json/CMS content changes (none needed; the section is hardcoded tsx).

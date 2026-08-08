# /work Page Restructure Plan (GES Pattern)

**Date:** 2026-08-08
**Status:** PLAN ONLY. No code changes yet.
**Trigger:** The /work index carries a ~230-word, 4-paragraph prose block with zero internal links; the same GES-pattern restructure done on /services is wanted here.
**Evidence:** `audit-evidence/live-2026-08-08/work.html` (563 rendered words total), `site/app/(site)/work/page.tsx:70-108` (the prose block), competitor teardown 2026-08-08 (GPJ, 4Wall, Production Club, Freeman, Instrument, VTProDesign).

---

## 1. Current state

`site/app/(site)/work/page.tsx` structure today:

1. ParallaxHero ("Our Work", tagline)
2. "Selected Work for Brands That Don't Do Small": 4 paragraphs in a 2x2 grid (~230 words) naming 15 of the 17 portfolio projects (Netflix, BuzzFeed, Adidas x3, Amazon Music, CNN, Super Bowl, DUBAI 360, Empire State Building/Vatican, Toyota x MTV, FLIR, AKU) with ZERO hyperlinks
3. BentoWorkGrid (all 17 projects, linked cards)
4. Browse by Service tag cloud
5. CTA

The prose block inverts every elite benchmark: GPJ runs ~20 words of intro, Production Club ~25, Instrument ~20, then straight into entity-rich cards. Recommended total index prose budget from the teardown: 60 to 120 words, atomized. None of the benchmarks hide SEO copy; the pattern is less copy, structured better.

## 2. Benchmark patterns adopted

- **Production Club:** the client name IS the content. Entity + project + one line, as text.
- **VTProDesign "Field Notes":** one-sentence project anecdotes carrying a client entity each (Netflix: "5,500 drones filled 950 feet of sky"). This is the direct replacement for the Beatrox paragraphs.
- **VTProDesign stats strip:** 4 to 5 atomized numbers.
- **Instrument:** closing capabilities line + CTA (~40 words).
- **Internal linking:** every benchmark links index to detail pages at card level with descriptive anchors. 2025-26 guidance: in-content descriptive links from an authority index page are the strongest internal-link pattern. Every brand mention becomes a link to its project page.
- **AKQA:** CollectionPage JSON-LD with a description on the work index (we already ship CollectionPage + BreadcrumbList after the L-05 fix; add `description`).

## 3. Target structure (top to bottom)

1. **Hero (unchanged).** ParallaxHero with the existing tagline.
2. **Compact positioning paragraph (~55 words, one paragraph, max-w-3xl):**
   > Beatrox produces work for brands that do not do small: Super Bowl activations, Comic-Con environments, festival builds, and permanent landmark installations. Every project below was designed, fabricated, and operated end to end by one accountable team from our Portland, Oregon headquarters.
3. **Field Notes strip.** 6 one-sentence project anecdotes, each carrying the client entity as crawlable text and linking to the project page (accent-indexed cards, same idiom as the services audience strip). Draft copy:
   - `Adidas, Run for the Oceans:` a LIDAR-driven interactive whale projection anchoring a global sustainability activation. → /work/run-for-the-oceans
   - `Netflix at Comic-Con:` exhibition environments for Disenchantment and El Camino, built for the convention floor. → /work/disenchantment (and /work/el-camino linked on the second title)
   - `Adidas at Super Bowl 2020:` an interactive AR mirror in front of one of the biggest audiences in sports. → /work/super-bowl-2020
   - `PROJECTING CHANGE, Racing Extinction:` endangered species projected onto the Empire State Building and the Vatican. → /work/projecting-change-racing-extinction
   - `Amazon Music, Infinite Playlist:` interactive festival experiences at Outside Lands and Stagecoach. → /work/infinite-playlist
   - `AKU World:` an immersive NFT Miami environment built around a 4D body scanner. → /work/aku-world
4. **Stats strip.** 4 atomized numbers, all verifiable: `15` years producing (founded 2011) | `17` flagship productions | `2` world landmarks projected (Empire State Building, the Vatican) | `46` services under one roof.
5. **BentoWorkGrid (unchanged).** All 17 projects already render as linked cards with client names; this covers the remaining entities (BuzzFeed, CNN, DUBAI 360, FLIR, Toyota x MTV, MyShelter, Projekt X, Create Our Future, The Great Escape, Destination) with links by design.
6. **Browse by Service (unchanged).** The tag cloud is already the benchmark filter-bar pattern.
7. **Closing line + trimmed CTA (~40 words, Instrument pattern):** keep the current "Have a project in mind?" block but shorten the body copy to one sentence with a Portland anchor.

## 4. Link map (every entity, one destination)

| Entity in copy | Link target |
|---|---|
| Adidas / Run for the Oceans | /work/run-for-the-oceans |
| Netflix / Disenchantment | /work/disenchantment |
| Netflix / El Camino | /work/el-camino |
| Super Bowl 2020 (Adidas) | /work/super-bowl-2020 |
| PROJECTING CHANGE (Empire State Building, Vatican) | /work/projecting-change-racing-extinction |
| Amazon Music / Infinite Playlist | /work/infinite-playlist |
| AKU World | /work/aku-world |
| BuzzFeed NewFronts | /work/buzzfeed (grid card) |
| CNN Road to 270 | /work/cnn-road-to-270 (grid card) |
| DUBAI 360 | /work/dubai-360-spherical-projection-theatre (grid card) |
| FLIR | /work/flir (grid card) |
| Toyota x MTV G-MAN | /work/g-man-experiential-campaign (grid card) |
| Destination (Journey's x Adidas) | /work/destination (grid card) |
| MyShelter, Projekt X, Create Our Future, The Great Escape | grid cards (not named in copy) |

## 5. SEO and schema notes

- Every client/landmark entity stays in visible, crawlable HTML (cards, field notes, stats). No accordions, no JS-hidden copy.
- Keep the keyword phrase "event production" / "experiential" in the positioning paragraph.
- Add `description` to the existing /work CollectionPage JSON-LD (AKQA pattern).
- Optional P3: ItemList JSON-LD of the 17 projects (mirrors the /services ItemList pattern).
- All new copy must pass content_lint.py (no em dashes; field-note separators are colons or middots).
- Mobile: field notes and stats collapse to single column (same RevealOnScroll + grid idioms as the services page sections).

## 6. Acceptance criteria

1. Intro prose on /work is one paragraph of 45 to 65 words; no other multi-sentence paragraph remains on the index.
2. All 15 copy-named projects link to their /work/[slug] page; `npx tsc --noEmit` passes; content_lint passes on the file.
3. Rendered /work shows: positioning paragraph, 6 field notes, 4 stats, bento grid, tag cloud, trimmed CTA (screenshot desktop + mobile).
4. /work rendered HTML contains zero em dashes and the same brand entities as today (entity parity check against work.html).
5. CollectionPage JSON-LD on /work carries a description.

## 7. Explicitly out of scope

- /work/[slug] detail pages (already sectioned: hero, stats, gallery, body; case-study depth upgrade is a separate master-plan item).
- The /case-studies cross-link band (consider after case studies get their metrics pass).
- No changes to BentoWorkGrid or ServiceTagCloud components.

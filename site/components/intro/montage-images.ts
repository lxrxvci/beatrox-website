/**
 * Beat-2 montage imagery — one striking work-page image per type card,
 * ordered to match TYPE_CARDS in IntroOverlay (client-approved mapping):
 *
 *   01 DESIGN         → create-our-future
 *   02 PRODUCTION     → projekt-x
 *   03 RENTALS        → run-for-the-oceans
 *   04 IMMERSIVE TECH → super-bowl-2020
 *
 * Streak i is beat-locked to card i (see intro-timeline.ts), so the word
 * and its category image always hit together. Mobile shows the first 3
 * (matching its 3 cards). All four are preloaded during beat 0.
 */
export const MONTAGE_IMAGES = [
  '/images/deck/create-our-future/03-image91.jpg',
  '/images/deck/projekt-x/01-image46.jpg',
  '/images/portfolio/run-for-the-oceans/KMP_2618.jpg',
  '/images/verified/work/super-bowl-2020/IMG_1686_Moment-21565bd4.jpg',
] as const

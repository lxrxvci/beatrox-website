/**
 * Beat-2 montage imagery — one striking work-page image per brand-phrase
 * card, ordered to match TYPE_CARDS in IntroOverlay (client-approved):
 *
 *   01 CREATIVITY WITHOUT LIMITS → projecting-change (St. Peter's Basilica
 *      projection-mapped over the Rome skyline — swapped from the CNN
 *      Empire State shot per client request)
 *   02 TECHNICAL EXCELLENCE      → projekt-x (X-wing precision rig)
 *   03 HUMAN CONNECTION          → destination (festival crowd at night)
 *
 * Streak i is beat-locked to card i (see intro-timeline.ts), so the phrase
 * and its image always hit together. All three are preloaded during beat 0.
 */
export const MONTAGE_IMAGES = [
  '/images/deck/projecting-change-racing-extinction/08-image270.jpg',
  '/images/deck/projekt-x/02-image49.jpg',
  '/images/deck/destination/10-image109.jpg',
] as const

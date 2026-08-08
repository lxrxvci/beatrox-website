import { gsap } from 'gsap'
import type { IntroParticlesHandle } from './intro-particles'

/**
 * Pure GSAP timeline builder for the intro beats (restructured per client
 * direction: flash → montage → logotype finale → hero):
 *
 *   0.00–0.75  beat 1: counter exits (0.35s expo.in); STATIC LATTICE
 *              FLASH, the breathing field alone, with a brief opacity
 *              swell (~0.45s) so the moment reads intentional. No word.
 *   0.80–4.55  beat 2: brand-phrase montage (m0 = 0.8, CARD = 1.25s
 *              unchanged): CREATIVITY WITHOUT LIMITS → TECHNICAL EXCELLENCE
 *              → HUMAN CONNECTION. Bursts as-is: scatter at 0.75 (card 1),
 *              radial burst at 3.25 (card 3), static on card 2. Chars are
 *              word-grouped and completion-locked to each streak wipe.
 *   4.75–7.30  beat 3: BEATROX FINALE, the card-3 explosion's particles
 *              converge into the logotype (the exact staggered left-to-right
 *              assembly, moved verbatim from the old beat 1); caption dwells
 *              5.5–6.9; word holds.
 *   7.20–10.0  beat 4: part() at 7.2 (logotype parts like a curtain),
 *              hero match-frame h0 = 7.4 (unchanged mechanics), hold, then
 *   label      "dissolve" at 10.0, opacity crossfade onto the real hero
 *              (800ms power2.inOut, unchanged).
 *
 * Beat 0 (preloader) is progress-driven and intentionally NOT stretched.
 * Skipping seeks to the "dissolve" label, never a hard cut.
 */

export const INTRO_DISSOLVE_LABEL = 'dissolve'

export interface IntroTimelineRefs {
  root: HTMLElement
  counterWrap: HTMLElement
  caption: HTMLElement
  cards: HTMLElement[]
  streaks: HTMLElement[]
  heroLayer: HTMLElement
  /** Inner wrapper of the match-frame media, the scale (dive) target. */
  heroMedia: HTMLElement
  heroText: HTMLElement
  skipButton: HTMLElement
  /** Top-left brand marker, fades out at the match-frame so it never
      double-exposes with the real nav logo during the dissolve. */
  brandMarker: HTMLElement
  /** Particle canvas, null when WebGL failed/unavailable. */
  canvas: HTMLElement | null
  /** Lazy accessor: particles may still be initializing when built. */
  getParticles: () => IntroParticlesHandle | null
  mobile: boolean
  onDissolveStart: () => void
  onFinish: () => void
}

export function buildIntroTimeline(r: IntroTimelineRefs): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
  const CARD = 1.25
  const cards = r.cards // 3 phrase cards; mobile keeps all 3

  // ── Beat 0 → 1: counter exits, then static lattice flash ─────────────
  tl.to(r.counterWrap, { opacity: 0, y: -24, duration: 0.35, ease: 'expo.in' }, 0.05)
  // Brief opacity swell on the breathing field, reads as an intentional
  // beat, not a loading gap. The word does NOT assemble here anymore.
  if (r.canvas) {
    tl.fromTo(r.canvas, { opacity: 0.45 }, { opacity: 1, duration: 0.45, ease: 'power2.out' }, 0.1)
  }

  // ── Beat 2: brand-phrase montage (word-grouped char stagger) ──────────
  const m0 = 0.8
  // Card 1 keeps its montage-opening explosion; card 3 (HUMAN CONNECTION)
  // gets a matching radial burst just before its arrival. Card 2 stays
  // static.
  tl.call(() => r.getParticles()?.scatter(), undefined, m0 - 0.05)
  tl.call(() => r.getParticles()?.scatter({ radial: true }), undefined, m0 + 2 * CARD - 0.05)
  cards.forEach((card, i) => {
    const t = m0 + i * CARD
    const index = card.querySelector('.intro-type-card__index')
    const wordGroups = card.querySelectorAll('.intro-type-card__wordgroup')
    // Container visibility is discrete; the chars carry the motion so
    // entrances/exits never pop.
    tl.set(card, { opacity: 1 }, t - 0.04)
    if (index) {
      tl.fromTo(
        index,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'expo.out' },
        t - 0.02
      )
      tl.to(index, { opacity: 0, y: -8, duration: 0.2, ease: 'power3.in' }, t + CARD - 0.26)
    }
    // Completion-perfect sync: chars start at card_t − 0.04 in per-word
    // groups (0.025s between groups, 0.011s/char, 0.14s expo.out), so the
    // last char locks at ≈ card_t + 0.24, the frame the streak wipe
    // finishes opening. Word + image complete together.
    wordGroups.forEach((group, gi) => {
      const chars = group.querySelectorAll('.intro-type-card__char')
      tl.fromTo(
        chars,
        { opacity: 0, yPercent: 70 },
        { opacity: 1, yPercent: 0, duration: 0.14, ease: 'expo.out', stagger: 0.011 },
        t - 0.04 + gi * 0.025
      )
    })
    const allChars = card.querySelectorAll('.intro-type-card__char')
    tl.to(
      allChars,
      { opacity: 0, yPercent: -60, duration: 0.24, ease: 'power3.in', stagger: 0.012 },
      t + CARD - 0.3
    )
    tl.set(card, { opacity: 0 }, t + CARD - 0.02)
  })

  // Streak i is BEAT-LOCKED to card i: the wipe opens at card_t + 0.06 and
  // completes at card_t + 0.24, the same frame the phrase finishes
  // forming. Flash lifecycle: 180ms expo.out wipe → 1.12→1.0 scale settle
  // → 180ms expo.in exit, gone by +0.56s.
  cards.forEach((_, i) => {
    const streak = r.streaks[i]
    if (!streak) return
    const t = m0 + i * CARD + 0.06
    const fromLeft = i % 2 === 0
    tl.set(streak, { opacity: 1 }, t)
    tl.fromTo(
      streak,
      { clipPath: fromLeft ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.18, ease: 'expo.out' },
      t
    )
    tl.fromTo(streak, { scale: 1.12 }, { scale: 1, duration: 0.55, ease: 'expo.out' }, t)
    tl.to(
      streak,
      {
        clipPath: fromLeft ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)',
        duration: 0.18,
        ease: 'expo.in',
      },
      t + 0.36
    )
    tl.set(streak, { opacity: 0 }, t + 0.56)
  })

  // ── Beat 3: BEATROX finale, explosion converges into the logotype ────
  // Same assembly visual as the original beat 1 (staggered left-to-right
  // sweep, landing twinkle, drift lock), moved verbatim to ~4.75s; morphTo
  // captures live positions, so it converges from the card-3 field.
  tl.call(() => r.getParticles()?.morphTo('BEATROX'), undefined, 4.75)
  tl.fromTo(
    r.caption,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out' },
    5.5
  )
  tl.to(r.caption, { opacity: 0, y: -12, duration: 0.3, ease: 'power3.in' }, 6.9)

  // ── Beat 4: part the logotype, hero match-frame (dissolve contract) ───
  // End states are unchanged (opacity 1, scale 1) and the dive settles
  // exactly as the hold ends, the handoff stays pixel-exact.
  const h0 = 7.4
  const HOLD = 2.3 // trimmed from 2.6, keeps measured runtime ≤ ~11.8s
  tl.call(() => r.getParticles()?.part(), undefined, h0 - 0.2)
  if (r.canvas) tl.to(r.canvas, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, h0)
  tl.fromTo(r.heroLayer, { opacity: 0 }, { opacity: 1, duration: 0.75, ease: 'power2.inOut' }, h0)
  tl.fromTo(
    r.heroMedia,
    { scale: 1.06 },
    { scale: 1, duration: HOLD, ease: 'power3.out' },
    h0
  )
  tl.fromTo(r.heroText, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, h0 + 0.65)
  tl.to(r.skipButton, { opacity: 0, duration: 0.3 }, h0)
  tl.to(r.brandMarker, { opacity: 0, duration: 0.3, ease: 'power1.in' }, h0)

  // ── Dissolve onto the real hero (timing unchanged) ────────────────────
  const d0 = h0 + HOLD
  tl.addLabel(INTRO_DISSOLVE_LABEL, d0)
  tl.call(r.onDissolveStart, undefined, d0)
  // Intro headline exits fast so the real HomeHero stagger (starting now)
  // never double-renders text on top of it.
  tl.to(r.heroText, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, d0)
  // Opacity-only crossfade: both layers are pixel-identical here, so a
  // plain fade is invisible (animated blur caused a defocus pulse).
  tl.fromTo(r.root, { opacity: 1 }, { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, d0)
  tl.call(r.onFinish, undefined, d0 + 0.82)

  return tl
}

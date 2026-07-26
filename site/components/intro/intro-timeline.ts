import { gsap } from 'gsap'
import type { IntroParticlesHandle } from './intro-particles'

/**
 * Pure GSAP timeline builder for the intro beats (plan §2, pacing rev 3 —
 * brand-phrase montage, ~2s longer overall):
 *
 *   0.00–0.40  counter wrapper exits (expo.in)
 *   0.10–2.40  beat 1: particles assemble "BEATROX" (staggered left-to-right
 *              sweep, see intro-particles.ts); caption dwells +0.5s longer
 *   2.50–6.25  beat 2: three brand-phrase cards, 1.25s each — CREATIVITY
 *              WITHOUT LIMITS → TECHNICAL EXCELLENCE → HUMAN CONNECTION.
 *              Chars are grouped per word and start at card_t − 0.04 so the
 *              last char locks at ≈ card_t + 0.24, the exact frame the
 *              beat-locked streak wipe finishes opening (fires card_t+0.06).
 *   6.45–9.05  beat 3: hero match-frame (same image, same headline) fades
 *              in at scale 1.06 → 1.0 (the mesh3d "dive"); hold 2.6s so the
 *              landing breathes before the cut
 *   label      beat 4: "dissolve" — overlay crossfades onto the real hero
 *   "dissolve" (800ms, power2.inOut — unchanged)
 *
 * Beat 0 (preloader) is progress-driven and intentionally NOT stretched.
 * Skipping seeks to the "dissolve" label — never a hard cut.
 */

export const INTRO_DISSOLVE_LABEL = 'dissolve'

export interface IntroTimelineRefs {
  root: HTMLElement
  counterWrap: HTMLElement
  caption: HTMLElement
  cards: HTMLElement[]
  streaks: HTMLElement[]
  heroLayer: HTMLElement
  /** Inner wrapper of the match-frame media — the scale (dive) target. */
  heroMedia: HTMLElement
  heroText: HTMLElement
  skipButton: HTMLElement
  /** Particle canvas (Phase 3) — null when WebGL failed/unavailable. */
  canvas: HTMLElement | null
  /** Lazy accessor: particles may still be initializing when built. */
  getParticles: () => IntroParticlesHandle | null
  mobile: boolean
  onDissolveStart: () => void
  onFinish: () => void
}

export function buildIntroTimeline(r: IntroTimelineRefs): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
  const CARD = 1.25 // was 0.78 — longer holds suit the larger phrases
  const cards = r.cards // 3 phrase cards; mobile keeps all 3

  // ── Beat 0 → 1: counter exits ─────────────────────────────────────────
  tl.to(r.counterWrap, { opacity: 0, y: -24, duration: 0.35, ease: 'expo.in' }, 0.05)

  // ── Beat 1: logotype assemble (+0.5s dwell after convergence) ─────────
  tl.call(() => r.getParticles()?.morphTo('BEATROX'), undefined, 0.1)
  tl.fromTo(
    r.caption,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out' },
    0.85
  )
  tl.to(r.caption, { opacity: 0, y: -12, duration: 0.3, ease: 'power3.in' }, 2.1)

  // ── Beat 2: brand-phrase montage (word-grouped char stagger) ──────────
  const m0 = 2.5
  tl.call(() => r.getParticles()?.scatter(), undefined, m0 - 0.05)
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
    // Completion-perfect sync (plan §3): chars start at card_t − 0.04 in
    // per-word groups (0.025s between groups, 0.011s/char, 0.14s expo.out),
    // so the last char locks at ≈ card_t + 0.24 — the frame the streak
    // wipe finishes opening. Word + image complete together.
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
  const montageEnd = m0 + cards.length * CARD

  // Streak i is BEAT-LOCKED to card i: the wipe opens at card_t + 0.06 and
  // completes at card_t + 0.24 — the same frame the phrase finishes
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

  // ── Beat 3: hero match-frame (the seamless-dissolve contract, §3.5) ───
  // End states are unchanged (opacity 1, scale 1) and the dive settles
  // exactly as the hold ends — the handoff stays pixel-exact.
  const h0 = montageEnd + 0.2
  tl.call(() => r.getParticles()?.part(), undefined, h0 - 0.1)
  if (r.canvas) tl.to(r.canvas, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, h0)
  tl.fromTo(r.heroLayer, { opacity: 0 }, { opacity: 1, duration: 0.75, ease: 'power2.inOut' }, h0)
  tl.fromTo(
    r.heroMedia,
    { scale: 1.06 },
    { scale: 1, duration: 2.6, ease: 'power3.out' },
    h0
  )
  tl.fromTo(r.heroText, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, h0 + 0.65)
  tl.to(r.skipButton, { opacity: 0, duration: 0.3 }, h0)

  // ── Beat 4: seamless dissolve onto the real hero (timing unchanged) ───
  const d0 = h0 + 2.6 // match-frame hold: 1.9s → 2.6s so the landing breathes
  tl.addLabel(INTRO_DISSOLVE_LABEL, d0)
  tl.call(r.onDissolveStart, undefined, d0)
  // Intro headline exits fast so the real HomeHero stagger (starting now)
  // never double-renders text on top of it.
  tl.to(r.heroText, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, d0)
  tl.fromTo(
    r.root,
    { opacity: 1, filter: 'blur(0px)' },
    { opacity: 0, filter: 'blur(8px)', duration: 0.8, ease: 'power2.inOut' },
    d0
  )
  tl.call(r.onFinish, undefined, d0 + 0.82)

  return tl
}

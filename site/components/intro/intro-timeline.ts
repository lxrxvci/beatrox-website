import { gsap } from 'gsap'
import type { IntroParticlesHandle } from './intro-particles'

/**
 * Pure GSAP timeline builder for the intro beats (plan §2, pacing rev 2 —
 * client feedback: montage ~25% longer, overall 10–15% slower, weighted
 * easings instead of mechanical defaults):
 *
 *   0.00–0.40  counter wrapper exits (expo.in)
 *   0.10–1.75  beat 1: particles morph to "BEATROX" (1.3s converge), mono
 *              caption dwells a beat longer than the original cut
 *   1.85–~5.0  beat 2: kinetic type cards, ~0.78s each (was 0.62s), with
 *              per-character expo.out entrances and considered power3.in
 *              exits; gallery streaks as directional ~180ms masked wipes
 *              with a slow 1.12→1.0 scale settle
 *   ~5.2–6.9   beat 3: hero match-frame (same image, same headline) fades
 *              in at scale 1.06 → 1.0 (the mesh3d "dive"); particles part
 *   label      beat 4: "dissolve" — overlay crossfades onto the real hero
 *   "dissolve" (800ms, power2.inOut — unchanged, per client direction)
 *
 * Mobile drops the last type card, shortening the montage. Skipping seeks
 * to the "dissolve" label — never a hard cut. Beat 0 (preloader) is
 * progress-driven and intentionally NOT stretched.
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
  const CARD = 0.78 // was 0.62 — montage paced ~25% slower
  const cards = r.mobile ? r.cards.slice(0, 3) : r.cards

  // ── Beat 0 → 1: counter exits ─────────────────────────────────────────
  tl.to(r.counterWrap, { opacity: 0, y: -24, duration: 0.35, ease: 'expo.in' }, 0.05)

  // ── Beat 1: logotype assemble ─────────────────────────────────────────
  tl.call(() => r.getParticles()?.morphTo('BEATROX'), undefined, 0.1)
  tl.fromTo(
    r.caption,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out' },
    0.7
  )
  tl.to(r.caption, { opacity: 0, y: -12, duration: 0.3, ease: 'power3.in' }, 1.6)

  // ── Beat 2: highlights montage (char-level stagger, weighted eases) ───
  const m0 = 2.0
  tl.call(() => r.getParticles()?.scatter(), undefined, m0 - 0.05)
  cards.forEach((card, i) => {
    const t = m0 + i * CARD
    const index = card.querySelector('.intro-type-card__index')
    const chars = card.querySelectorAll('.intro-type-card__char')
    // Container visibility is discrete; the chars carry the motion so
    // entrances/exits never pop.
    tl.set(card, { opacity: 1 }, t)
    if (index) {
      tl.fromTo(
        index,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'expo.out' },
        t + 0.02
      )
      tl.to(index, { opacity: 0, y: -8, duration: 0.2, ease: 'power3.in' }, t + CARD - 0.24)
    }
    if (chars.length) {
      tl.fromTo(
        chars,
        { opacity: 0, yPercent: 70 },
        { opacity: 1, yPercent: 0, duration: 0.36, ease: 'expo.out', stagger: 0.026 },
        t + 0.05
      )
      tl.to(
        chars,
        { opacity: 0, yPercent: -60, duration: 0.24, ease: 'power3.in', stagger: 0.016 },
        t + CARD - 0.28
      )
    }
    tl.set(card, { opacity: 0 }, t + CARD - 0.02)
  })
  const montageEnd = m0 + cards.length * CARD

  // Gallery image streaks: ~180ms directional masked wipes (alternating
  // pass-through direction) with a slow scale settle — reads as an
  // intentional flash, not a glitch.
  r.streaks.forEach((streak, i) => {
    const t = m0 + 0.35 + i * (CARD * 1.25)
    if (t + 0.6 > montageEnd) return
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
  // End states are unchanged (opacity 1, scale 1) and the hold settles
  // before the dissolve — the handoff stays pixel-exact.
  const h0 = montageEnd + 0.2
  tl.call(() => r.getParticles()?.part(), undefined, h0 - 0.1)
  if (r.canvas) tl.to(r.canvas, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, h0)
  tl.fromTo(r.heroLayer, { opacity: 0 }, { opacity: 1, duration: 0.75, ease: 'power2.inOut' }, h0)
  tl.fromTo(
    r.heroMedia,
    { scale: 1.06 },
    { scale: 1, duration: 1.9, ease: 'power3.out' },
    h0
  )
  tl.fromTo(r.heroText, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, h0 + 0.65)
  tl.to(r.skipButton, { opacity: 0, duration: 0.3 }, h0)

  // ── Beat 4: seamless dissolve onto the real hero (timing unchanged) ───
  const d0 = h0 + 1.9 // match-frame hold: 1.5s → 1.9s so the landing breathes
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

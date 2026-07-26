import { gsap } from 'gsap'
import type { IntroParticlesHandle } from './intro-particles'

/**
 * Pure GSAP timeline builder for the intro beats (plan §2):
 *
 *   0.00–0.35  counter wrapper fades out (beat 0 → 1 transition)
 *   0.10–1.40  beat 1: particles morph to "BEATROX", mono caption in/out
 *   1.50–~4.0  beat 2: kinetic type cards (~0.62s each) + image streaks
 *   ~4.1–5.6   beat 3: hero match-frame (same image, same headline) fades
 *              in at scale 1.06 → 1.0 (the mesh3d "dive"); particles part
 *   label      beat 4: "dissolve" — overlay crossfades onto the real hero
 *   "dissolve" (600–900ms, power2.inOut)
 *
 * Mobile drops the last type card, shortening the montage (runtime ≤ 8s).
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
  const CARD = 0.62
  const cards = r.mobile ? r.cards.slice(0, 3) : r.cards

  // ── Beat 0 → 1: counter exits ─────────────────────────────────────────
  tl.to(r.counterWrap, { opacity: 0, y: -24, duration: 0.35, ease: 'power2.in' }, 0.05)

  // ── Beat 1: logotype assemble ─────────────────────────────────────────
  tl.call(() => r.getParticles()?.morphTo('BEATROX'), undefined, 0.1)
  tl.fromTo(r.caption, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3 }, 0.55)
  tl.to(r.caption, { opacity: 0, y: -12, duration: 0.25, ease: 'power2.in' }, 1.2)

  // ── Beat 2: rapid highlights montage ──────────────────────────────────
  const m0 = 1.5
  tl.call(() => r.getParticles()?.scatter(), undefined, m0 - 0.05)
  cards.forEach((card, i) => {
    const t = m0 + i * CARD
    tl.fromTo(
      card,
      { opacity: 0, yPercent: 55, scale: 0.94 },
      { opacity: 1, yPercent: 0, scale: 1, duration: 0.26 },
      t
    )
    tl.to(
      card,
      { opacity: 0, yPercent: -55, scale: 1.03, duration: 0.2, ease: 'power2.in' },
      t + CARD - 0.2
    )
  })
  const montageEnd = m0 + cards.length * CARD

  // Gallery image streaks: ~140ms masked wipes interleaved between cards.
  r.streaks.forEach((streak, i) => {
    const t = m0 + 0.3 + i * (CARD * 1.3)
    if (t + 0.32 > montageEnd) return
    tl.fromTo(
      streak,
      { clipPath: 'inset(0% 100% 0% 0%)', opacity: 1, scale: 1.08 },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.13, ease: 'power4.out' },
      t
    )
    tl.to(
      streak,
      { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.13, ease: 'power4.in' },
      t + 0.17
    )
  })

  // ── Beat 3: hero match-frame (the seamless-dissolve contract, §3.5) ───
  const h0 = montageEnd + 0.15
  tl.call(() => r.getParticles()?.part(), undefined, h0 - 0.1)
  if (r.canvas) tl.to(r.canvas, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, h0)
  tl.fromTo(r.heroLayer, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' }, h0)
  tl.fromTo(
    r.heroMedia,
    { scale: 1.06 },
    { scale: 1, duration: 1.5, ease: 'power2.out' },
    h0
  )
  tl.fromTo(r.heroText, { opacity: 0 }, { opacity: 1, duration: 0.45 }, h0 + 0.6)
  tl.to(r.skipButton, { opacity: 0, duration: 0.3 }, h0)

  // ── Beat 4: seamless dissolve onto the real hero ──────────────────────
  const d0 = h0 + 1.5
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

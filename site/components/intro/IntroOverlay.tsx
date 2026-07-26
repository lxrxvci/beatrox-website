'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { getLenis } from '@/components/lenis-store'
import { INTRO_COMPLETE_EVENT } from './intro-storage'
import { buildIntroTimeline, INTRO_DISSOLVE_LABEL } from './intro-timeline'
import type { IntroParticlesHandle } from './intro-particles'
import IntroImageStreaks from './IntroImageStreaks'
import type { IntroGateProps } from './IntroGate'

/** Beat 2 kinetic type cards — mirrors the page's section order. */
const TYPE_CARDS = ['Design', 'Production', 'Rentals', 'Immersive Tech']

/**
 * First-visit intro overlay (see beatrox-intro-overlay-plan.md).
 *
 * Beat 0 preloads the hero image + gallery streaks while an oversized
 * counter tracks real progress; beats 1–4 then run as one GSAP timeline
 * ending in a crossfade that lands exactly on the real hero's first frame
 * (same image URL, same gradient scrims, same headline classes/position).
 *
 * Scroll is locked (Lenis .stop() + body overflow) until the dissolve
 * starts; `intro:complete` fires at that moment so HomeHero's staggered
 * entrance begins in step with the fade. Skip (button / Esc / scroll
 * intent) seeks to the dissolve — never a hard cut. Mounted exclusively
 * by IntroGate; unmounts itself when the timeline completes.
 */
export default function IntroOverlay({ heroImage, headline, galleryImages }: IntroGateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const counterWrapRef = useRef<HTMLDivElement | null>(null)
  const captionRef = useRef<HTMLParagraphElement | null>(null)
  const heroLayerRef = useRef<HTMLDivElement | null>(null)
  const heroMediaRef = useRef<HTMLDivElement | null>(null)
  const heroTextRef = useRef<HTMLDivElement | null>(null)
  const skipRef = useRef<HTMLButtonElement | null>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const streaksRef = useRef<(HTMLDivElement | null)[]>([])
  // Phase 3 wires the particle scene in here; null = WebGL unavailable.
  const particlesRef = useRef<IntroParticlesHandle | null>(null)

  const [counter, setCounter] = useState(0)
  const [done, setDone] = useState(false)

  const registerCard = useCallback((i: number, el: HTMLDivElement | null) => {
    cardsRef.current[i] = el
  }, [])
  const setCardRef = useCallback(
    (i: number) => (el: HTMLDivElement | null) => registerCard(i, el),
    [registerCard]
  )
  const registerStreak = useCallback((i: number, el: HTMLDivElement | null) => {
    streaksRef.current[i] = el
  }, [])

  useEffect(() => {
    let disposed = false
    let scrollLocked = true

    // ── Scroll lock (beats 0–3) ─────────────────────────────────────────
    getLenis()?.stop()
    // Lenis is dynamically imported by SmoothScroll and may not exist yet.
    const lenisRetry = window.setTimeout(() => getLenis()?.stop(), 700)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const restoreScroll = () => {
      if (!scrollLocked) return
      scrollLocked = false
      getLenis()?.start()
      document.body.style.overflow = prevOverflow
    }

    // ── Skip → seek to the dissolve label (never a hard cut) ────────────
    let tl: gsap.core.Timeline | null = null
    let dissolved = false
    let skipRequested = false

    const applySkip = () => {
      if (tl) {
        particlesRef.current?.skip()
        // suppressEvents=false so beat-3 end-state + onDissolveStart fire.
        tl.seek(INTRO_DISSOLVE_LABEL, false)
        tl.play()
      }
    }
    const requestSkip = () => {
      if (dissolved || skipRequested || disposed) return
      skipRequested = true
      applySkip()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault()
        requestSkip()
      }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      requestSkip()
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })

    const onSkipClick = () => requestSkip()
    skipRef.current?.addEventListener('click', onSkipClick)

    // ── Beat 0: real-progress counter (asset preloads) ──────────────────
    const preload = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        const finish = () => resolve()
        img.onload = () => {
          if (typeof img.decode === 'function') {
            img.decode().then(finish, finish)
          } else {
            finish()
          }
        }
        img.onerror = finish
        img.src = src
      })

    // Warm the three.js chunk during beat 0 so beat 1's morph never stalls.
    const assetsReady = Promise.all([
      preload(heroImage),
      ...galleryImages.map(preload),
      import('./intro-particles').then(() => undefined, () => undefined),
    ])
    const minTime = new Promise<void>((r) => window.setTimeout(r, 1250))

    const counterObj = { v: 0 }
    const renderCounter = () => setCounter(Math.round(counterObj.v))
    // Crawl toward 88% while assets load; jump to 100% once they're ready.
    const crawl = gsap.to(counterObj, {
      v: 88,
      duration: 1.15,
      ease: 'power1.inOut',
      onUpdate: renderCounter,
    })

    Promise.all([assetsReady, minTime]).then(() => {
      if (disposed) return
      crawl.kill()
      gsap.to(counterObj, {
        v: 100,
        duration: 0.28,
        ease: 'power2.out',
        onUpdate: renderCounter,
        onComplete: startTimeline,
      })
    })

    function startTimeline() {
      if (disposed) return
      const root = rootRef.current
      const counterWrap = counterWrapRef.current
      const caption = captionRef.current
      const heroLayer = heroLayerRef.current
      const heroMedia = heroMediaRef.current
      const heroText = heroTextRef.current
      const skipButton = skipRef.current
      if (!root || !counterWrap || !caption || !heroLayer || !heroMedia || !heroText || !skipButton) {
        // DOM went away — bail out cleanly rather than trapping scroll.
        finishImmediately()
        return
      }

      tl = buildIntroTimeline({
        root,
        counterWrap,
        caption,
        cards: cardsRef.current.filter((el): el is HTMLDivElement => el !== null),
        streaks: streaksRef.current.filter((el): el is HTMLDivElement => el !== null),
        heroLayer,
        heroMedia,
        heroText,
        skipButton,
        canvas: root.querySelector('canvas'),
        getParticles: () => particlesRef.current,
        mobile: window.innerWidth < 768,
        onDissolveStart: () => {
          if (dissolved) return
          dissolved = true
          window.removeEventListener('keydown', onKey)
          window.removeEventListener('wheel', onWheel)
          window.removeEventListener('touchmove', onTouchMove)
          root.style.pointerEvents = 'none'
          restoreScroll()
          // HomeHero's staggered entrance begins in step with the fade.
          window.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT))
        },
        onFinish: () => {
          if (!disposed) setDone(true)
        },
      })
      tl.play()
      if (skipRequested) applySkip()
    }

    function finishImmediately() {
      restoreScroll()
      window.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT))
      setDone(true)
    }

    return () => {
      disposed = true
      window.clearTimeout(lenisRetry)
      crawl.kill()
      tl?.kill()
      particlesRef.current?.dispose()
      particlesRef.current = null
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchmove', onTouchMove)
      skipRef.current?.removeEventListener('click', onSkipClick)
      restoreScroll()
    }
  }, [heroImage, galleryImages])

  if (done) return null

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] overflow-hidden bg-black"
      style={{ touchAction: 'none' }}
    >
      {/* Visual layers are decorative; the skip button below stays outside
          the aria-hidden subtree so it remains focusable/announced. */}
      <div aria-hidden="true" className="absolute inset-0">
        {/* Beat 3: hero match-frame — same image URL, same gradient scrims
            and same container/headline classes as the real hero, so the
            beat-4 crossfade lands on an identical first frame. */}
        <div ref={heroLayerRef} className="absolute inset-0 z-10 opacity-0">
          <div ref={heroMediaRef} className="absolute inset-0 will-change-transform">
            {/* eslint-disable-next-line @next/next/no-img-element -- must be
                the raw preloaded URL for an instant, identical paint */}
            <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,0,0,0.05),rgba(0,0,0,0.78)_58%,rgba(0,0,0,0.95)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/90" />
          </div>
          <div ref={heroTextRef} className="hero absolute inset-0 flex flex-col justify-end opacity-0">
            <div className="relative mx-auto w-full max-w-[1120px] pb-6 lg:pb-10">
              <p className="overline mb-6">Experiential Design &amp; Production</p>
              <div className="heading-xl mb-8 max-w-[12ch] uppercase max-[480px]:text-[2.6rem]">
                {headline}
              </div>
            </div>
          </div>
        </div>

        {/* Beat 2: gallery image streaks (clip-path wipes) */}
        <IntroImageStreaks images={galleryImages} register={registerStreak} />

        {/* Beat 2: kinetic type cards */}
        {TYPE_CARDS.map((label, i) => (
          <div key={label} ref={setCardRef(i)} className="intro-type-card opacity-0">
            <span className="intro-type-card__index">{String(i + 1).padStart(2, '0')} / 04</span>
            <span className="intro-type-card__word">{label}</span>
          </div>
        ))}

        {/* Beat 1 caption (logotype itself is the particle morph) */}
        <p ref={captionRef} className="hud-label intro-caption opacity-0">
          Experiential Design &amp; Event Production
        </p>

        {/* Brand marker, top-left (nav is covered by this overlay) */}
        <p className="hud-label absolute left-6 top-6 z-40 lg:left-10 lg:top-8">
          BEATROX — EXPERIENCE SYSTEMS
        </p>

        {/* Beat 0: oversized progress counter, bottom-left */}
        <div ref={counterWrapRef} className="absolute bottom-4 left-6 z-40 lg:bottom-8 lg:left-10">
          <p className="hud-label mb-3">LOADING EXPERIENCE</p>
          <div className="intro-counter">
            {counter}
            <span className="intro-counter__unit">%</span>
          </div>
        </div>

        {/* Film grain, matching the site's atmosphere layer */}
        <div className="grain-overlay" />
      </div>

      <button
        ref={skipRef}
        type="button"
        className="intro-skip absolute bottom-6 right-6 z-50 lg:bottom-8 lg:right-10"
      >
        Skip intro
      </button>
    </div>
  )
}

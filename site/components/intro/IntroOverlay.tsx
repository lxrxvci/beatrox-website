'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { getLenis } from '@/components/lenis-store'
import { INTRO_COMPLETE_EVENT } from './intro-storage'
import { buildIntroTimeline, INTRO_DISSOLVE_LABEL } from './intro-timeline'
import type { IntroParticlesHandle } from './intro-particles'
import IntroCanvas from './IntroCanvas'
import IntroImageStreaks from './IntroImageStreaks'
import type { IntroGateProps } from './IntroGate'

/** Beat 2 brand-phrase cards — matched to MONTAGE_IMAGES order. */
const TYPE_CARDS = ['Creativity Without Limits', 'Technical Excellence', 'Human Connection']

/**
 * KineticHeading-style size clamp: multi-word phrases must never clip on
 * narrow viewports. Words are kept atomic (unbreakable), so measure the
 * longest word against the card width and shrink the font until it fits.
 */
function clampCardWordSizes(cards: (HTMLDivElement | null)[]) {
  for (const card of cards) {
    const word = card?.querySelector<HTMLElement>('.intro-type-card__word')
    if (!card || !word) continue
    const label = word.getAttribute('aria-label') || word.textContent || ''
    const longest = label.split(/\s+/).reduce((a, b) => (b.length > a.length ? b : a), '')
    if (!longest) continue
    word.style.fontSize = ''
    const styles = window.getComputedStyle(word)
    const baseSize = parseFloat(styles.fontSize)
    const context = document.createElement('canvas').getContext('2d')
    if (!context || !Number.isFinite(baseSize)) continue
    context.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`
    const letterSpacing = parseFloat(styles.letterSpacing) || 0
    const sample = longest.toUpperCase()
    const wordWidth =
      context.measureText(sample).width + letterSpacing * Math.max(0, sample.length - 1)
    const available = card.clientWidth * 0.92
    if (available > 0 && wordWidth > available) {
      word.style.fontSize = `${Math.max(20, Math.floor(baseSize * (available / wordWidth)))}px`
    }
  }
}

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
export default function IntroOverlay({ heroImage, headline, subheadline, ctaLabel, secondaryCtaLabel, galleryImages }: IntroGateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const counterWrapRef = useRef<HTMLDivElement | null>(null)
  const captionRef = useRef<HTMLParagraphElement | null>(null)
  const heroLayerRef = useRef<HTMLDivElement | null>(null)
  const heroMediaRef = useRef<HTMLDivElement | null>(null)
  const heroTextRef = useRef<HTMLDivElement | null>(null)
  const skipRef = useRef<HTMLButtonElement | null>(null)
  const brandRef = useRef<HTMLParagraphElement | null>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const streaksRef = useRef<(HTMLDivElement | null)[]>([])
  // Phase 3 wires the particle scene in here; null = WebGL unavailable.
  const particlesRef = useRef<IntroParticlesHandle | null>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const [counter, setCounter] = useState(0)
  const [done, setDone] = useState(false)
  const [webglFailed, setWebglFailed] = useState(false)

  const handleParticlesReady = useCallback((h: IntroParticlesHandle) => {
    particlesRef.current = h
    // Late init (slow chunk): the timeline's own morphTo call fires at
    // 4.75s via the lazy accessor, so it needs no help before that — only
    // catch up if the finale window already started (and hasn't ended).
    const tl = tlRef.current
    if (tl && tl.isActive() && tl.time() >= 4.75 && tl.time() < 7.2) h.morphTo('BEATROX')
  }, [])
  const handleParticlesFail = useCallback(() => {
    // Graceful no-op (plan §4): the intro continues as a DOM-only sequence.
    setWebglFailed(true)
  }, [])

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
    const minTime = new Promise<void>((r) =>
      window.setTimeout(r, window.innerWidth < 768 ? 1000 : 1250)
    )

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
      const brandMarker = brandRef.current
      if (!root || !counterWrap || !caption || !heroLayer || !heroMedia || !heroText || !skipButton || !brandMarker) {
        // DOM went away — bail out cleanly rather than trapping scroll.
        finishImmediately()
        return
      }

      // Multi-word phrases must fit before the timeline reveals them —
      // measure with real font metrics (fonts are settled by end of beat 0).
      clampCardWordSizes(cardsRef.current)

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
        brandMarker,
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
      tlRef.current = tl
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
      tlRef.current = null
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

  // Portal to <body>: the page renders inside <main className="curtain-main
  // relative z-10">, whose stacking context would trap the overlay's z-index
  // below the nav (z-50). At body level z-[100] sits above content/nav/grain
  // and below the admin overlay (z-9999). Client-only mount (ssr:false), so
  // document is always available here.
  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] overflow-hidden bg-black"
      style={{ touchAction: 'none' }}
    >
      {/* Visual layers are decorative; the skip button below stays outside
          the aria-hidden subtree so it remains focusable/announced. */}
      <div aria-hidden="true" className="absolute inset-0">
        {/* Particle backdrop (beats 0–3); absent when WebGL is unavailable */}
        {!webglFailed && (
          <IntroCanvas onReady={handleParticlesReady} onFail={handleParticlesFail} />
        )}

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
              {/* Invisible replicas of the real hero's subheadline + CTA row
                  (same classes, same copy) so the justify-end layout puts the
                  headline at the real hero's exact final position — without
                  them the match-frame headline would sit ~100px too low and
                  the handoff would visibly jump. */}
              <p className="mb-10 max-w-[48ch] text-lg leading-relaxed text-white opacity-0">
                {subheadline}
              </p>
              <div className="flex flex-wrap gap-4 opacity-0">
                <span className="btn-magnetic">{ctaLabel}</span>
                <span className="btn-magnetic btn-magnetic--accent">{secondaryCtaLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Beat 2: gallery image streaks (clip-path wipes) */}
        <IntroImageStreaks images={galleryImages} register={registerStreak} />

        {/* Beat 2: brand-phrase cards — per-word groups (unbreakable) of
            per-character spans so the timeline can stagger letters; the
            phrase stays accessible via aria-label */}
        {TYPE_CARDS.map((label, i) => (
          <div key={label} ref={setCardRef(i)} className="intro-type-card opacity-0">
            <span className="intro-type-card__index">{String(i + 1).padStart(2, '0')}</span>
            <span className="intro-type-card__word" aria-label={label}>
              {label.split(' ').map((wordText, w) => (
                <span key={w} aria-hidden="true" className="intro-type-card__wordgroup">
                  {wordText.split('').map((ch, j) => (
                    <span key={j} className="intro-type-card__char">
                      {ch}
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </div>
        ))}

        {/* Beat 1 caption (logotype itself is the particle morph) */}
        <p ref={captionRef} className="hud-label intro-caption opacity-0">
          Experiential Design &amp; Event Production
        </p>

        {/* Brand marker, top-left (nav is covered by this overlay). Fades
            out at the start of beat 3 so it never double-exposes with the
            real nav logo during the dissolve. */}
        <p ref={brandRef} className="hud-label absolute left-6 top-6 z-40 lg:left-10 lg:top-8">
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
    </div>,
    document.body
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { getLenis } from '@/components/lenis-store'
import { INTRO_COMPLETE_EVENT } from './intro-storage'
import type { IntroGateProps } from './IntroGate'

/**
 * First-visit intro overlay (see beatrox-intro-overlay-plan.md).
 *
 * Phase 1 skeleton: black screen + real-progress % counter + skip, then a
 * plain crossfade into the hero. Beats 1–4 (timeline, particles) land in
 * later phases.
 *
 * Lifecycle: locks scroll on mount (Lenis .stop() + body overflow), unlocks
 * when the dissolve starts, dispatches `intro:complete`, then unmounts
 * itself. Mounted exclusively by IntroGate (gating lives there).
 */
export default function IntroOverlay({ heroImage }: IntroGateProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const counterWrapRef = useRef<HTMLDivElement | null>(null)
  const [counter, setCounter] = useState(0)
  const [done, setDone] = useState(false)

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

    // ── Skip (button + Esc + scroll intent) — jumps to the dissolve ─────
    let fading = false
    const startDissolve = () => {
      if (fading || disposed) return
      fading = true
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchmove', onTouchMove)
      restoreScroll()
      window.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT))
      const root = rootRef.current
      if (!root) {
        setDone(true)
        return
      }
      root.style.pointerEvents = 'none'
      gsap.to(counterWrapRef.current, { opacity: 0, duration: 0.3 })
      gsap.fromTo(
        root,
        { opacity: 1, filter: 'blur(0px)' },
        {
          opacity: 0,
          filter: 'blur(8px)',
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => {
            if (!disposed) setDone(true)
          },
        }
      )
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault()
        startDissolve()
      }
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      startDissolve()
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })

    const skipButton = rootRef.current?.querySelector('button[data-intro-skip]')
    const onSkipClick = () => startDissolve()
    skipButton?.addEventListener('click', onSkipClick)

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

    const assetsReady = Promise.all([preload(heroImage)])
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
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: renderCounter,
        onComplete: () => {
          // Phase 1: straight to the dissolve. Beats 1–3 arrive in Phase 2.
          window.setTimeout(startDissolve, 400)
        },
      })
    })

    return () => {
      disposed = true
      window.clearTimeout(lenisRetry)
      crawl.kill()
      gsap.killTweensOf(rootRef.current)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchmove', onTouchMove)
      skipButton?.removeEventListener('click', onSkipClick)
      restoreScroll()
    }
  }, [heroImage])

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
        {/* Brand marker, top-left (nav is covered by this overlay) */}
        <p className="hud-label absolute left-6 top-6 lg:left-10 lg:top-8">
          BEATROX — EXPERIENCE SYSTEMS
        </p>

        {/* Beat 0: oversized progress counter, bottom-left */}
        <div ref={counterWrapRef} className="absolute bottom-4 left-6 lg:bottom-8 lg:left-10">
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
        type="button"
        data-intro-skip
        className="intro-skip absolute bottom-6 right-6 lg:bottom-8 lg:right-10"
      >
        Skip intro
      </button>
    </div>
  )
}

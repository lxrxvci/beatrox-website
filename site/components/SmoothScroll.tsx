'use client'

import { useEffect } from 'react'
import type Lenis from 'lenis'
import { setLenis } from '@/components/lenis-store'

/**
 * Global Lenis smooth scroll, synced to the GSAP ticker so ScrollTrigger
 * animations stay perfectly in step with scroll position.
 * Disabled automatically for prefers-reduced-motion users.
 * gsap/ScrollTrigger/lenis are dynamically imported so they stay out of the
 * initial bundle for visitors who never scroll (or opt out of motion).
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    let cancelled = false
    let lenis: Lenis | null = null
    let gsapRef: typeof import('gsap').gsap | null = null
    let onTick: ((time: number) => void) | null = null

    void (async () => {
      const [{ default: LenisClass }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return

      gsap.registerPlugin(ScrollTrigger)
      gsapRef = gsap

      lenis = new LenisClass({
        lerp: 0.1,
        smoothWheel: true,
      })
      setLenis(lenis)

      lenis.on('scroll', ScrollTrigger.update)

      onTick = (time: number) => {
        lenis?.raf(time * 1000)
      }
      gsap.ticker.add(onTick)
      gsap.ticker.lagSmoothing(0)
    })()

    return () => {
      cancelled = true
      if (gsapRef && onTick) gsapRef.ticker.remove(onTick)
      lenis?.destroy()
      setLenis(null)
    }
  }, [])

  return <>{children}</>
}

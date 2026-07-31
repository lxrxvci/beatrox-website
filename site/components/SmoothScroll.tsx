'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type Lenis from 'lenis'
import { setLenis, getLenis } from '@/components/lenis-store'

/**
 * Global Lenis smooth scroll, synced to the GSAP ticker so ScrollTrigger
 * animations stay perfectly in step with scroll position.
 * Disabled automatically for prefers-reduced-motion users.
 * gsap/ScrollTrigger/lenis are dynamically imported so they stay out of the
 * initial bundle for visitors who never scroll (or opt out of motion).
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPopNavigation = useRef(false)

  // Lenis keeps its own internal scroll position across App Router
  // navigations, which yanks freshly loaded pages back down to wherever the
  // previous page was scrolled. Reset to the top on every pathname change —
  // except back/forward (popstate), where Next restores the saved position
  // and Lenis picks it up via the native scroll event.
  useEffect(() => {
    const onPopState = () => {
      isPopNavigation.current = true
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (isPopNavigation.current) {
      isPopNavigation.current = false
      return
    }
    getLenis()?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
  }, [pathname])

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

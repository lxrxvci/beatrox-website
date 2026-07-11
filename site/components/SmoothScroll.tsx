'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setLenis } from '@/components/lenis-store'

gsap.registerPlugin(ScrollTrigger)

/**
 * Global Lenis smooth scroll, synced to the GSAP ticker so ScrollTrigger
 * animations stay perfectly in step with scroll position.
 * Disabled automatically for prefers-reduced-motion users.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    })
    setLenis(lenis)

    lenis.on('scroll', ScrollTrigger.update)

    const onTick = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(onTick)
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  return <>{children}</>
}

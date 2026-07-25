'use client'

import { useEffect, useRef } from 'react'

interface RevealOnScrollProps {
  children: React.ReactNode
  className?: string
  /** Extra delay in ms before the rise starts (used for grid stagger). */
  delayMs?: number
}

/**
 * Lightweight scroll-triggered reveal (y: 24 → 0 + fade, plays once) for
 * HUD card grids, gallery rows, and index panels. Follows the SmoothScroll
 * pattern: gsap/ScrollTrigger are dynamically imported so they stay out of
 * the initial bundle, and prefers-reduced-motion users get fully visible
 * static content.
 */
export default function RevealOnScroll({ children, className = '', delayMs = 0 }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      return
    }

    let cancelled = false
    let ctx: { revert: () => void } | undefined

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return

      gsap.registerPlugin(ScrollTrigger)
      ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            delay: delayMs / 1000,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              once: true,
            },
          },
        )
      }, el)
    })()

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [delayMs])

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  )
}

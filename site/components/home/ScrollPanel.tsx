'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

type ScrollPanelVariant = 'rise' | 'media' | 'stagger-side'

interface ScrollPanelProps {
  children: React.ReactNode
  bgSrc?: string
  bgAlt?: string
  className?: string
  id?: string
  variant?: ScrollPanelVariant
}

/**
 * Full-viewport homepage panel. Direct children stagger-reveal when the
 * panel enters the viewport at "top 80%", playing once. An optional
 * background image layer gets a gentle scrubbed parallax (yPercent ±10%)
 * behind a dark scrim so overlaid copy stays legible.
 *
 * Variants:
 * - `rise` (default): children fade up from y:48.
 * - `media`: children rise as in `rise`; the bg layer also settles from
 *   scale 1.15 → 1 on entry (cinematic push-in) alongside the parallax.
 * - `stagger-side`: children alternate arriving from x:-40 / x:40, y:0.
 * Reduced-motion: gsap is skipped entirely and everything renders visible.
 */
export default function ScrollPanel({
  children,
  bgSrc,
  bgAlt = '',
  className = '',
  id,
  variant = 'rise',
}: ScrollPanelProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const bgRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const kids = contentRef.current ? Array.from(contentRef.current.children) : []
      if (kids.length > 0) {
        const from =
          variant === 'stagger-side'
            ? { opacity: 0, x: 0, y: 0 }
            : { opacity: 0, y: 48, x: 0 }
        if (variant === 'stagger-side') {
          kids.forEach((kid, i) => gsap.set(kid, { opacity: 0, x: i % 2 === 0 ? -40 : 40, y: 0 }))
        } else {
          gsap.set(kids, from)
        }
        gsap.to(kids, {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: {
            trigger: root,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        })
      }

      if (bgRef.current) {
        gsap.fromTo(
          bgRef.current,
          { yPercent: -10 },
          {
            yPercent: 10,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        )

        if (variant === 'media') {
          gsap.fromTo(
            bgRef.current,
            { scale: 1.15 },
            {
              scale: 1,
              duration: 1.6,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: root,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            },
          )
        }
      }
    }, root)

    return () => ctx.revert()
  }, [variant])

  return (
    <section ref={rootRef} id={id} className={`relative overflow-hidden ${className}`}>
      {bgSrc && (
        <div ref={bgRef} className="absolute inset-x-0 -inset-y-[14%] z-0" aria-hidden="true">
          <Image src={bgSrc} alt={bgAlt} fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/85" />
        </div>
      )}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1120px] flex-col justify-center gap-10 px-6 py-24 md:gap-14 lg:px-10"
      >
        {children}
      </div>
    </section>
  )
}

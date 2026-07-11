'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { getLenis } from '@/components/lenis-store'

interface MarqueeItem {
  src: string
  alt: string
}

interface MarqueeProps {
  items: MarqueeItem[]
}

/**
 * Infinite horizontal marquee with scroll-velocity-reactive speed.
 * Content is duplicated for a seamless -50% loop.
 */
export default function Marquee({ items }: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tween = gsap.to(track, {
      xPercent: -50,
      ease: 'none',
      duration: 40,
      repeat: -1,
    })

    const lenis = getLenis()
    const onScroll = ({ velocity }: { velocity: number }) => {
      const speed = 1 + Math.min(Math.abs(velocity) * 0.1, 5)
      gsap.to(tween, { timeScale: speed, duration: 0.3, overwrite: true })
    }
    lenis?.on('scroll', onScroll)

    return () => {
      lenis?.off('scroll', onScroll)
      tween.kill()
    }
  }, [])

  if (items.length === 0) return null

  return (
    <section className="ticker border-t border-[var(--border)] py-6" aria-label="Project highlights">
      <div ref={trackRef} className="inline-flex" style={{ willChange: 'transform' }}>
        {[0, 1].map((dup) => (
          <div key={dup} className="inline-flex gap-4 pr-4 shrink-0" aria-hidden={dup === 1}>
            {items.map((item, i) => (
              <div
                key={`${dup}-${item.src}-${i}`}
                className="relative h-[200px] md:h-[300px] aspect-video rounded overflow-hidden shrink-0"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 60vw, 30vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

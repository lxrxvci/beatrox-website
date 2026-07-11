'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { getLenis } from '@/components/lenis-store'

interface CapabilitiesTickerProps {
  items: string[]
  /** Optional capability → preview video URL map. Portals activate only
   *  for capabilities that have a video. */
  previews?: Record<string, string>
}

/**
 * Dual-row kinetic ticker: oversized capability text scrolling in opposite
 * directions, with scroll-velocity-reactive speed (via the global Lenis
 * instance). Hovering a capability that has a preview video shows a
 * floating portal anchored to the cursor with slight lag.
 */
export default function CapabilitiesTicker({ items, previews = {} }: CapabilitiesTickerProps) {
  const rowA = useRef<HTMLDivElement | null>(null)
  const rowB = useRef<HTMLDivElement | null>(null)
  const portalRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const tweens: gsap.core.Tween[] = []
    for (const [el, dir] of [[rowA.current, -1], [rowB.current, 1]] as const) {
      if (!el) continue
      gsap.set(el, { xPercent: dir === 1 ? -50 : 0 })
      tweens.push(
        gsap.to(el, {
          xPercent: dir === 1 ? 0 : -50,
          ease: 'none',
          duration: 40,
          repeat: -1,
        })
      )
    }

    // Velocity-reactive speed
    const lenis = getLenis()
    const onScroll = ({ velocity }: { velocity: number }) => {
      const speed = 1 + Math.min(Math.abs(velocity) * 0.05, 4)
      for (const t of tweens) gsap.to(t, { timeScale: speed, duration: 0.3, overwrite: true })
    }
    lenis?.on('scroll', onScroll)

    return () => {
      lenis?.off('scroll', onScroll)
      tweens.forEach((t) => t.kill())
    }
  }, [])

  // Hover video portals (cursor-anchored, lerp-follow)
  useEffect(() => {
    const portal = portalRef.current
    const video = videoRef.current
    if (!portal || !video) return

    let raf = 0
    let px = 0
    let py = 0
    let tx = 0
    let ty = 0
    let active = false

    const loop = () => {
      px += (tx - px) * 0.1
      py += (ty - py) * 0.1
      portal.style.transform = `translate3d(${px}px, ${py}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    const onEnter = (e: Event) => {
      const src = (e.currentTarget as HTMLElement).dataset.preview
      if (!src) return
      video.src = src
      video.play().catch(() => {})
      active = true
      gsap.to(portal, { opacity: 1, scale: 1, duration: 0.3 })
      if (!raf) loop()
    }
    const onMove = (e: Event) => {
      const me = e as MouseEvent
      tx = me.clientX + 24
      ty = me.clientY + 24
    }
    const onLeave = () => {
      if (!active) return
      active = false
      gsap.to(portal, {
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
        onComplete: () => {
          video.pause()
          video.removeAttribute('src')
          video.load()
        },
      })
    }

    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-preview]'))
    for (const t of targets) {
      t.addEventListener('mouseenter', onEnter)
      t.addEventListener('mousemove', onMove)
      t.addEventListener('mouseleave', onLeave)
    }
    return () => {
      cancelAnimationFrame(raf)
      for (const t of targets) {
        t.removeEventListener('mouseenter', onEnter)
        t.removeEventListener('mousemove', onMove)
        t.removeEventListener('mouseleave', onLeave)
      }
    }
  }, [previews])

  const renderRow = (ref: React.RefObject<HTMLDivElement | null>, reverse: boolean) => (
    <div className="ticker py-2" aria-hidden="true">
      <div ref={ref} className="inline-flex" style={{ willChange: 'transform' }}>
        {[0, 1].map((dup) => (
          <div key={dup} className="inline-flex gap-16 pr-16 shrink-0">
            {items.map((cap) => (
              <span
                key={`${dup}-${cap}`}
                data-preview={previews[cap] || undefined}
                className="heading-xl !text-[7vw] md:!text-[8vw] font-bold text-[var(--text-primary)] opacity-[0.15] whitespace-nowrap hover:opacity-40 transition-opacity cursor-default"
              >
                {cap}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="relative">
      {renderRow(rowA, false)}
      {renderRow(rowB, true)}
      <div
        ref={portalRef}
        className="fixed top-0 left-0 z-[100] w-64 aspect-video rounded overflow-hidden opacity-0 scale-90 pointer-events-none"
        aria-hidden="true"
      >
        <video ref={videoRef} muted loop playsInline className="h-full w-full object-cover" />
      </div>
    </div>
  )
}

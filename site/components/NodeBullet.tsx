'use client'

import { useEffect, useRef, useState } from 'react'

interface NodeBulletProps {
  /** Stagger position — delays the draw animation by index × 100ms. */
  index?: number
  className?: string
}

/**
 * Tech-styled node indicator (crosshair + center node) that draws itself
 * via stroke-dashoffset animation when scrolled into view. Replaces the
 * legacy "—" list bullets. Uses normalized pathLength so dash math is
 * unit-free; transitions are instant for reduced-motion users (handled
 * by the global reduced-motion CSS rule).
 */
export default function NodeBullet({ index = 0, className = '' }: NodeBulletProps) {
  const ref = useRef<SVGSVGElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const stroke = {
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: shown ? 0 : 1,
    transition: 'stroke-dashoffset 0.4s ease-in-out',
    transitionDelay: `${index * 0.1}s`,
  } as const

  return (
    <svg
      ref={ref}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 mt-0.5 ${className}`}
    >
      <line x1="3" y1="10" x2="17" y2="10" stroke="var(--accent)" strokeWidth="1" style={stroke} />
      <line x1="10" y1="3" x2="10" y2="17" stroke="var(--accent)" strokeWidth="1" style={stroke} />
      <circle cx="10" cy="10" r="2.5" stroke="var(--accent)" strokeWidth="1" style={stroke} />
    </svg>
  )
}

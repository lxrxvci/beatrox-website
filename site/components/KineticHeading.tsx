'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

interface KineticHeadingProps {
  text: string
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  /** Seconds to wait before the reveal starts (e.g. let hero video begin). */
  delay?: number
  /** Per-character stagger in seconds. */
  stagger?: number
}

/**
 * Staggered fluid character reveal using GSAP SplitText.
 * Each character slides up from behind an overflow mask.
 * Falls back to instantly-visible text for reduced-motion users.
 */
export default function KineticHeading({
  text,
  as: Tag = 'h1',
  className = '',
  delay = 0.3,
  stagger = 0.03,
}: KineticHeadingProps) {
  const ref = useRef<HTMLHeadingElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setReady(true)
      return
    }

    const split = new SplitText(el, { type: 'chars,words', mask: 'chars' })

    const ctx = gsap.context(() => {
      gsap.from(split.chars, {
        yPercent: 120,
        opacity: 0,
        duration: 0.8,
        ease: 'power4.out',
        stagger,
        delay,
        onStart: () => setReady(true),
      })
    }, el)

    return () => {
      ctx.revert()
      split.revert()
    }
  }, [text, delay, stagger])

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={`kinetic-heading${ready ? ' is-ready' : ''}${className ? ` ${className}` : ''}`}
    >
      {text}
    </Tag>
  )
}

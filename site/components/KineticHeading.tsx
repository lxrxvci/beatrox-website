'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

/** Hero reveal variants used by per-project themes. 'rise' is the legacy behavior. */
export type KineticIntro = 'laser-draw' | 'glitch' | 'iris' | 'wipe' | 'rise'

interface KineticHeadingProps {
  text: string
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  /** Seconds to wait before the reveal starts (e.g. let hero video begin). */
  delay?: number
  /** Per-character stagger in seconds. */
  stagger?: number
  /** Reveal choreography. Defaults to 'rise' (the original masked char slide). */
  intro?: KineticIntro
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
  intro = 'rise',
}: KineticHeadingProps) {
  const ref = useRef<HTMLHeadingElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let cancelled = false
    let ctx: gsap.Context | undefined
    let split: SplitText | undefined

    const run = () => {
      if (cancelled) return

      // Long single words ("PRE-VISUALIZATION", "DISENCHANTMENT") are kept
      // unbreakable below, so they would clip at narrow viewports. Measure
      // the longest word (once, before splitting) and shrink the heading
      // until that word fits the container.
      el.style.fontSize = ''
      const longest = text.split(/\s+/).reduce((a, b) => (b.length > a.length ? b : a), '')
      const styles = window.getComputedStyle(el)
      const baseSize = parseFloat(styles.fontSize)
      const context = document.createElement('canvas').getContext('2d')
      if (longest && context && Number.isFinite(baseSize) && el.clientWidth > 0) {
        context.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`
        // Uppercase is the worst (widest) case for text-transform headings.
        const sample = longest.toUpperCase()
        const letterSpacing = parseFloat(styles.letterSpacing) || 0
        const wordWidth =
          context.measureText(sample).width + letterSpacing * Math.max(0, sample.length - 1)
        if (wordWidth > el.clientWidth) {
          el.style.fontSize = `${Math.max(24, Math.floor(baseSize * (el.clientWidth / wordWidth)))}px`
        }
      }

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setReady(true)
        return
      }

      const splitInstance = new SplitText(el, { type: 'chars,words', mask: 'chars' })
      split = splitInstance

      // Keep each word atomic so the browser never breaks mid-word
      // (e.g. "CONSULTATIO|N"), wrapping happens between words only.
      splitInstance.words.forEach((word) => {
        const w = word as HTMLElement
        w.style.display = 'inline-block'
        w.style.whiteSpace = 'nowrap'
      })

      ctx = gsap.context(() => {
        const onStart = () => setReady(true)
        switch (intro) {
          case 'wipe':
            // Whole words slide up behind their masks, left to right.
            gsap.from(splitInstance.words, {
              yPercent: 110,
              duration: 0.9,
              ease: 'power4.out',
              stagger: 0.09,
              delay,
              onStart,
            })
            break
          case 'iris':
            // Chars bloom outward from the center of the heading.
            gsap.from(splitInstance.chars, {
              opacity: 0,
              scale: 0.3,
              duration: 0.7,
              ease: 'back.out(1.6)',
              stagger: { each: stagger, from: 'center' },
              delay,
              onStart,
            })
            break
          case 'glitch':
            // Signal-noise reveal: chars jitter in from random offsets.
            gsap.from(splitInstance.chars, {
              opacity: 0,
              xPercent: () => gsap.utils.random(-50, 50),
              skewX: () => gsap.utils.random(-25, 25),
              duration: 0.5,
              ease: 'power3.out',
              stagger: { each: stagger * 0.7, from: 'random' },
              delay,
              onStart,
            })
            break
          case 'laser-draw':
            // Left-to-right burn-in with a bright glow that cools off.
            gsap.from(splitInstance.chars, {
              opacity: 0,
              textShadow: '0 0 26px currentColor',
              duration: 0.45,
              ease: 'power2.out',
              stagger: { each: stagger * 0.9, from: 'start' },
              delay,
              onStart,
            })
            break
          case 'rise':
          default:
            gsap.from(splitInstance.chars, {
              yPercent: 120,
              opacity: 0,
              duration: 0.8,
              ease: 'power4.out',
              stagger,
              delay,
              onStart,
            })
        }
      }, el)
    }

    // Wait for webfonts so the width measurement above uses real metrics.
    if (document.fonts?.ready) {
      document.fonts.ready.then(run)
    } else {
      run()
    }

    return () => {
      cancelled = true
      ctx?.revert()
      split?.revert()
    }
  }, [text, delay, stagger, intro])

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={`kinetic-heading${ready ? ' is-ready' : ''}${className ? ` ${className}` : ''}`}
    >
      {text}
    </Tag>
  )
}

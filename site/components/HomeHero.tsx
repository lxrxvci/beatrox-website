'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import KineticHeading from '@/components/KineticHeading'
import MagneticButton from '@/components/MagneticButton'
import { INTRO_COMPLETE_EVENT, shouldRunIntro } from '@/components/intro/intro-storage'

interface HomeHeroProps {
  headline?: string
  subheadline?: string
  cta?: { label: string; url: string }
  secondaryCta?: { label: string; url: string }
  /**
   * When set, the entrance sequence waits for the intro overlay's
   * `intro:complete` event (fired as the dissolve begins) instead of
   * starting on mount. Repeat visits / reduced-motion / `?intro=0` resolve
   * immediately, so behavior is identical to today; a 10s fallback
   * guarantees the hero always appears even if the intro never runs.
   */
  introControlled?: boolean
}

/** Hard cap on how long the hero waits for the intro (plan §3.2). */
const INTRO_FALLBACK_MS = 10_000

/**
 * Homepage hero content with the staggered entrance sequence from the
 * redesign spec: overline (0.1s) → kinetic headline (0.3s) → body (0.8s)
 * → CTAs (1.2s). Copy comes from the resolved CMS homepage; the defaults
 * below are the original hardcoded strings used when CMS fields are empty.
 */
export default function HomeHero({
  headline = 'Building Unforgettable Worlds',
  subheadline = 'Laser. Drone. Code. Canvas. We engineer moments that defy expectation.',
  cta = { label: 'See Our Work', url: '/work' },
  secondaryCta = { label: 'Book a Consultation', url: '/book' },
  introControlled = false,
}: HomeHeroProps) {
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!introControlled || !shouldRunIntro()) {
      setStarted(true)
      return
    }
    const onComplete = () => setStarted(true)
    window.addEventListener(INTRO_COMPLETE_EVENT, onComplete)
    const fallback = window.setTimeout(onComplete, INTRO_FALLBACK_MS)
    return () => {
      window.removeEventListener(INTRO_COMPLETE_EVENT, onComplete)
      window.clearTimeout(fallback)
    }
  }, [introControlled])

  const active = !introControlled || started

  return (
    <div className="relative max-w-[1120px] mx-auto w-full pb-6 lg:pb-10">
      <motion.p
        className="overline mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        Experiential Design &amp; Production
      </motion.p>

      {active ? (
        <KineticHeading
          text={headline}
          className="heading-xl max-w-[12ch] mb-8 max-[480px]:text-[2.6rem]"
          delay={0.3}
        />
      ) : (
        /* Keeps the h1 in the SSR HTML (SEO) while the intro owns the
           screen; swapped for the animated KineticHeading on intro:complete
           (or immediately on repeat visits — no visual difference, both
           start hidden). */
        <h1 className="heading-xl max-w-[12ch] mb-8 uppercase opacity-0 max-[480px]:text-[2.6rem]">
          {headline}
        </h1>
      )}

      <motion.p
        className="text-lg text-white max-w-[48ch] mb-10 leading-relaxed"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        {subheadline}
      </motion.p>

      <motion.div
        className="flex flex-wrap gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <MagneticButton href={cta.url}>{cta.label}</MagneticButton>
        <MagneticButton href={secondaryCta.url} variant="accent">
          {secondaryCta.label}
        </MagneticButton>
      </motion.div>
    </div>
  )
}

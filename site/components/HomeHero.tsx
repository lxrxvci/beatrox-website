'use client'

import { motion } from 'motion/react'
import KineticHeading from '@/components/KineticHeading'
import MagneticButton from '@/components/MagneticButton'

interface HomeHeroProps {
  headline?: string
  subheadline?: string
  cta?: { label: string; url: string }
  secondaryCta?: { label: string; url: string }
}

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
}: HomeHeroProps) {
  return (
    <div className="relative max-w-[1120px] mx-auto w-full pb-6 lg:pb-10">
      <motion.p
        className="overline mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        Experiential Design &amp; Production
      </motion.p>

      <KineticHeading
        text={headline}
        className="heading-xl max-w-[12ch] mb-8 max-[480px]:text-[2.6rem]"
        delay={0.3}
      />

      <motion.p
        className="text-lg text-[var(--text-secondary)] max-w-[48ch] mb-10 leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        {subheadline}
      </motion.p>

      <motion.div
        className="flex flex-wrap gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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

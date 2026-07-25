'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import KineticHeading from '@/components/KineticHeading'

interface ParallaxHeroProps {
  imageSrc: string
  imageAlt: string
  eyebrow?: string
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  ctaHref?: string
  ctaLabel?: string
  minHeightClass?: string
}

export default function ParallaxHero({
  imageSrc,
  imageAlt,
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  ctaHref,
  ctaLabel,
  minHeightClass = 'min-h-[90svh]',
}: ParallaxHeroProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => setOffset(Math.min(window.scrollY * 0.16, 64))
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section className={`relative overflow-hidden border-b border-white/10 hero ${minHeightClass} flex items-end`}>
      {/* z-0 scopes the scanline/vignette pseudo-overlays (z-index 1) below
          the hero copy, so they texture the photo without veiling text. */}
      <div className="scanlines vignette absolute inset-0 z-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover scale-[1.06] will-change-transform"
          style={{ transform: `translate3d(0, ${offset}px, 0) scale(1.06)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/92" />
      </div>

      <div className="relative max-w-[1400px] mx-auto w-full">
        {backHref && backLabel && (
          <Link href={backHref} className="mono text-white/60 hover:text-white transition-colors mb-8 inline-block">
            {backLabel}
          </Link>
        )}
        {eyebrow && (
          <motion.p
            className="overline mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {eyebrow}
          </motion.p>
        )}
        <KineticHeading text={title} className="heading-xl max-w-4xl" delay={0.3} />
        {description && (
          <motion.p
            className="text-base text-[var(--text-secondary)] mt-6 max-w-2xl leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {description}
          </motion.p>
        )}
        {ctaHref && ctaLabel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href={ctaHref} className="btn-primary mt-10 inline-block">
              {ctaLabel}
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}

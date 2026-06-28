'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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
    <section className={`relative overflow-hidden border-b border-white/10 px-6 lg:px-10 pt-24 pb-14 ${minHeightClass} flex items-end`}>
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover scale-[1.06] will-change-transform"
          style={{ transform: `translate3d(0, ${offset}px, 0) scale(1.06)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/92" />
      </div>

      <div className="relative max-w-[1400px] mx-auto w-full">
        {backHref && backLabel && (
          <Link href={backHref} className="text-[0.65rem] tracking-[0.2em] uppercase text-white/35 hover:text-white transition-colors mb-8 inline-block">
            {backLabel}
          </Link>
        )}
        {eyebrow && <p className="heading-sm text-white/35 mb-4">{eyebrow}</p>}
        <h1 className="heading-xl max-w-4xl">{title}</h1>
        {description && <p className="text-sm text-white/60 mt-6 max-w-2xl leading-relaxed">{description}</p>}
        {ctaHref && ctaLabel && (
          <Link href={ctaHref} className="btn-primary mt-10 inline-block">
            {ctaLabel}
          </Link>
        )}
      </div>
    </section>
  )
}

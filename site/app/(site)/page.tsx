import type { Metadata } from 'next'
import { getHomepageResolved } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import HeroMedia from '@/components/HeroMedia'
import HomeHero from '@/components/HomeHero'
import Marquee from '@/components/Marquee'
import AboutTeaser from '@/components/home/AboutTeaser'
import ServicesTeaser from '@/components/home/ServicesTeaser'
import WorkTeaser from '@/components/home/WorkTeaser'
import RentalsTeaser from '@/components/home/RentalsTeaser'
import TeamTeaser from '@/components/home/TeamTeaser'
import ContactSection from '@/components/home/ContactSection'
import IntroGate from '@/components/intro/IntroGate'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const data = await getHomepageResolved()
  return seoToMetadata(data.seo, '/')
}

export default async function HomePage() {
  const data = await getHomepageResolved()
  const heroImage = data.media.heroImage || '/og-default.jpg'
  const galleryImages = data.media.galleryImages || []

  // Resolved CMS hero copy; HomeHero falls back to its original hardcoded
  // strings when a field is empty.
  const heroProps = {
    headline: data.hero.headline || undefined,
    subheadline: data.hero.subheadline || undefined,
    cta: data.hero.cta.label && data.hero.cta.url ? data.hero.cta : undefined,
    secondaryCta:
      data.hero.secondaryCta.label && data.hero.secondaryCta.url ? data.hero.secondaryCta : undefined,
  }

  return (
    <>
      {/* First-visit intro overlay — client-gated, zero SSR; nothing renders
          for repeat visits, reduced-motion users, or crawlers. */}
      <IntroGate
        heroImage={heroImage}
        headline={data.hero.headline || 'Building Unforgettable Worlds'}
        // Same fallback strings HomeHero applies — the intro's beat-3
        // match-frame must reproduce the real hero's exact final layout.
        subheadline={
          data.hero.subheadline ||
          'Laser. Drone. Code. Canvas. We engineer moments that defy expectation.'
        }
        ctaLabel={heroProps.cta?.label || 'See Our Work'}
        secondaryCtaLabel={heroProps.secondaryCta?.label || 'Book a Consultation'}
        galleryImages={galleryImages.slice(0, 3)}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex flex-col justify-end hero overflow-hidden bg-black border-b border-white/10">
        <HeroMedia imageSrc={heroImage} imageAlt="BEATROX hero media" />
        <HomeHero {...heroProps} introControlled />
      </section>

      {/* ── Continuous-scroll teaser panels ──────────────────────────────── */}
      <AboutTeaser />
      <ServicesTeaser />
      <WorkTeaser />

      {/* ── Infinite Marquee ──────────────────────────────────────────────── */}
      {galleryImages.length > 0 && (
        <Marquee
          // No per-image project metadata exists for the home gallery, so use
          // one descriptive alt; Marquee's duplicated track is aria-hidden.
          items={galleryImages.slice(0, 8).map((img) => ({ src: img, alt: 'BEATROX live event production installation' }))}
        />
      )}

      <RentalsTeaser />
      <TeamTeaser />
      <ContactSection />
    </>
  )
}

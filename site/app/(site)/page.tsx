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
import { MONTAGE_IMAGES } from '@/components/intro/montage-images'
import JsonLd from '@/components/JsonLd'
import { buildLocalBusinessSchema } from '@/lib/schema'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const data = await getHomepageResolved()
  return seoToMetadata(data.seo, '/')
}

export default async function HomePage({ preview = false }: { preview?: boolean }) {
  const data = await getHomepageResolved(preview)
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
      {/* Single source of entity truth: full LocalBusiness with stable @id
          on the homepage only; other pages reference it by @id (OP-07/08). */}
      <JsonLd data={buildLocalBusinessSchema()} />

      {/* First-visit intro overlay, client-gated, zero SSR; nothing renders
          for repeat visits, reduced-motion users, or crawlers. */}
      <IntroGate
        heroImage={heroImage}
        headline={data.hero.headline || 'Beatrox Experiential and Event Production'}
        // Same fallback strings HomeHero applies, the intro's beat-3
        // match-frame must reproduce the real hero's exact final layout.
        subheadline={
          data.hero.subheadline ||
          'Laser. Drone. Code. Canvas. We engineer moments that defy expectation.'
        }
        ctaLabel={heroProps.cta?.label || 'See Our Work'}
        secondaryCtaLabel={heroProps.secondaryCta?.label || 'Book a Consultation'}
        // Category-matched work images for the montage streaks, NOT the
        // homepage gallery pool (client feedback). Mobile uses the first 3.
        galleryImages={[...MONTAGE_IMAGES]}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex flex-col justify-end hero overflow-hidden bg-black border-b border-white/10">
        <HeroMedia imageSrc={heroImage} imageAlt="BEATROX hero media" />
        <HomeHero {...heroProps} introControlled />
      </section>

      {/* ── Positioning intro (OP-23: what, who, why trust). Global brand
          framing per client direction 2026-08-07: Beatrox is not hyper-local;
          Portland hyper-local SEO lives on rentals.beatrox.com. ──────────── */}
      <section className="section border-b border-white/10 py-12 lg:py-20">
        <div className="max-w-[1120px] mx-auto">
          <p className="overline mb-4">Based in Portland, producing worldwide</p>
          <h2 className="heading-lg mb-6 max-w-3xl">
            One team from first sketch to final strike
          </h2>
          <div className="max-w-3xl space-y-5">
            <p className="text-base text-white leading-relaxed">
              Beatrox is an experiential design and event production company. From our
              Portland, Oregon studio we design, fabricate, and deploy productions for
              agencies, brands, and venues across the United States and around the world.
            </p>
            <p className="text-base text-white leading-relaxed">
              Every technical layer stays in house: LED video walls, drone light shows,
              laser shows, projection mapping, custom fabrication, lighting, and audio.
              One accountable partner, whether the build is a one-night brand activation
              or a permanent installation engineered for years of daily operation.
            </p>
            <p className="text-base text-white leading-relaxed">
              Our crew has deployed projection mapping on the Empire State Building,
              built an AR mirror for Adidas at Super Bowl 2020, and produced immersive
              brand environments for Netflix at Comic-Con.
            </p>
          </div>
        </div>
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

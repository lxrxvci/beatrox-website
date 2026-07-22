import type { Metadata } from 'next'
import Link from 'next/link'
import { getServicesIndex } from '@/lib/json-content'
import { getAllServicesResolved, getCMSPageBySlug } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import ParallaxHero from '@/components/ParallaxHero'
import CapabilitiesGrid, { type CapabilityItem } from '@/components/CapabilitiesGrid'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return seoToMetadata(getServicesIndex().seo)
}

export default async function ServicesPage() {
  const services = await getAllServicesResolved()
  const servicesHero = services[0]?.media?.heroImage || '/og-default.jpg'

  // The capabilities tile grid is driven by the About page's capabilitiesGrid
  // CMS block (edited inline there), so one data source feeds both pages.
  // Only items the owner has enriched (image or link set) render as tiles —
  // the seeded 32-label service vocabulary is for the text list, so without
  // enrichment the grid falls back to the curated default tiles.
  const aboutPage = await getCMSPageBySlug('about')
  const capabilitiesBlock = aboutPage?.blocks?.find((b) => b.blockType === 'capabilitiesGrid')
  const capabilityItems: CapabilityItem[] | undefined = capabilitiesBlock?.items
    ?.filter((item) => Boolean(item.label) && (item.image || item.link))
    .map((item) => ({
      label: item.label as string,
      image: item.image,
      link: item.link,
      textPosition: item.textPosition,
    }))

  const tiles = capabilityItems && capabilityItems.length > 0 ? capabilityItems : undefined

  return (
    <>
      <ParallaxHero
        imageSrc={servicesHero}
        imageAlt="Services hero media"
        eyebrow="What We Offer"
        title="What We Do"
        description="Full-spectrum experiential production. From the first sketch to the final strike."
        minHeightClass="min-h-[94svh]"
      />

      {/* Capabilities image grid (swapped from the About page — title stays here) */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="heading-lg mb-10">Our Services</h2>
          <CapabilitiesGrid items={tiles} />
        </div>
      </section>

      {/* Consultation CTA */}
      <section className="section text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="heading-lg mb-5">Book a <span className="text-[var(--accent)]">Consultation</span></h2>
          <p className="text-base text-white/70 leading-relaxed mb-10">
            Our team of technical and creative directors can help you with your project.
            We specialize in bringing unique and bespoke ideas to life. We know that every project
            is different and we can tailor a custom solution that works for you and your budget.
            Book a discovery call and get professional advice today.
          </p>
          <Link href="/book" className="btn-primary btn-primary--accent">Book a Discovery Call</Link>
        </div>
      </section>
    </>
  )
}

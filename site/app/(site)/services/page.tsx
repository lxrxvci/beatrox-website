import type { Metadata } from 'next'
import Link from 'next/link'
import { getServicesIndex } from '@/lib/json-content'
import { getAllServicesResolved, getCapabilityTiles, getMediaLibrary } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import ParallaxHero from '@/components/ParallaxHero'
import CapabilitiesGrid from '@/components/CapabilitiesGrid'
import { EditableGalleryGrid } from '@/components/admin'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return seoToMetadata(getServicesIndex().seo)
}

export default async function ServicesPage() {
  const services = await getAllServicesResolved()
  const servicesHero = services[0]?.media?.heroImage || '/og-default.jpg'

  // Tiles come from the capability-tiles global — inline-editable right on
  // this page (image, link, text placement, order). Empty global → curated
  // defaults from lib/capabilities.
  const [tiles, mediaLibrary] = await Promise.all([getCapabilityTiles(), getMediaLibrary()])
  const tileItems = tiles.length > 0 ? tiles : undefined

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
          <EditableGalleryGrid
            globalSlug="capability-tiles"
            fieldPath="items"
            items={tileItems ?? []}
            mediaLibrary={mediaLibrary}
          >
            <CapabilitiesGrid items={tileItems} />
          </EditableGalleryGrid>
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

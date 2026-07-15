import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getServicesIndex } from '@/lib/json-content'
import { getAllServicesResolved } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import ParallaxHero from '@/components/ParallaxHero'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return seoToMetadata(getServicesIndex().seo)
}

const CATEGORIES = [
  {
    label: 'Design',
    items: [
      { label: 'Environmental Design', slug: 'environmental-design' },
      { label: 'Lighting Design', slug: 'lighting-design' },
      { label: 'Pre-Visualization', slug: 'pre-visualization' },
      { label: '3D Animation and Motion Capture', slug: '3d-animation-motion-capture' },
      { label: 'Realtime Content (AR, VR, XR)', slug: 'realtime-content-ar-vr-xr' },
      { label: 'Audio, Video, and Lighting Content Design', slug: 'av-content-design' },
      { label: 'Consultation and System Design', slug: 'consultation-system-design' },
      { label: 'Interactive UI / UX Design', slug: 'interactive-ui-ux-design' },
    ],
  },
  {
    label: 'Build',
    items: [
      { label: 'Custom Fabrication', slug: 'custom-fabrication' },
      { label: 'Set and Scenic Assembly', slug: 'set-scenic-assembly' },
      { label: 'Staging and Rigging', slug: 'staging-rigging' },
      { label: 'Lighting Integration', slug: 'lighting-integration' },
      { label: 'Trade and Convention Booths', slug: 'trade-convention-booths' },
      { label: 'Permanent Installation', slug: 'permanent-installation' },
      { label: 'CNC Machining', slug: 'cnc-machining' },
      { label: 'Materials Sourcing and Selection', slug: 'materials-sourcing-selection' },
    ],
  },
  {
    label: 'Technical',
    items: [
      { label: 'Technical Direction', slug: 'technical-direction' },
      { label: 'Drafting and Detail Drawings', slug: 'drafting-detail-drawings' },
      { label: 'Engineering Certification', slug: 'engineering-certification' },
      { label: 'Software Development', slug: 'software-development' },
      { label: 'Site and Floor Plans', slug: 'site-floor-plans' },
      { label: 'Technical Documentation', slug: 'technical-documentation' },
      { label: 'Media Server and Playback Solutions', slug: 'media-server-playback-solutions' },
      { label: 'AV System Integration', slug: 'av-system-integration' },
    ],
  },
  {
    label: 'Production',
    items: [
      { label: 'Event Planning and Logistics', slug: 'event-planning-logistics' },
      { label: 'AV Equipment Sourcing and Rentals', slug: 'av-equipment-sourcing-rentals' },
      { label: 'Tour Management', slug: 'tour-management' },
      { label: 'Production Management', slug: 'production-management' },
      { label: 'Labor Hire Roles: TD, PM, A1 A2, V1 V2, L1, L2', slug: 'labor-hire-crew-roles' },
      { label: 'Venue Sourcing and Booking', slug: 'venue-sourcing-booking' },
      { label: 'Permit Submittal', slug: 'permit-submittal' },
      { label: 'System Maintenance and Support', slug: 'system-maintenance-support' },
    ],
  },
]

// Original rental & specialty services — keep the card grid scoped to these
const RENTAL_SPECIALTY_SLUGS = [
  'backline-stage-rental', 'dj-equipment-rentals', 'drone-light-shows', 'event-production',
  'laser-shows', 'led-video-wall-rentals', 'lighting-services', 'sound-equipment-rentals',
]

export default async function ServicesPage() {
  const services = await getAllServicesResolved()
  const servicesHero = services[0]?.media?.heroImage || '/og-default.jpg'
  const rentalSpecialty = RENTAL_SPECIALTY_SLUGS
    .map(slug => services.find(s => s.slug === `/services/${slug}`))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))

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

      {/* 4-Category Grid */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1120px] mx-auto">
          <h2 className="heading-lg mb-10">Our Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {CATEGORIES.map(cat => (
              <div key={cat.label}>
                <h2 className="heading-sm text-white mb-6 pb-4 border-b border-white/10">{cat.label}</h2>
                <ul className="space-y-3">
                  {cat.items.map(item => (
                    <li key={item.slug}>
                      <Link
                        href={`/services/${item.slug}`}
                        className="text-sm text-white/75 leading-relaxed hover:text-white transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Service Cards */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1120px] mx-auto">
          <h2 className="heading-lg mb-10">Rental & Specialty Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
            {rentalSpecialty.map((service) => {
              const slug = service.slug.replace(/^\/services\/+/, '')
              return (
                <Link
                  key={slug}
                  href={`/services/${slug}`}
                  className="relative bg-black p-7 md:p-8 group hover:bg-white/5 transition-colors block min-h-[18rem] overflow-hidden"
                >
                  {service.media?.heroImage && (
                    <Image
                      src={service.media.heroImage}
                      alt={`${service.title} media`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 25vw"
                      className="object-cover opacity-35 group-hover:opacity-45 transition-opacity duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
                  <div className="relative">
                  <p className="heading-sm text-white mb-3 group-hover:text-white transition-colors">
                    {service.title}
                  </p>
                  <p className="text-sm text-white/70 tracking-widest uppercase mb-4">
                    {service.category}
                  </p>
                  <p className="text-base text-white/75 leading-relaxed line-clamp-3">
                    {service.hero.subheadline}
                  </p>
                  <span className="inline-block mt-5 text-sm tracking-[0.14em] uppercase text-white/75 group-hover:text-white transition-colors">
                    Learn more →
                  </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Consultation CTA */}
      <section className="section text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="heading-lg mb-5">Book a Consultation</h2>
          <p className="text-base text-white/70 leading-relaxed mb-10">
            Our team of technical and creative directors can help you with your project.
            We specialize in bringing unique and bespoke ideas to life. We know that every project
            is different and we can tailor a custom solution that works for you and your budget.
            Book a discovery call and get professional advice today.
          </p>
          <Link href="/book" className="btn-primary">Book a Discovery Call</Link>
        </div>
      </section>
    </>
  )
}

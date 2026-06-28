import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getAllServices, getServiceSlugs, getServicesIndex } from '@/lib/json-content'
import { seoToMetadata } from '@/lib/metadata'
import ParallaxHero from '@/components/ParallaxHero'

export async function generateMetadata(): Promise<Metadata> {
  return seoToMetadata(getServicesIndex().seo)
}

const CATEGORIES = [
  {
    label: 'Design',
    items: [
      'Environmental Design', 'Lighting Design', 'Pre-Visualization',
      '3D Animation and Motion Capture', 'Realtime Content (AR, VR, XR)',
      'Audio, Video, and Lighting Content Design', 'Consultation and System Design',
      'Interactive UI / UX Design',
    ],
  },
  {
    label: 'Build',
    items: [
      'Custom Fabrication', 'Set and Scenic Assembly', 'Staging and Rigging',
      'Lighting Integration', 'Trade and Convention Booths', 'Permanent Installation',
      'CNC Machining', 'Materials Sourcing and Selection',
    ],
  },
  {
    label: 'Technical',
    items: [
      'Technical Direction', 'Drafting and Detail Drawings', 'Engineering Certification',
      'Software Development', 'Site and Floor Plans', 'Technical Documentation',
      'Media Server and Playback Solutions', 'AV System Integration',
    ],
  },
  {
    label: 'Production',
    items: [
      'Event Planning and Logistics', 'AV Equipment Sourcing and Rentals', 'Tour Management',
      'Production Management', 'Labor Hire Roles: TD, PM, A1 A2, V1 V2, L1, L2',
      'Venue Sourcing and Booking', 'Permit Submittal', 'System Maintenance and Support',
    ],
  },
]

export default function ServicesPage() {
  const services = getAllServices()
  const slugs = getServiceSlugs()
  const servicesHero = services[0]?.media?.heroImage || '/og-default.jpg'

  return (
    <>
      <ParallaxHero
        imageSrc={servicesHero}
        imageAlt="Services hero media"
        eyebrow="What We Offer"
        title="Services"
        description="We offer the full spectrum of experiential event design and production services."
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
                    <li key={item} className="text-xs text-white/60 leading-relaxed">{item}</li>
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
            {slugs.map((slug, i) => {
              const service = services[i]
              if (!service) return null
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
                  <p className="text-[0.65rem] text-white/30 tracking-widest uppercase mb-4">
                    {service.category}
                  </p>
                  <p className="text-xs text-white/50 leading-relaxed line-clamp-3">
                    {service.hero.subheadline}
                  </p>
                  <span className="inline-block mt-4 text-[0.65rem] tracking-[0.15em] uppercase text-white/30 group-hover:text-white transition-colors">
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
          <h2 className="heading-lg mb-4">Book a Consultation</h2>
          <p className="text-sm text-white/50 leading-relaxed mb-10">
            Our team of technical and creative directors can help you with your project.
            We specialize in bringing unique and bespoke ideas to life. We know that every project
            is different and we can tailor a custom solution that works for you and your budget.
            Book a discovery call and get professional advice today.
          </p>
          <Link href="/contact" className="btn-primary">Book a Discovery Call</Link>
        </div>
      </section>
    </>
  )
}

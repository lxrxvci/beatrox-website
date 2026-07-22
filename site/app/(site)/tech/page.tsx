import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllServicesResolved } from '@/lib/content'
import ParallaxHero from '@/components/ParallaxHero'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Tech Capabilities',
  description:
    'The technical capabilities behind Beatrox productions — design, build, technical, and production expertise for experiential environments.',
}

// Fixed category order mirrors the About "Tech Capabilities" grouping.
const CATEGORY_ORDER = ['Design', 'Build', 'Technical', 'Production']

export default async function TechIndexPage() {
  const services = await getAllServicesResolved()
  const techServices = services.filter((service) => service.pageType === 'tech')
  const heroImage = techServices[0]?.media?.heroImage || '/og-default.jpg'

  const categories = CATEGORY_ORDER.map((label) => ({
    label,
    items: techServices.filter((service) => service.category === label),
  })).filter((cat) => cat.items.length > 0)

  // Any tech doc with an unrecognized category still renders, appended last.
  const known = new Set(CATEGORY_ORDER)
  const extra = techServices.filter((service) => !known.has(service.category))
  if (extra.length > 0) categories.push({ label: 'More', items: extra })

  return (
    <>
      <ParallaxHero
        imageSrc={heroImage}
        imageAlt="Tech capabilities hero media"
        eyebrow="What We Build With"
        title="Tech Capabilities"
        description="The design, build, technical, and production capabilities behind every Beatrox environment."
        minHeightClass="min-h-[94svh]"
      />

      {/* Tech capability link grid — visual style mirrors the About/services link grid */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {categories.map((cat) => (
              <div key={cat.label}>
                <h3 className="overline mb-6 pb-4 border-b border-white/10">{cat.label}</h3>
                <ul className="space-y-3">
                  {cat.items.map((service) => {
                    const slug = service.slug.replace(/^\/(services|tech)\/+/, '')
                    return (
                      <li key={slug}>
                        <Link
                          href={`/tech/${slug}`}
                          className="group flex items-baseline gap-2.5 text-sm text-white/75 leading-relaxed hover:text-white transition-colors"
                        >
                          <span
                            aria-hidden="true"
                            className="text-[var(--accent)] opacity-40 md:opacity-0 md:-translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
                          >
                            →
                          </span>
                          <span>{service.title}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation CTA */}
      <section className="section text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="heading-lg mb-5">Book a <span className="text-[var(--accent)]">Consultation</span></h2>
          <p className="text-base text-white/70 leading-relaxed mb-10">
            Our team of technical and creative directors can help you with your project.
            Book a discovery call and get professional advice today.
          </p>
          <Link href="/book" className="btn-primary btn-primary--accent">Book a Discovery Call</Link>
        </div>
      </section>
    </>
  )
}

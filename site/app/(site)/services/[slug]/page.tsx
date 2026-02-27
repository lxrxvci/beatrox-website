import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getServiceResolved, getServiceSlugsResolved } from '@/lib/content'
import ParallaxHero from '@/components/ParallaxHero'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return (await getServiceSlugsResolved()).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = await getServiceResolved(slug)
  if (!service) return {}
  return {
    title: service.seo.title,
    description: service.seo.description,
    openGraph: {
      title: service.seo.og.title,
      description: service.seo.og.description,
      images: [service.seo.og.image],
    },
  }
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params
  const service = await getServiceResolved(slug)
  if (!service) notFound()
  const heroImage = service.media?.heroImage || '/og-default.jpg'
  const gallery = service.media?.galleryImages || []
  const inlineMedia = gallery.filter((img) => img && img !== heroImage)

  return (
    <>
      <ParallaxHero
        imageSrc={heroImage}
        imageAlt={`${service.title} hero`}
        backHref="/services"
        backLabel="← Services"
        eyebrow={service.category}
        title={service.title}
        description={service.hero.subheadline}
        ctaHref="/contact"
        ctaLabel={service.hero.cta.label}
        minHeightClass="min-h-[92svh]"
      />

      {/* Capabilities */}
      <section className="border-b border-white/10 px-6 lg:px-10 py-16 lg:py-24">
        <div className="max-w-[1120px] mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12 lg:gap-16">
          <div>
            <h2 className="heading-sm text-white/30 mb-6">Capabilities</h2>
            <ul className="space-y-3">
              {service.capabilities.map(cap => (
                <li key={cap} className="flex items-start gap-3 text-sm text-white/70">
                  <span className="text-white/20 mt-1">—</span>
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Body blocks */}
          <div className="space-y-14">
            {service.body.map((block, i) => (
              <article key={i} className="space-y-8">
                <div>
                  {block.heading && (
                    <h2 className="heading-sm text-white/40 mb-4">{block.heading}</h2>
                  )}
                  {block.content && (
                    <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
                      {block.content}
                    </p>
                  )}
                  {block.items && (
                    <ul className="space-y-2 mt-2">
                      {block.items.map(item => (
                        <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                          <span className="text-white/20 mt-1">—</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {inlineMedia[i] && (
                  <div className="relative w-full h-[40vh] md:h-[62vh] bg-black border border-white/10 overflow-hidden">
                    <Image
                      src={inlineMedia[i]}
                      alt={`${service.title} image ${i + 1}`}
                      fill
                      sizes="100vw"
                      className="object-contain"
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Related Work */}
      {service.relatedWork && service.relatedWork.length > 0 && (
        <section className="section border-b border-white/10">
          <div className="max-w-[1400px] mx-auto">
            <h2 className="heading-sm text-white/30 mb-8">Related Work</h2>
            <div className="flex flex-wrap gap-4">
              {service.relatedWork.map((work) => (
                <Link key={work.slug} href={work.slug} className="btn-ghost">
                  {work.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-4">Ready to get started?</h2>
          <p className="text-sm text-white/50 mb-8">Book a discovery call and get professional advice today.</p>
          <Link href="/contact" className="btn-primary">Get in Touch</Link>
        </div>
      </section>
    </>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getService, getServiceSlugs } from '@/lib/json-content'
import { seoToMetadata } from '@/lib/metadata'
import JsonLd from '@/components/JsonLd'
import { buildServiceSchema } from '@/lib/schema'
import ParallaxHero from '@/components/ParallaxHero'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getServiceSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return {}
  return seoToMetadata(service.seo)
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params
  const service = getService(slug)
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
      <section className="section border-b border-white/10">
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
                  {block.type === 'trust' && (
                    <div className="border border-white/10 bg-white/[0.03] rounded-sm p-6 md:p-8">
                      {block.heading && (
                        <h2 className="heading-sm text-white/40 mb-6">{block.heading}</h2>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {block.items?.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm text-white/75">
                            <span className="text-white/30 mt-0.5 shrink-0">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {block.type === 'process' && (
                    <div>
                      {block.heading && (
                        <h2 className="heading-sm text-white/40 mb-6">{block.heading}</h2>
                      )}
                      <ol className="space-y-6">
                        {block.items?.map((item, idx) => (
                          <li key={idx} className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-white/20 text-white/50 text-sm font-semibold rounded-sm">
                              {idx + 1}
                            </span>
                            <span className="text-sm text-white/75 leading-relaxed pt-1.5">{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {block.type === 'faq' && (
                    <div>
                      {block.heading && (
                        <h2 className="heading-sm text-white/40 mb-6">{block.heading}</h2>
                      )}
                      <div className="divide-y divide-white/10">
                        {(block.items as { question: string; answer: string }[])?.map((item, idx) => (
                          <div key={idx} className="py-5 first:pt-0 last:pb-0">
                            <p className="text-sm font-semibold text-white/90 mb-2">{item.question}</p>
                            <p className="text-sm text-white/60 leading-relaxed">{item.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {block.type !== 'trust' && block.type !== 'process' && block.type !== 'faq' && (() => {
                    const bodyBlock = block as { heading?: string; content?: string; items?: string[] }
                    return (
                    <div>
                      {bodyBlock.heading && (
                        <h2 className="heading-sm text-white/40 mb-4">{bodyBlock.heading}</h2>
                      )}
                      {bodyBlock.content && (
                        <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
                          {bodyBlock.content}
                        </p>
                      )}
                      {bodyBlock.items && (
                        <ul className="space-y-2 mt-2">
                          {bodyBlock.items.map(item => (
                            <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                              <span className="text-white/20 mt-1">—</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    )
                  })()}
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
          <p className="text-sm text-white/50 mb-8 leading-relaxed">Book a discovery call and get professional advice today.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="btn-primary">Get in Touch</Link>
            <Link href="/work" className="btn-ghost">View Our Work</Link>
          </div>
        </div>
      </section>
      <JsonLd data={buildServiceSchema(service.title, service.hero.subheadline, service.category)} />
    </>
  )
}

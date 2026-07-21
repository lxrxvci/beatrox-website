import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getAllProjectsResolved, getServiceResolved, getServiceSlugsResolved } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import JsonLd from '@/components/JsonLd'
import { buildServiceSchema } from '@/lib/schema'
import NodeBullet from '@/components/NodeBullet'
import ParallaxHero from '@/components/ParallaxHero'
import CMSBlockRenderer from '@/components/CMSBlockRenderer'
import { EditableText } from '@/components/admin'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getServiceSlugsResolved()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = await getServiceResolved(slug)
  if (!service) return {}
  return seoToMetadata(service.seo)
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params
  const service = await getServiceResolved(slug)
  if (!service) notFound()
  const heroImage = service.media?.heroImage || '/og-default.jpg'
  const gallery = service.media?.galleryImages || []
  const inlineMedia = gallery.filter((img) => img && img !== heroImage)

  // Resolve relatedWork slugs (full paths like "/work/foo") against portfolio projects
  const projects = await getAllProjectsResolved()
  const relatedProjects = (service.relatedWork || [])
    .map((work) => {
      const key = work.slug.replace(/^\/work\/+/, '')
      const project = projects.find((p) => p.canonicalSlug === key)
      return project ? { work, project } : null
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

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
        ctaHref={service.hero.cta.url}
        ctaLabel={service.hero.cta.label}
        minHeightClass="min-h-[92svh]"
      />

      {/* Capabilities */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1120px] mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12 lg:gap-16">
          <div>
            <h2 className="heading-sm text-white/75 mb-6">Capabilities</h2>
            <ul className="space-y-3">
              {service.capabilities.map((cap, i) => (
                <li key={cap} className="flex items-start gap-3 text-base text-white/75">
                  <NodeBullet index={i} />
                  <EditableText collection="services" documentId={service.id} fieldPath={`capabilities.${i}`} value={cap}><span>{cap}</span></EditableText>
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
                        <h2 className="heading-sm text-white/75 mb-6">{block.heading}</h2>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {block.items?.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-base text-white/80">
                            <span className="text-white/60 mt-0.5 shrink-0">✓</span>
                            <EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.items.${idx}`} value={item}><span>{item}</span></EditableText>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {block.type === 'process' && (
                    <div>
                      {block.heading && (
                        <h2 className="heading-sm text-white/75 mb-6">{block.heading}</h2>
                      )}
                      <ol className="space-y-6">
                        {block.items?.map((item, idx) => (
                          <li key={idx} className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-white/30 text-white/80 text-base font-semibold rounded-sm">
                              {idx + 1}
                            </span>
                            <span className="text-base text-white/80 leading-relaxed pt-1"><EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.items.${idx}`} value={item}>{item}</EditableText></span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {block.type === 'faq' && (
                    <div>
                      {block.heading && (
                        <h2 className="heading-sm text-white/75 mb-6">{block.heading}</h2>
                      )}
                      <div className="divide-y divide-white/10">
                        {(block.items as { question: string; answer: string }[])?.map((item, idx) => (
                          <div key={idx} className="py-5 first:pt-0 last:pb-0">
                            <p className="text-base font-semibold text-white mb-2"><EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.items.${idx}.question`} value={item.question}>{item.question}</EditableText></p>
                            <p className="text-base text-white/75 leading-relaxed"><EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.items.${idx}.answer`} value={item.answer}>{item.answer}</EditableText></p>
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
                        <h2 className="heading-sm text-white/75 mb-4"><EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.heading`} value={bodyBlock.heading}>{bodyBlock.heading}</EditableText></h2>
                      )}
                      {bodyBlock.content && (
                        <p className="text-base text-white/80 leading-relaxed whitespace-pre-line">
                          {bodyBlock.content}
                        </p>
                      )}
                      {bodyBlock.items && (
                        <ul className="space-y-2 mt-2">
                          {bodyBlock.items.map((item, itemIndex) => (
                            <li key={item} className="flex items-start gap-3 text-base text-white/75">
                              <NodeBullet index={itemIndex} />
                              <EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.items.${itemIndex}`} value={item}><span>{item}</span></EditableText>
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

      {/* WYSIWYG Content Blocks — only when no legacy body blocks exist (seeded docs carry both; body wins) */}
      {service.body.length === 0 && service.contentBlocks && service.contentBlocks.length > 0 && (
        <CMSBlockRenderer blocks={service.contentBlocks} collection="services" documentId={service.id} />
      )}

      {/* Related Work — example cards cited from past projects */}
      {relatedProjects.length > 0 && (
        <section className="section border-b border-white/10">
          <div className="max-w-[1120px] mx-auto">
            <h2 className="heading-sm text-white/75 mb-8">See It in Action</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px">
              {relatedProjects.map(({ work, project }) => {
                const image = project.images?.[0]?.url
                return (
                  <Link
                    key={work.slug}
                    href={work.slug}
                    className="relative bg-black p-7 md:p-8 group hover:bg-white/5 transition-colors block min-h-[16rem] overflow-hidden border border-white/10"
                  >
                    {image && (
                      <Image
                        src={image}
                        alt={project.images[0].alt || `${project.title} project image`}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
                    <div className="relative">
                      <p className="mono text-[var(--accent)] mb-3">
                        {project.metadata.client}
                      </p>
                      <p className="heading-sm text-white mb-3">{project.title}</p>
                      <p className="text-base text-white/75 leading-relaxed line-clamp-2">
                        {project.hero.subheadline}
                      </p>
                      <span className="inline-block mt-5 text-sm tracking-[0.14em] uppercase text-white/75 group-hover:text-white transition-colors">
                        View project →
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-5">Ready to get started?</h2>
          <p className="text-base text-white/70 mb-8 leading-relaxed">Book a discovery call and get professional advice today.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/book" className="btn-primary">Get in Touch</Link>
            <Link href="/work" className="btn-ghost">View Our Work</Link>
          </div>
        </div>
      </section>
      <JsonLd data={buildServiceSchema(service.title, service.hero.subheadline, service.category)} />
    </>
  )
}

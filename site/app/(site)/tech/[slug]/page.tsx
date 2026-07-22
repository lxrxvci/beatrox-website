import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getAllProjectsResolved, getAllServicesResolved, getServiceResolved } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import { truncateAtWord } from '@/lib/text'
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

// Resolved docs carry the legacy "/services/<slug>" slug form regardless of
// pageType — strip either route prefix to get the bare slug.
function bareSlug(slug: string): string {
  return slug.replace(/^\/(services|tech)\/+/, '')
}

export async function generateStaticParams() {
  const services = await getAllServicesResolved()
  return services
    .filter((service) => service.pageType === 'tech')
    .map((service) => ({ slug: bareSlug(service.slug) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = await getServiceResolved(slug)
  if (!service || service.pageType !== 'tech') return {}
  return seoToMetadata(service.seo)
}

export default async function TechPage({ params }: Props) {
  const { slug } = await params
  const service = await getServiceResolved(slug)
  if (!service || service.pageType !== 'tech') notFound()
  const heroImage = service.media?.heroImage || '/og-default.jpg'
  const gallery = service.media?.galleryImages || []
  const inlineMedia = gallery.filter((img) => img && img !== heroImage)

  // Projects Using This Tech — association is techTags-only (never serviceTags):
  // a tech page lists work explicitly tagged with this tech capability.
  const bareTechSlug = bareSlug(service.slug)
  const projects = await getAllProjectsResolved()
  const techProjects = projects
    .filter((project) =>
      (project.techTags || []).some((tag) => bareSlug(tag.slug) === bareTechSlug),
    )
    .slice(0, 6)

  return (
    <>
      <ParallaxHero
        imageSrc={heroImage}
        imageAlt={`${service.title} hero`}
        backHref="/tech"
        backLabel="← Tech Capabilities"
        eyebrow="Tech Capability"
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
            <h2 className="heading-sm text-white/75 mb-2">Capabilities</h2>
            {service.category && (
              <p className="mono text-white/50 mb-6">{service.category}</p>
            )}
            <ul className="space-y-3">
              {service.capabilities.map((cap, i) => (
                <li key={cap} className="flex items-start gap-3 text-base text-white/75">
                  <NodeBullet index={i} />
                  <EditableText collection="services" documentId={service.id} fieldPath={`capabilities.${i}`} value={cap}><span>{cap}</span></EditableText>
                </li>
              ))}
            </ul>

            {/* Technologies — display-only chips, never used for project matching */}
            {service.tech && service.tech.length > 0 && (
              <div className="mt-10">
                <h3 className="overline mb-4">Technologies</h3>
                <ul className="flex flex-wrap gap-2">
                  {service.tech.map((tech) => (
                    <li
                      key={tech}
                      className="border border-white/10 rounded-full px-3 py-1 text-xs text-white/75 hover:text-white hover:border-[var(--accent)] transition-colors"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                          <div key={idx} className="flex items-start gap-3 text-base text-white/75">
                            <span className="text-[var(--accent)] mt-0.5 shrink-0" aria-hidden="true">✓</span>
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
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-[var(--accent)]/40 text-[var(--accent)] font-mono text-sm rounded-sm">
                              {idx + 1}
                            </span>
                            <span className="text-base text-white/75 leading-relaxed pt-1"><EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.items.${idx}`} value={item}>{item.replace(/^\d+[.)]\s*/, '')}</EditableText></span>
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
                            <p className="text-base font-semibold text-white mb-2 flex items-start gap-3">
                              <span aria-hidden="true" className="text-[var(--accent)] shrink-0">+</span>
                              <EditableText collection="services" documentId={service.id} fieldPath={`body.${i}.items.${idx}.question`} value={item.question}>{item.question}</EditableText>
                            </p>
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
                        <p className="text-base text-white/75 leading-relaxed whitespace-pre-line">
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
                  <div className="relative w-full aspect-video bg-neutral-950 border border-white/10 overflow-hidden">
                    <Image
                      src={inlineMedia[i]}
                      alt={`${service.title} image ${i + 1}`}
                      fill
                      sizes="(max-width: 1120px) 100vw, 880px"
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

      {/* Projects Using This Tech — techTags-matched work only, hidden when empty */}
      {techProjects.length > 0 && (
        <section className="section border-b border-white/10">
          <div className="max-w-[1120px] mx-auto">
            <h2 className="heading-sm text-white/75 mb-8">Projects Using This Tech</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px">
              {techProjects.map((project) => {
                const image = project.images?.find((img) => img.url && img.url.trim() !== '')?.url
                const imageAlt = project.images?.find((img) => img.url && img.url.trim() !== '')?.alt
                return (
                  <Link
                    key={project.canonicalSlug}
                    href={`/work/${project.canonicalSlug}`}
                    className={`relative p-7 md:p-8 group transition-colors block overflow-hidden border border-white/10 ${
                      image
                        ? 'bg-black min-h-[16rem] hover:bg-white/5'
                        : 'bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    {image && (
                      <>
                        <Image
                          src={image}
                          alt={imageAlt || `${project.title} project image`}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
                      </>
                    )}
                    <div className="relative">
                      <p className="mono text-[var(--accent)] mb-3">
                        {project.metadata.client}
                      </p>
                      <p className="heading-sm text-white mb-3">{project.title}</p>
                      <p className="text-base text-white/75 leading-relaxed">
                        {truncateAtWord(project.hero.subheadline)}
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
          <h2 className="heading-md mb-5">Ready to get <span className="text-[var(--accent)]">started</span>?</h2>
          <p className="text-base text-white/70 mb-8 leading-relaxed">Book a discovery call and get professional advice today.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/book" className="btn-primary btn-primary--accent">Get in Touch</Link>
            <Link href="/work" className="btn-ghost">View Our Work</Link>
          </div>
        </div>
      </section>
      <JsonLd data={buildServiceSchema(service.title, service.hero.subheadline, service.category)} />
    </>
  )
}

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getAllServicesResolved, getProjectCardsResolved, getServiceResolved, getTaggedImagesForSlug, mergeCuratedTaggedImages, type TaggedImageEntry } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import { truncateAtWord } from '@/lib/text'
import JsonLd from '@/components/JsonLd'
import { buildBreadcrumbSchema, buildFaqSchema, buildServiceSchema, type FaqItem } from '@/lib/schema'
import ParallaxHero from '@/components/ParallaxHero'
import CMSBlockRenderer from '@/components/CMSBlockRenderer'
import RelatedProjectCards from '@/components/RelatedProjectCards'
import RevealOnScroll from '@/components/RevealOnScroll'
import ServiceBodySections from '@/components/ServiceBodySections'
import { EditableCuratedImages, EditableImage, EditableText } from '@/components/admin'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
  preview?: boolean
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
  return seoToMetadata(service.seo, `/tech/${slug}`)
}

export default async function TechPage({ params, preview = false }: Props) {
  const { slug } = await params
  const service = await getServiceResolved(slug, preview)
  if (!service || service.pageType !== 'tech') notFound()
  const heroImage = service.media?.heroImage || '/og-default.jpg'
  const gallery = service.media?.galleryImages || []
  // Keep the raw galleryImages index — it is the inline-edit field path
  // (media.galleryImages.N). Empty/hero-duplicate rows are skipped at render.
  const inlineMedia = gallery
    .map((url, galleryIndex) => ({ url, galleryIndex }))
    .filter((entry) => entry.url && entry.url !== heroImage)

  // Independent fetches in parallel: the tech-matched card list (slim
  // fields) and the tagged-photo pool (full project docs, deduped per
  // render via cache()).
  const bareTechSlug = bareSlug(service.slug)
  const [projects, taggedAuto] = await Promise.all([
    getProjectCardsResolved(preview),
    getTaggedImagesForSlug(bareTechSlug, 'tech', preview),
  ])

  // Projects Using This Tech — association is techTags-only (never serviceTags):
  // a tech page lists work explicitly tagged with this tech capability.
  const techProjects = projects
    .filter((project) =>
      (project.techTags || []).some((tag) => bareSlug(tag.slug) === bareTechSlug),
    )
    .slice(0, 6)

  // Tagged photos: image-level techTags populate this page. Automatic order
  // = project order → image order; curatedImages pins/hides override per page.
  const effectiveImages = mergeCuratedTaggedImages(taggedAuto, service.curatedImages || [])
  const hasTaggedImages = effectiveImages.length > 0
  // 2 photos interleaved after each body section; the rest form the bottom gallery.
  const leftoverImages = hasTaggedImages ? effectiveImages.slice(service.body.length * 2) : []
  // Card thumbnails: this page's tagged photo per project (first non-empty image fallback).
  const taggedThumbByProject = new Map<string, TaggedImageEntry>()
  for (const entry of effectiveImages) {
    if (!taggedThumbByProject.has(entry.project.canonicalSlug)) {
      taggedThumbByProject.set(entry.project.canonicalSlug, entry)
    }
  }
  const toCurationItem = (entry: TaggedImageEntry) => ({
    projectId: entry.project.id,
    projectSlug: entry.project.canonicalSlug,
    projectTitle: entry.project.title,
    imageIndex: entry.imageIndex,
    url: entry.image.url,
    alt: entry.image.alt,
  })

  const renderAfterSection = (index: number): ReactNode => {
    if (!hasTaggedImages) {
      // Untagged fallback: the legacy inline single-image behavior.
      const media = inlineMedia[index]
      if (!media) return null
      return (
        <div className="card-glow scanlines relative w-full aspect-video bg-neutral-950 border border-white/10 overflow-hidden">
          <span className="hud-corners" aria-hidden="true" />
          <EditableImage
            collection="services"
            documentId={service.id}
            fieldPath={`media.galleryImages.${media.galleryIndex}`}
            value={media.url}
          >
            <Image
              src={media.url}
              alt={`${service.title} image ${index + 1}`}
              fill
              sizes="(max-width: 1120px) 100vw, 880px"
              className="object-contain"
            />
          </EditableImage>
        </div>
      )
    }
    const row = effectiveImages.slice(index * 2, index * 2 + 2)
    if (row.length === 0) return null
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {row.map((entry) => (
          <Link
            key={`${entry.project.canonicalSlug}-${entry.imageIndex}`}
            href={`/work/${entry.project.canonicalSlug}`}
            className="card-glow scanlines relative block aspect-video bg-neutral-950 border border-white/10 overflow-hidden group"
          >
            <span className="hud-corners" aria-hidden="true" />
            <Image
              src={entry.image.url}
              alt={entry.image.alt}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-all duration-500 group-hover:scale-[1.02] group-hover:brightness-110"
            />
          </Link>
        ))}
      </div>
    )
  }

  // FAQ body blocks feed the FAQPage JSON-LD (rendered HTML stays unchanged).
  const faqItems = service.body
    .filter((block) => block.type === 'faq')
    .flatMap((block) => (block.items as unknown as FaqItem[]) || [])

  return (
    <>
      <EditableImage
        collection="services"
        documentId={service.id}
        fieldPath="media.heroImage"
        bareRelationship
        value={heroImage}
      >
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
      </EditableImage>

      {/* Capabilities */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1120px] mx-auto">
          <EditableCuratedImages
            documentId={service.id}
            entries={effectiveImages.map(toCurationItem)}
            autoEntries={taggedAuto.map(toCurationItem)}
          />
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12 lg:gap-16">
          <RevealOnScroll className="self-start">
          <div className="hud-card p-5 md:p-6">
            <span className="hud-corners" aria-hidden="true" />
            <h2 className="hud-label mb-2">Capabilities</h2>
            {service.category && (
              <p className="mono text-white mb-6">{service.category}</p>
            )}
            <ul className="space-y-3">
              {service.capabilities.map((cap, i) => (
                <li key={cap} className="flex items-start gap-3 text-base text-white">
                  <span className="hud-index shrink-0 mt-1.5" aria-hidden="true">{String(i + 1).padStart(2, '0')} ·</span>
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
                      className="hud-chip"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          </RevealOnScroll>

          {/* Body blocks — boxed cards, tagged photos interleaved between sections */}
          <ServiceBodySections service={service} renderAfterSection={renderAfterSection} />
          </div>
        </div>
      </section>

      {/* WYSIWYG Content Blocks — only when no legacy body blocks exist (seeded docs carry both; body wins) */}
      {service.body.length === 0 && service.contentBlocks && service.contentBlocks.length > 0 && (
        <CMSBlockRenderer blocks={service.contentBlocks} collection="services" documentId={service.id} />
      )}

      {/* From Past Projects — tagged photos not interleaved between body sections */}
      {leftoverImages.length > 0 && (
        <section className="section border-b border-white/10">
          <div className="max-w-[1120px] mx-auto">
            <h2 className="hud-label mb-8">From Past Projects</h2>
            <RevealOnScroll>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {leftoverImages.map((entry) => (
                <Link
                  key={`${entry.project.canonicalSlug}-${entry.imageIndex}`}
                  href={`/work/${entry.project.canonicalSlug}`}
                  className="group block"
                >
                  <div className="card-glow scanlines relative aspect-video bg-neutral-950 border border-white/10 overflow-hidden">
                    <span className="hud-corners" aria-hidden="true" />
                    <Image
                      src={entry.image.url}
                      alt={entry.image.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-all duration-500 group-hover:scale-[1.02] group-hover:brightness-110"
                    />
                  </div>
                  <p className="mono text-xs text-white mt-2 uppercase tracking-[0.2em]">
                    {entry.project.title}
                  </p>
                </Link>
              ))}
            </div>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* Projects Using This Tech — techTags-matched work only, hidden when empty */}
      {techProjects.length > 0 && (
        <section className="section border-b border-white/10">
          <div className="max-w-[1120px] mx-auto">
            <h2 className="hud-label mb-8">Projects Using This Tech</h2>
            <RevealOnScroll>
            <RelatedProjectCards
              entries={techProjects.map((project) => {
                const taggedThumb = taggedThumbByProject.get(project.canonicalSlug)
                const fallbackImage = project.images?.find((img) => img.url && img.url.trim() !== '')
                return {
                  slug: `/work/${project.canonicalSlug}`,
                  title: project.title,
                  client: project.metadata.client,
                  subheadline: project.hero.subheadline,
                  imageUrl: taggedThumb?.image.url || fallbackImage?.url,
                  imageAlt: taggedThumb?.image.alt || fallbackImage?.alt,
                }
              })}
            />
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section bg-blueprint text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-5">Ready to get <span className="glow-text text-[var(--accent)]">started</span>?</h2>
          <p className="text-base text-white mb-8 leading-relaxed">Book a discovery call and get professional advice today.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/book" className="btn-primary btn-primary--accent">Get in Touch</Link>
            <Link href="/work" className="btn-ghost">View Our Work</Link>
          </div>
        </div>
      </section>
      <JsonLd data={buildServiceSchema(service.title, service.hero.subheadline, service.category)} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Tech', path: '/tech' },
          { name: service.title, path: `/tech/${slug}` },
        ])}
      />
      {faqItems.length > 0 && <JsonLd data={buildFaqSchema(faqItems)} />}
    </>
  )
}

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getAllProjectsResolved, getMediaLibrary, getServiceResolved, getServiceSlugsResolved, getTaggedImagesForSlug, mergeCuratedTaggedImages, type TaggedImageEntry } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import { truncateAtWord } from '@/lib/text'
import JsonLd from '@/components/JsonLd'
import { buildBreadcrumbSchema, buildFaqSchema, buildServiceSchema, type FaqItem } from '@/lib/schema'
import NodeBullet from '@/components/NodeBullet'
import ParallaxHero from '@/components/ParallaxHero'
import CMSBlockRenderer from '@/components/CMSBlockRenderer'
import ServiceBodySections from '@/components/ServiceBodySections'
import { EditableCuratedImages, EditableImage, EditableText } from '@/components/admin'

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
  return seoToMetadata(service.seo, `/services/${slug}`)
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params
  const service = await getServiceResolved(slug)
  if (!service) notFound()
  // Tech capabilities live at /tech/[slug] — the 301s in next.config.ts cover
  // old /services links; this guards direct hits that bypass the redirect.
  if (service.pageType === 'tech') notFound()
  const mediaLibrary = await getMediaLibrary()
  const heroImage = service.media?.heroImage || '/og-default.jpg'
  const gallery = service.media?.galleryImages || []
  // Keep the raw galleryImages index — it is the inline-edit field path
  // (media.galleryImages.N). Empty/hero-duplicate rows are skipped at render.
  const inlineMedia = gallery
    .map((url, galleryIndex) => ({ url, galleryIndex }))
    .filter((entry) => entry.url && entry.url !== heroImage)

  // Resolve relatedWork slugs (full paths like "/work/foo") against portfolio projects
  const projects = await getAllProjectsResolved()
  const relatedProjects = (service.relatedWork || [])
    .map((work) => {
      const key = work.slug.replace(/^\/work\/+/, '')
      const project = projects.find((p) => p.canonicalSlug === key)
      return project ? { work, project } : null
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  // Auto-append projects tagged with this service (manual picks first, deduped, capped at 6)
  const bareServiceSlug = service.slug.replace(/^\/services\/+/, '')
  const seenSlugs = new Set(relatedProjects.map(({ project }) => project.canonicalSlug))
  const tagMatchedProjects = projects
    .filter(
      (project) =>
        !seenSlugs.has(project.canonicalSlug) &&
        (project.serviceTags || []).some((tag) => {
          const bareTagSlug = tag.slug.replace(/^\/services\/+/, '')
          return bareTagSlug === bareServiceSlug
        }),
    )
    .map((project) => ({ work: { title: project.title, slug: `/work/${project.canonicalSlug}` }, project }))
  const allRelatedProjects = [...relatedProjects, ...tagMatchedProjects].slice(0, 6)

  // Tagged photos: image-level serviceTags populate this page. Automatic order
  // = project order → image order; curatedImages pins/hides override per page.
  const taggedAuto = await getTaggedImagesForSlug(bareServiceSlug, 'service')
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
        <div className="relative w-full aspect-video bg-neutral-950 border border-white/10 overflow-hidden">
          <EditableImage
            collection="services"
            documentId={service.id}
            fieldPath={`media.galleryImages.${media.galleryIndex}`}
            value={media.url}
            mediaLibrary={mediaLibrary}
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
            className="relative block aspect-video bg-neutral-950 border border-white/10 overflow-hidden group"
          >
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
        mediaLibrary={mediaLibrary}
      >
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
            <h2 className="heading-sm text-white/75 mb-8">From Past Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {leftoverImages.map((entry) => (
                <Link
                  key={`${entry.project.canonicalSlug}-${entry.imageIndex}`}
                  href={`/work/${entry.project.canonicalSlug}`}
                  className="group block"
                >
                  <div className="relative aspect-video bg-neutral-950 border border-white/10 overflow-hidden">
                    <Image
                      src={entry.image.url}
                      alt={entry.image.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-all duration-500 group-hover:scale-[1.02] group-hover:brightness-110"
                    />
                  </div>
                  <p className="mono text-xs text-white/40 mt-2 uppercase tracking-[0.2em]">
                    {entry.project.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Work — example cards cited from past projects */}
      {allRelatedProjects.length > 0 && (
        <section className="section border-b border-white/10">
          <div className="max-w-[1120px] mx-auto">
            <h2 className="heading-sm text-white/75 mb-8">See It in Action</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px">
              {allRelatedProjects.map(({ work, project }) => {
                const taggedThumb = taggedThumbByProject.get(project.canonicalSlug)
                const fallbackImage = project.images?.find((img) => img.url && img.url.trim() !== '')
                const image = taggedThumb?.image.url || fallbackImage?.url
                const imageAlt = taggedThumb?.image.alt || fallbackImage?.alt
                return (
                  <Link
                    key={work.slug}
                    href={work.slug}
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
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Services', path: '/services' },
          { name: service.title, path: `/services/${slug}` },
        ])}
      />
      {faqItems.length > 0 && <JsonLd data={buildFaqSchema(faqItems)} />}
    </>
  )
}

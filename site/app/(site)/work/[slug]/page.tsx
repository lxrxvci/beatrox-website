import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { normalizeProjectSlug } from '@/lib/json-content'
import { getAllProjectsResolved, getAllServicesResolved, getMediaLibrary, getProjectResolved, getProjectSlugsResolved } from '@/lib/content'
import { getImageDimensions } from '@/lib/image-dimensions'
import { seoToMetadata } from '@/lib/metadata'
import { truncateAtWord } from '@/lib/text'
import JsonLd from '@/components/JsonLd'
import { buildBreadcrumbSchema } from '@/lib/schema'
import VideoEmbedStrip from '@/components/VideoEmbedStrip'
import ProjectGallery from '@/components/ProjectGallery'
import MetadataSchematic from '@/components/MetadataSchematic'
import KineticHeading from '@/components/KineticHeading'
import NodeBullet from '@/components/NodeBullet'
import CMSBlockRenderer from '@/components/CMSBlockRenderer'
import { EditableImage, EditableServiceTags, EditableTechTags, EditableText } from '@/components/admin'
import ThemedProjectShell from '@/components/work/ThemedProjectShell'
import { getProjectTheme } from '@/components/work/project-themes'
import ProjectAtmosphere from '@/components/work/engines/ProjectAtmosphere'
import ProjectStats from '@/components/work/ProjectStats'
import BreakoutFigure from '@/components/work/BreakoutFigure'
import NextProjectFooter from '@/components/work/NextProjectFooter'

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await getProjectSlugsResolved()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const canonicalSlug = normalizeProjectSlug(slug)
  const project = await getProjectResolved(canonicalSlug)
  if (!project) return {}
  return seoToMetadata(project.seo, `/work/${canonicalSlug}`)
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const canonicalSlug = normalizeProjectSlug(slug)
  if (!canonicalSlug) notFound()
  if (slug !== canonicalSlug) {
    redirect(`/work/${canonicalSlug}`)
  }
  const project = await getProjectResolved(canonicalSlug)
  if (!project) notFound()

  const allServices = await getAllServicesResolved()
  const mediaLibrary = await getMediaLibrary()
  const serviceOptions = allServices.map((s) => ({ id: s.id, title: s.title, slug: s.slug }))
  const techOptions = allServices
    .filter((s) => s.pageType === 'tech')
    .map((s) => ({ id: s.id, title: s.title, slug: s.slug }))

  // Related projects: share ≥1 serviceTag with this project (service-only
  // relatedness — tech tags are display-only), ranked by shared-tag count.
  const currentServiceTagSlugs = new Set(
    project.serviceTags.map((tag) => tag.slug.replace(/^\/services\/+/, '')),
  )
  const allProjects = await getAllProjectsResolved()
  const relatedProjects = allProjects
    .filter((candidate) => candidate.canonicalSlug !== project.canonicalSlug)
    .map((candidate) => ({
      project: candidate,
      shared: candidate.serviceTags.filter((tag) =>
        currentServiceTagSlugs.has(tag.slug.replace(/^\/services\/+/, '')),
      ).length,
    }))
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.shared - a.shared || a.project.title.localeCompare(b.project.title))
    .slice(0, 6)

  // Next-project footer: the next project in resolved order, wrapping around.
  const projectIndex = allProjects.findIndex((p) => p.canonicalSlug === project.canonicalSlug)
  const nextProject = allProjects[(projectIndex + 1) % allProjects.length]

  // Drop entries with no usable URL so they can never render as empty frames.
  const validImages = project.images?.filter(img => img.url && img.url.trim() !== '') ?? []

  // Ensure every gallery image has dimensions for the mosaic layout.
  const galleryImages = await Promise.all(
    validImages.map(async (img) => {
      if (img.width && img.height) return img
      const dims = await getImageDimensions(img.url)
      return dims ? { ...img, ...dims } : img
    })
  )

  // Skip the hero image in the gallery so it doesn't appear twice.
  const heroImage = galleryImages[0]
  const galleryImagesWithoutHero = galleryImages.slice(1)

  // Gallery staging: pull the widest landscape stills out of the flow to use
  // as full-bleed breakout figures, then split the rest into thirds.
  const landscapeImages = galleryImagesWithoutHero
    .filter((img) => img.width && img.height && img.height > 0 && img.width / img.height >= 1.5)
    .sort((a, b) => b.width! / b.height! - a.width! / a.height!)
  const breakoutImages = landscapeImages.slice(0, 2)
  const stagedImages = galleryImagesWithoutHero.filter((img) => !breakoutImages.includes(img))
  const chunkSize = Math.ceil(stagedImages.length / 3)
  const galleryChunks = [0, 1, 2]
    .map((i) => stagedImages.slice(i * chunkSize, (i + 1) * chunkSize))
    .filter((chunk) => chunk.length > 0)

  // Per-project identity: accent palette, hero intro variant, atmosphere engine.
  const theme = getProjectTheme(canonicalSlug)

  // Mono fact line under the hero title: CLIENT — LOCATION, TYPE.
  const heroLocation = project.metadata.location ?? project.metadata.locations?.join(' · ') ?? ''

  return (
    <ThemedProjectShell slug={canonicalSlug}>
      {/* Hero — full-viewport, elevated image with rebalanced gradient */}
      <section className="scanlines relative hero min-h-[100svh] flex flex-col justify-end overflow-hidden bg-black">
        {heroImage && (
          <EditableImage
            collection="projects"
            documentId={project.id}
            fieldPath={`images.${heroImage.sourceIndex ?? 0}`}
            value={heroImage.url}
            alt={heroImage.alt}
            mediaLibrary={mediaLibrary}
            serviceOptions={serviceOptions}
            techOptions={techOptions}
            selectedServiceIds={(heroImage.serviceTags || []).map((tag) => tag.id)}
            selectedTechIds={(heroImage.techTags || []).map((tag) => tag.id)}
          >
            <>
              <Image
                src={heroImage.url}
                alt={heroImage.alt}
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-65"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
            </>
          </EditableImage>
        )}
        <ProjectAtmosphere engine={theme.engine} params={theme.engineParams} />
        <Link
          href="/work"
          className="absolute top-24 left-6 lg:left-10 z-20 mono text-[11px] uppercase tracking-[0.24em] text-white hover:text-white transition-colors"
        >
          ← Work
        </Link>
        <div className="relative z-10 max-w-[1400px] mx-auto w-full">
          <KineticHeading text={project.title} className="heading-xl max-w-3xl" intro={theme.heroIntro} />
          {(project.metadata.client || heroLocation || project.metadata.type) && (
            <p className="mono mt-6 uppercase tracking-[0.22em] text-white">
              {project.metadata.client && (
                <span className="text-[var(--accent)]">{project.metadata.client}</span>
              )}
              {project.metadata.client && (heroLocation || project.metadata.type) && ' — '}
              {heroLocation}
              {heroLocation && project.metadata.type && ', '}
              {project.metadata.type}
            </p>
          )}
        </div>
      </section>

      {/* Impact strip — huge accent numerals; hidden when the project has no stats */}
      <ProjectStats stats={project.stats} collection="projects" documentId={project.id} />

      {/* Content */}
      <section className="section border-t border-white/10 pt-12 lg:pt-16">
        <div className="max-w-[1400px] mx-auto">
          {/* Services used — chips link to service pages; owner can re-tag in edit mode */}
          <div>
            <h2 className="overline mb-4">Services Used</h2>
            <EditableServiceTags
              collection="projects"
              documentId={project.id}
              allServices={serviceOptions}
              selectedIds={project.serviceTags.map((tag) => tag.id)}
            >
              <div className="flex flex-wrap gap-2">
                {project.serviceTags.length > 0 ? (
                  project.serviceTags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/services/${tag.slug.replace(/^\/services\/+/, '')}`}
                      className="hud-chip"
                    >
                      {tag.title}
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-white">No services tagged yet</span>
                )}
              </div>
            </EditableServiceTags>
          </div>

          {/* Tech used — chips link to /tech pages; owner can re-tag in edit mode */}
          <div className="mt-8">
            <h2 className="overline mb-4">Tech Used</h2>
            <EditableTechTags
              collection="projects"
              documentId={project.id}
              allTech={techOptions}
              selectedIds={project.techTags.map((tag) => tag.id)}
            >
              <div className="flex flex-wrap gap-2">
                {project.techTags.length > 0 ? (
                  project.techTags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={tag.slug}
                      className="hud-chip"
                    >
                      {tag.title}
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-white">No tech tagged yet</span>
                )}
              </div>
            </EditableTechTags>
          </div>

          {/* Body — first block's content renders as a lede; headings get mono
              index prefixes via the .editorial-body CSS counter (no markup changes) */}
          <div className="editorial-body mt-14 pt-14 border-t border-white/10 max-w-3xl space-y-12">
              {project.body.map((block, i) => (
                <div key={i}>
                  {block.heading && (
                    <h2 className="overline mb-4"><EditableText collection="projects" documentId={project.id} fieldPath={`body.${i}.heading`} value={block.heading}>{block.heading}</EditableText></h2>
                  )}
                  {block.content && (
                    <p className={`${i === 0 ? 'text-xl text-white' : 'text-base text-white'} leading-relaxed whitespace-pre-line`}>
                      <EditableText collection="projects" documentId={project.id} fieldPath={`body.${i}.content`} value={block.content} multiline>
                        {block.content}
                      </EditableText>
                    </p>
                  )}
                  {block.items && (
                    <ul className="space-y-2 mt-2">
                      {block.items.map((item, itemIndex) => (
                        <li key={item} className="flex items-start gap-3 text-base text-white">
                        <NodeBullet index={itemIndex} />
                        <EditableText collection="projects" documentId={project.id} fieldPath={`body.${i}.items.${itemIndex}`} value={item}><span>{item}</span></EditableText>
                      </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* WYSIWYG Content Blocks — only when no legacy body blocks exist (seeded docs carry both; body wins) */}
      {project.body.length === 0 && project.contentBlocks && project.contentBlocks.length > 0 && (
        <CMSBlockRenderer blocks={project.contentBlocks} collection="projects" documentId={project.id} />
      )}

      {/* Gallery — staged in thirds with full-bleed breakout figures between */}
      {galleryImagesWithoutHero.length > 0 && (
        <section className="border-t border-white/10">
          {galleryChunks.map((chunk, i) => (
            <Fragment key={i}>
              <ProjectGallery
                images={chunk}
                collection="projects"
                documentId={project.id}
                mediaLibrary={mediaLibrary}
                serviceOptions={serviceOptions}
                techOptions={techOptions}
              />
              {breakoutImages[i] && (
                <BreakoutFigure img={breakoutImages[i]} index={i} />
              )}
            </Fragment>
          ))}
          {/* Leftover breakout figures when there are more figures than chunks */}
          {breakoutImages.slice(galleryChunks.length).map((img, i) => (
            <BreakoutFigure
              key={img.url}
              img={img}
              index={galleryChunks.length + i}
            />
          ))}
        </section>
      )}

      {project.videos && project.videos.length > 0 && (
        <VideoEmbedStrip title="Project Video" videos={project.videos} />
      )}

      {/* Credits — film-roll metadata below gallery/videos */}
      <section className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
          <MetadataSchematic
            cells={[
              { label: 'Client', values: [project.metadata.client ?? ''] },
              {
                label: 'Location',
                values: project.metadata.location
                  ? [project.metadata.location]
                  : project.metadata.locations ?? [],
              },
              { label: 'Type', values: [project.metadata.type ?? ''] },
              {
                label: 'Tech',
                values: [
                  ...(project.metadata.tech ?? []),
                  ...(project.metadata.techniques ?? []),
                  ...(project.metadata.materials ?? []),
                ],
              },
              { label: 'Spec', values: project.metadata.spec ?? [] },
              { label: 'Partners', values: project.metadata.partners ?? [] },
            ]}
          />
        </div>
      </section>

      {/* Related Projects — projects sharing ≥1 serviceTag, ranked by overlap */}
      {relatedProjects.length > 0 && (
        <section className="section border-t border-white/10 py-14 lg:py-20">
          <div className="max-w-[1120px] mx-auto">
            <h2 className="heading-sm text-white mb-8">Related Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px">
              {relatedProjects.map(({ project: related }) => {
                const image = related.images?.find((img) => img.url && img.url.trim() !== '')?.url
                const imageAlt = related.images?.find((img) => img.url && img.url.trim() !== '')?.alt
                return (
                  <Link
                    key={related.canonicalSlug}
                    href={`/work/${related.canonicalSlug}`}
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
                          alt={imageAlt || `${related.title} project image`}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
                      </>
                    )}
                    <div className="relative">
                      <p className="mono text-[var(--accent)] mb-3">
                        {related.metadata.client}
                      </p>
                      <p className="heading-sm text-white mb-3">{related.title}</p>
                      <p className="text-base text-white leading-relaxed">
                        {truncateAtWord(related.hero.subheadline)}
                      </p>
                      <span className="inline-block mt-5 text-sm tracking-[0.14em] uppercase text-white group-hover:text-white transition-colors">
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

      {/* Next-project footer — replaces the generic CTA on work pages */}
      <NextProjectFooter project={nextProject} />

      {/* Bottom nav row */}
      <section className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/work" className="text-sm font-semibold tracking-[0.18em] uppercase text-white hover:text-white transition-colors">
            ← All Projects
          </Link>
          <Link href="/services" className="text-sm font-semibold tracking-[0.18em] uppercase text-white hover:text-white transition-colors">
            Explore Services →
          </Link>
        </div>
      </section>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Work', path: '/work' },
          { name: project.title, path: `/work/${canonicalSlug}` },
        ])}
      />
    </ThemedProjectShell>
  )
}

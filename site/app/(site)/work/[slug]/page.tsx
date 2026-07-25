import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
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

  return (
    <>
      {/* Hero */}
      <section className="relative hero min-h-[60vh] flex flex-col justify-end overflow-hidden bg-black">
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
                className="object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </>
          </EditableImage>
        )}
        <div className="relative max-w-[1400px] mx-auto w-full">
          <Link href="/work" className="mono text-white/60 hover:text-white transition-colors mb-8 inline-block">
            ← Work
          </Link>
          {project.metadata.client && (
            <p className="mono text-[var(--accent)] mb-3">{project.metadata.client}</p>
          )}
          <KineticHeading text={project.title} className="heading-xl max-w-3xl" />
        </div>
      </section>

      {/* Content */}
      <section className="section border-t border-white/10">
        <div className="max-w-[1400px] mx-auto">
          {/* Editorial schematic metadata */}
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

          {/* Services used — chips link to service pages; owner can re-tag in edit mode */}
          <div className="mt-14">
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
                      className="border border-white/10 rounded-full px-3 py-1 text-xs text-white/75 hover:text-white hover:border-[var(--accent)] transition-colors"
                    >
                      {tag.title}
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-white/40">No services tagged yet</span>
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
                      className="border border-white/10 rounded-full px-3 py-1 text-xs text-white/75 hover:text-white hover:border-[var(--accent)] transition-colors"
                    >
                      {tag.title}
                    </Link>
                  ))
                ) : (
                  <span className="text-sm text-white/40">No tech tagged yet</span>
                )}
              </div>
            </EditableTechTags>
          </div>

          {/* Body */}
          <div className="mt-14 pt-14 border-t border-white/10 max-w-3xl space-y-12">
              {project.body.map((block, i) => (
                <div key={i}>
                  {block.heading && (
                    <h2 className="overline mb-4"><EditableText collection="projects" documentId={project.id} fieldPath={`body.${i}.heading`} value={block.heading}>{block.heading}</EditableText></h2>
                  )}
                  {block.content && (
                    <p className="text-base text-white/75 leading-relaxed whitespace-pre-line">
                      <EditableText collection="projects" documentId={project.id} fieldPath={`body.${i}.content`} value={block.content} multiline>
                        {block.content}
                      </EditableText>
                    </p>
                  )}
                  {block.items && (
                    <ul className="space-y-2 mt-2">
                      {block.items.map((item, itemIndex) => (
                        <li key={item} className="flex items-start gap-3 text-base text-white/75">
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

      {/* Gallery */}
      {galleryImagesWithoutHero.length > 0 && (
        <section className="border-t border-white/10">
          <ProjectGallery
            images={galleryImagesWithoutHero}
            collection="projects"
            documentId={project.id}
            mediaLibrary={mediaLibrary}
            serviceOptions={serviceOptions}
            techOptions={techOptions}
          />
        </section>
      )}

      {project.videos && project.videos.length > 0 && (
        <VideoEmbedStrip title="Project Video" videos={project.videos} />
      )}

      {/* Related Projects — projects sharing ≥1 serviceTag, ranked by overlap */}
      {relatedProjects.length > 0 && (
        <section className="section border-t border-white/10">
          <div className="max-w-[1120px] mx-auto">
            <h2 className="heading-sm text-white/75 mb-8">Related Projects</h2>
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
                      <p className="text-base text-white/75 leading-relaxed">
                        {truncateAtWord(related.hero.subheadline)}
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

      {/* Bottom nav / CTA */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto mb-10">
          <h2 className="heading-md mb-5">Ready to start your <span className="text-[var(--accent)]">project</span>?</h2>
          <p className="text-base text-white/70 mb-8 leading-relaxed">
            Let&apos;s bring your vision to life. Our team of creative and technical directors is ready to collaborate.
          </p>
          <Link href="/book" className="btn-primary btn-primary--accent">Start Your Project</Link>
        </div>
        <div className="max-w-[1400px] mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/work" className="text-sm font-semibold tracking-[0.18em] uppercase text-white/70 hover:text-white transition-colors">
            ← All Projects
          </Link>
          <Link href="/services" className="text-sm font-semibold tracking-[0.18em] uppercase text-white/70 hover:text-white transition-colors">
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
    </>
  )
}

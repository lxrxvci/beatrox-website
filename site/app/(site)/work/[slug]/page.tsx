import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getProject, getProjectSlugs, normalizeProjectSlug } from '@/lib/json-content'
import { seoToMetadata } from '@/lib/metadata'
import VideoEmbedStrip from '@/components/VideoEmbedStrip'
import ProjectGallery from '@/components/ProjectGallery'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getProjectSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const canonicalSlug = normalizeProjectSlug(slug)
  const project = getProject(canonicalSlug)
  if (!project) return {}
  return seoToMetadata(project.seo)
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const canonicalSlug = normalizeProjectSlug(slug)
  if (!canonicalSlug) notFound()
  if (slug !== canonicalSlug) {
    redirect(`/work/${canonicalSlug}`)
  }
  const project = getProject(canonicalSlug)
  if (!project) notFound()

  const validImages = project.images?.filter(img => img.url && img.url !== '') ?? []
  const heroImage = validImages[0]

  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 min-h-[60vh] flex flex-col justify-end overflow-hidden bg-black">
        {heroImage && (
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
        )}
        <div className="relative max-w-[1400px] mx-auto w-full px-6 lg:px-10 pb-16">
          <Link href="/work" className="text-[0.65rem] tracking-[0.2em] uppercase text-white/30 hover:text-white transition-colors mb-8 inline-block">
            ← Work
          </Link>
          <p className="heading-sm text-white/40 mb-3">{project.metadata.type}</p>
          <h1 className="heading-xl max-w-3xl">{project.title}</h1>
        </div>
      </section>

      {/* Content */}
      <section className="section border-t border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-16">

            {/* Sidebar */}
            <aside className="space-y-8">
              {project.metadata.client && (
                <div>
                  <p className="heading-sm text-white/30 mb-2">Client</p>
                  <p className="text-sm text-white/80">{project.metadata.client}</p>
                </div>
              )}
              {(project.metadata.location || project.metadata.locations) && (
                <div>
                  <p className="heading-sm text-white/30 mb-2">Location</p>
                  {project.metadata.location
                    ? <p className="text-sm text-white/80">{project.metadata.location}</p>
                    : project.metadata.locations?.map(l => (
                        <p key={l} className="text-sm text-white/80 mb-1">{l}</p>
                      ))
                  }
                </div>
              )}
              {project.metadata.type && (
                <div>
                  <p className="heading-sm text-white/30 mb-2">Type</p>
                  <p className="text-sm text-white/80 leading-relaxed">{project.metadata.type}</p>
                </div>
              )}
              {(project.metadata.tech || project.metadata.techniques || project.metadata.materials) && (
                <div>
                  <p className="heading-sm text-white/30 mb-3">Tech</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ...(project.metadata.tech ?? []),
                      ...(project.metadata.techniques ?? []),
                      ...(project.metadata.materials ?? []),
                    ].map(t => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {project.metadata.spec && project.metadata.spec.length > 0 && (
                <div>
                  <p className="heading-sm text-white/30 mb-2">Spec</p>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {project.metadata.spec.join(', ')}
                  </p>
                </div>
              )}
              {project.metadata.partners && project.metadata.partners.length > 0 && (
                <div>
                  <p className="heading-sm text-white/30 mb-2">Partners</p>
                  {project.metadata.partners.map(p => (
                    <p key={p} className="text-sm text-white/70">{p}</p>
                  ))}
                </div>
              )}
            </aside>

            {/* Body */}
            <div className="space-y-12">
              {project.body.map((block, i) => (
                <div key={i}>
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
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {validImages.length > 0 && (
        <section className="border-t border-white/10">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4 mb-2">
            <p className="heading-sm text-white/30">Gallery</p>
          </div>
          <ProjectGallery images={validImages} />
        </section>
      )}

      {project.videos && project.videos.length > 0 && (
        <VideoEmbedStrip title="Project Video" videos={project.videos} />
      )}

      {/* Bottom nav / CTA */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto mb-10">
          <h2 className="heading-md mb-4">Ready to start your project?</h2>
          <p className="text-sm text-white/50 mb-8 leading-relaxed">
            Let&apos;s bring your vision to life. Our team of creative and technical directors is ready to collaborate.
          </p>
          <Link href="/contact" className="btn-primary">Start Your Project</Link>
        </div>
        <div className="max-w-[1400px] mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/work" className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors">
            ← All Projects
          </Link>
          <Link href="/services" className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors">
            Explore Services →
          </Link>
        </div>
      </section>
    </>
  )
}

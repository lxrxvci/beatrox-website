import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getAllProjects, getProjectSlugs, getProjectTags, getWorkIndex, normalizeProjectSlug } from '@/lib/json-content'
import { seoToMetadata } from '@/lib/metadata'
import Reveal from '@/components/Reveal'
import ParallaxHero from '@/components/ParallaxHero'

export async function generateMetadata(): Promise<Metadata> {
  return seoToMetadata(getWorkIndex().seo)
}

export default function WorkPage() {
  const projects = getAllProjects()
  const slugs = getProjectSlugs()
  const tags = getProjectTags()
  const projectsBySlug = new Map(projects.map((project) => [project.canonicalSlug, project]))
  const normalizedSlugs = slugs.map((slug) => normalizeProjectSlug(slug))
  const rows = normalizedSlugs
    .map((slug) => ({ slug, project: projectsBySlug.get(slug) }))
    .filter((row): row is { slug: string; project: (typeof projects)[number] } => Boolean(row.project))
  const heroImage =
    rows[0]?.project?.images?.find((img) => img.url && img.url !== '')?.url ||
    rows[0]?.project?.seo?.og?.image ||
    '/og-default.jpg'

  return (
    <>
      <ParallaxHero
        imageSrc={heroImage}
        imageAlt="Work page hero"
        eyebrow="Portfolio"
        title="Our Work"
        description="Permanent installations. Touring spectacles. Global activations. Every project is a new frontier."
        minHeightClass="min-h-[94svh]"
      />

      {tags.length > 0 && (
        <section className="section border-t border-white/10">
          <Reveal className="max-w-[1120px] mx-auto">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link key={tag} href={`/work/tag/${tag}`} className="tag hover:border-white/40 transition-colors">
                  {tag}
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* Project previews */}
      <section className="section border-t border-white/10">
        <Reveal className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10">
            {rows.map(({ slug, project }) => (
              <Link
                key={slug}
                href={`/work/${slug}`}
                className="project-card relative aspect-[16/10] overflow-hidden bg-neutral-950 group block"
              >
                <Image
                  src={project.images?.find((img) => img.url && img.url !== '')?.url || project.seo?.og?.image || '/og-default.jpg'}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="project-card-overlay">
                  <div>
                    <p className="heading-sm text-white mb-2">{project.title}</p>
                    {project.metadata?.client && (
                      <p className="text-sm text-white/75 tracking-[0.12em] uppercase mb-2">
                        {project.metadata.client}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {(project.hero?.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-5">Have a project in mind?</h2>
          <p className="text-base text-white/70 mb-8">Let&apos;s talk about how we can bring your vision to life.</p>
          <Link href="/contact" className="btn-primary">Start a Conversation</Link>
        </div>
      </section>
    </>
  )
}

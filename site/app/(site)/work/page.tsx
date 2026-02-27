import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getAllProjectsResolved, getCMSPageBySlug, getProjectSlugsResolved, getWorkIndex } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import Reveal from '@/components/Reveal'
import ParallaxHero from '@/components/ParallaxHero'

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCMSPageBySlug('work')
  if (cms?.seo?.title && cms.seo.description && cms.seo.ogTitle && cms.seo.ogDescription && cms.seo.ogImage) {
    return seoToMetadata({
      title: cms.seo.title,
      description: cms.seo.description,
      og: {
        title: cms.seo.ogTitle,
        description: cms.seo.ogDescription,
        image: cms.seo.ogImage,
      },
    })
  }
  return seoToMetadata(getWorkIndex().seo)
}

export default async function WorkPage() {
  const projects = await getAllProjectsResolved()
  const slugs = await getProjectSlugsResolved()
  const normalizeProjectSlug = (slugValue: string) => slugValue.replace(/^\/+/, '').replace(/^work\/+/, '')
  const projectsBySlug = new Map(projects.map((project) => [normalizeProjectSlug(project.slug), project]))
  const rows = slugs
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
        title="Work"
        description="Our creative technology projects range from permanent installations to touring events — we scale from the small details to international logistics to meet your needs."
        minHeightClass="min-h-[94svh]"
      />

      {/* Project previews */}
      <section className="border-t border-white/10 px-6 lg:px-10 py-16 lg:py-24">
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
                      <p className="text-[0.65rem] text-white/35 tracking-[0.16em] uppercase mb-2">
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
          <h2 className="heading-md mb-4">Have a project in mind?</h2>
          <p className="text-sm text-white/50 mb-8">Let&apos;s talk about how we can bring your vision to life.</p>
          <Link href="/contact" className="btn-primary">Start a Conversation</Link>
        </div>
      </section>
    </>
  )
}

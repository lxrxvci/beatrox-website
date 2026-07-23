import type { Metadata } from 'next'
import Link from 'next/link'
import { getWorkIndex, normalizeProjectSlug } from '@/lib/json-content'
import { getAllProjectsResolved, getProjectSlugsResolved } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import Reveal from '@/components/Reveal'
import ParallaxHero from '@/components/ParallaxHero'
import BentoWorkGrid from '@/components/BentoWorkGrid'
import ServiceTagCloud from '@/components/ServiceTagCloud'



export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return seoToMetadata(getWorkIndex().seo, '/work')
}

export default async function WorkPage() {
  const projects = await getAllProjectsResolved()
  const slugs = await getProjectSlugsResolved()
  const serviceTagMap = new Map<string, { slug: string; title: string; count: number }>()
  for (const project of projects) {
    for (const tag of project.serviceTags || []) {
      const bareSlug = tag.slug.replace(/^\/services\/+/, '')
      if (!bareSlug) continue
      const entry = serviceTagMap.get(bareSlug)
      if (entry) entry.count += 1
      else serviceTagMap.set(bareSlug, { slug: bareSlug, title: tag.title, count: 1 })
    }
  }
  const serviceTags = [...serviceTagMap.values()].sort((a, b) => b.count - a.count)
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

      {serviceTags.length > 0 && (
        <section className="section border-t border-white/10">
          <Reveal className="max-w-[1120px] mx-auto">
            <h2 className="heading-sm text-white/75 mb-8">Browse by Service</h2>
            <ServiceTagCloud tags={serviceTags} />
          </Reveal>
        </section>
      )}

      {/* Project previews — asymmetric bento grid */}
      <section className="section border-t border-white/10">
        <Reveal className="max-w-[1120px] mx-auto">
          <BentoWorkGrid
            projects={rows.map(({ slug, project }) => ({
              slug,
              title: project.title,
              client: project.metadata?.client,
              tags: project.hero?.tags,
              image:
                project.images?.find((img) => img.url && img.url !== '')?.url ||
                project.seo?.og?.image ||
                '/og-default.jpg',
              alt: project.title,
            }))}
          />
        </Reveal>
      </section>

      {/* CTA */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-5">Have a <span className="text-[var(--accent)]">project</span> in mind?</h2>
          <p className="text-base text-white/70 mb-8">Let&apos;s talk about how we can bring your vision to life.</p>
          <Link href="/book" className="btn-primary btn-primary--accent">Start a Conversation</Link>
        </div>
      </section>
    </>
  )
}

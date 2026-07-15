import type { Metadata } from 'next'
import Link from 'next/link'
import { getWorkIndex, normalizeProjectSlug } from '@/lib/json-content'
import { getAllProjectsResolved, getProjectSlugsResolved, getProjectTagsResolved } from '@/lib/content'
import { humanizeTag } from '@/lib/tags'
import { seoToMetadata } from '@/lib/metadata'
import Reveal from '@/components/Reveal'
import ParallaxHero from '@/components/ParallaxHero'
import BentoWorkGrid from '@/components/BentoWorkGrid'
import LedTagWall from '@/components/LedTagWall'



export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return seoToMetadata(getWorkIndex().seo)
}

export default async function WorkPage() {
  const projects = await getAllProjectsResolved()
  const slugs = await getProjectSlugsResolved()
  const tags = await getProjectTagsResolved()
  const tagCounts = tags.reduce((acc, tag) => {
    acc[tag] = projects.filter((p) => p.tags.includes(tag)).length
    return acc
  }, {} as Record<string, number>)
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
        <LedTagWall
          tags={tags.map((tag) => ({ slug: tag, label: humanizeTag(tag), count: tagCounts[tag] }))}
        />
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
          <h2 className="heading-md mb-5">Have a project in mind?</h2>
          <p className="text-base text-white/70 mb-8">Let&apos;s talk about how we can bring your vision to life.</p>
          <Link href="/book" className="btn-primary">Start a Conversation</Link>
        </div>
      </section>
    </>
  )
}

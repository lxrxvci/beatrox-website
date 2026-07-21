import Link from 'next/link'
import { getFeaturedProjectsResolved } from '@/lib/content'
import BentoWorkGrid from '@/components/BentoWorkGrid'
import ScrollPanel from './ScrollPanel'

const FEATURED_SLUGS = ['run-for-the-oceans', 'aku-world', 'projekt-x', 'myshelter']

export default async function WorkTeaser() {
  const featuredProjects = await getFeaturedProjectsResolved(FEATURED_SLUGS)
  const projectsBySlug = new Map(featuredProjects.map((project) => [project.canonicalSlug, project]))

  const featured = FEATURED_SLUGS.map((slug) => ({ slug, project: projectsBySlug.get(slug) })).filter(
    (row): row is { slug: string; project: (typeof featuredProjects)[number] } => Boolean(row.project),
  )

  const bentoProjects = featured.map(({ project, slug }) => {
    const firstImage = project.images?.find((img) => img.url && img.url !== '')
    return {
      slug,
      title: project.title,
      client: project.metadata?.client,
      tags: project.hero?.tags,
      image: firstImage?.url || project.seo?.og?.image || '/og-default.jpg',
      alt: firstImage?.alt || project.title,
    }
  })

  return (
    <ScrollPanel id="work" className="border-t border-white/10 bg-[var(--bg-primary)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="overline mb-4">Work</p>
          <h2 className="heading-lg">Selected projects</h2>
        </div>
        <Link
          href="/work"
          className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white"
        >
          View All Work →
        </Link>
      </div>
      <div>
        <BentoWorkGrid projects={bentoProjects} />
      </div>
    </ScrollPanel>
  )
}

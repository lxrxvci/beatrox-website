import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllProjects, getProjectSlugs, getProjectTags, getWorkIndex, normalizeProjectSlug } from '@/lib/json-content'
import { seoToMetadata } from '@/lib/metadata'
import Reveal from '@/components/Reveal'
import ParallaxHero from '@/components/ParallaxHero'
import BentoWorkGrid from '@/components/BentoWorkGrid'

/** Humanize kebab-case tags: "ai-computer-vision" → "AI & Computer Vision". */
function humanize(tag: string) {
  return tag
    .split('-')
    .map((w) => (w === 'ai' ? 'AI' : w === 'and' ? '&' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

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
                <Link
                  key={tag}
                  href={`/work/tag/${tag}`}
                  className="mono text-xs uppercase text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors border-b border-transparent hover:border-[var(--accent)] pb-0.5"
                >
                  {humanize(tag)}
                </Link>
              ))}
            </div>
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
          <h2 className="heading-md mb-5">Have a project in mind?</h2>
          <p className="text-base text-white/70 mb-8">Let&apos;s talk about how we can bring your vision to life.</p>
          <Link href="/contact" className="btn-primary">Start a Conversation</Link>
        </div>
      </section>
    </>
  )
}

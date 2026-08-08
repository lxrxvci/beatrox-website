import type { Metadata } from 'next'
import Link from 'next/link'
import { getWorkIndex, normalizeProjectSlug } from '@/lib/json-content'
import { getAllProjectsResolved, getProjectSlugsResolved } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import { buildBreadcrumbSchema } from '@/lib/schema'
import JsonLd from '@/components/JsonLd'
import Reveal from '@/components/Reveal'
import ParallaxHero from '@/components/ParallaxHero'
import BentoWorkGrid from '@/components/BentoWorkGrid'
import ServiceTagCloud from '@/components/ServiceTagCloud'



export const revalidate = 300

// Field notes: one-sentence proof units for the work index (VTProDesign
// pattern). Every client entity links to its project page.
const FIELD_NOTES: Array<{ client: string; href: string; note: string }> = [
  {
    client: 'Adidas, Run for the Oceans',
    href: '/work/run-for-the-oceans',
    note: 'A LIDAR-driven interactive whale projection anchoring a global sustainability activation.',
  },
  {
    client: 'Netflix at Comic-Con',
    href: '/work/disenchantment',
    note: 'Exhibition environments for Disenchantment and El Camino, built for the convention floor.',
  },
  {
    client: 'Adidas at Super Bowl 2020',
    href: '/work/super-bowl-2020',
    note: 'An interactive AR mirror in front of one of the biggest audiences in sports.',
  },
  {
    client: 'PROJECTING CHANGE: Racing Extinction',
    href: '/work/projecting-change-racing-extinction',
    note: 'Endangered species projected onto the Empire State Building and the Vatican.',
  },
  {
    client: 'Amazon Music, Infinite Playlist',
    href: '/work/infinite-playlist',
    note: 'Interactive festival experiences at Outside Lands and Stagecoach.',
  },
  {
    client: 'AKU World',
    href: '/work/aku-world',
    note: 'An immersive NFT Miami environment built around a 4D body scanner.',
  },
]

// Stats strip: atomized proof, verifiable numbers only.
const WORK_STATS: Array<{ value: string; label: string }> = [
  { value: '15', label: 'Years producing, founded 2011 in Portland, Oregon' },
  { value: '17', label: 'Flagship productions for global brands' },
  { value: '2', label: 'World landmarks projected: the Empire State Building and the Vatican' },
  { value: '46', label: 'Services under one roof, design through strike' },
]

export async function generateMetadata(): Promise<Metadata> {
  return seoToMetadata(getWorkIndex().seo, '/work')
}

export default async function WorkPage({ preview = false }: { preview?: boolean }) {
  const projects = await getAllProjectsResolved(preview)
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
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Our Work',
            url: 'https://www.beatrox.com/work',
            description:
              'Flagship event production and experiential projects by Beatrox: Super Bowl activations, Comic-Con environments, festival builds, and landmark projections for global brands.',
          },
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Work', path: '/work' },
          ]),
        ]}
      />
      <ParallaxHero
        imageSrc={heroImage}
        imageAlt="Work page hero"
        eyebrow="Portfolio"
        title="Our Work"
        description="Permanent installations. Touring spectacles. Global activations. Every project is a new frontier."
        minHeightClass="min-h-[94svh]"
      />

      {/* Selected work, compact positioning paragraph (GES pattern, see
          reports/work-page-restructure-plan.md). The old 4-paragraph block is
          atomized into the field notes + stats below; every named entity links
          to its project page. */}
      <section className="section border-t border-white/10">
        <Reveal className="max-w-[1120px] mx-auto">
          <h2 className="heading-md mb-8">Selected Work for Brands That Don&apos;t Do Small</h2>
          <p className="text-base text-white leading-relaxed max-w-3xl">
            Beatrox produces work for brands that don&apos;t do small: Super Bowl activations,
            Comic-Con environments, festival builds, and permanent landmark installations.
            Every project below was designed, fabricated, and operated end to end by one
            accountable team from our Portland, Oregon headquarters.
          </p>
        </Reveal>
      </section>

      {/* Field notes: one-sentence proof units (VTProDesign pattern). Client
          entities stay in crawlable text and each links to its project. */}
      <section className="section border-t border-white/10">
        <div className="max-w-[1120px] mx-auto">
          <p className="overline mb-10">Field Notes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
            {FIELD_NOTES.map((note, index) => (
              <Reveal key={note.href} delayMs={index * 100}>
                <p className="font-mono text-xs text-[var(--accent)] mb-3">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="text-base font-semibold text-white mb-2">
                  <Link href={note.href} className="transition-colors hover:text-[var(--accent)]">
                    {note.client}
                  </Link>
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">{note.note}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip: atomized proof, verifiable numbers only */}
      <section className="section border-t border-white/10">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {WORK_STATS.map((stat, index) => (
              <Reveal key={stat.label} delayMs={index * 100}>
                <p className="heading-md text-[var(--accent)] mb-2">{stat.value}</p>
                <p className="text-sm text-white/80 leading-relaxed">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Project previews, asymmetric bento grid */}
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

      {serviceTags.length > 0 && (
        <section className="section border-t border-white/10">
          <Reveal className="max-w-[1120px] mx-auto">
            <h2 className="hud-label mb-8">Browse by Service</h2>
            <ServiceTagCloud tags={serviceTags} />
          </Reveal>
        </section>
      )}

      {/* CTA */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-5">Have a <span className="text-[var(--accent)]">project</span> in mind?</h2>
          <p className="text-base text-white mb-8">Tell us what you&apos;re trying to build and our Portland team will scope it.</p>
          <Link href="/book" className="btn-primary btn-primary--accent">Start a Conversation</Link>
        </div>
      </section>
    </>
  )
}

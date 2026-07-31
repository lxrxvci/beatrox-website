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
      <ParallaxHero
        imageSrc={heroImage}
        imageAlt="Work page hero"
        eyebrow="Portfolio"
        title="Our Work"
        description="Permanent installations. Touring spectacles. Global activations. Every project is a new frontier."
        minHeightClass="min-h-[94svh]"
      />

      {/* Selected work — SEO intro */}
      <section className="section border-t border-white/10">
        <Reveal className="max-w-[1120px] mx-auto space-y-8">
          <h2 className="heading-md">Selected Work for Brands That Don&apos;t Do Small</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base text-white leading-relaxed">
            <div className="space-y-4">
              <p>
                Beatrox productions have carried some of the world&apos;s most recognizable names. For Netflix,
                we built Comic-Con exhibition environments for Disenchantment and El Camino. BuzzFeed trusted us
                with the stage design, media walls, and full production of their NewFronts presentation in New
                York. Adidas has returned to us repeatedly — from the Run for the Oceans activation with its
                LIDAR-driven interactive whale projection, to the 40-foot interactive Destination canvas at
                Horton Plaza with Journey&apos;s.
              </p>
              <p>
                For Amazon Music&apos;s Infinite Playlist tour, we designed and produced interactive festival
                experiences at Outside Lands and Stagecoach — custom photobooths, AR content, and stage
                production for artists including Mariah the Scientist. CNN brought us in for the Road to 270
                election coverage, and for Super Bowl 2020 we built an interactive AR mirror experience for one
                of the biggest audiences in sports.
              </p>
            </div>
            <div className="space-y-4">
              <p>
                Our projection work has reached genuine landmarks: the DUBAI 360 spherical projection theatre,
                and large-format building projections for PROJECTING CHANGE: Racing Extinction — the campaign
                that put endangered species on the Empire State Building and the Vatican. Toyota x MTV tapped
                us for the G-MAN experiential campaign, FLIR for a permanent interactive history wall, and AKU
                World for an immersive NFT Miami environment complete with a 4D body scanner.
              </p>
              <p>
                Every one of these productions was delivered end to end by one accountable team — design,
                fabrication, AV integration, and show operation — from our headquarters in Portland, Oregon to
                stages across the country. Explore the projects below.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

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
          <p className="text-base text-white mb-8">Let&apos;s talk about how we can bring your vision to life.</p>
          <Link href="/book" className="btn-primary btn-primary--accent">Start a Conversation</Link>
        </div>
      </section>
    </>
  )
}

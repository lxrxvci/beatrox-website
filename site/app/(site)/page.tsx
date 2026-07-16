import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getHomepageResolved, getAllProjectsResolved } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import Reveal from '@/components/Reveal'
import HeroMedia from '@/components/HeroMedia'
import HomeHero from '@/components/HomeHero'
import BentoWorkGrid from '@/components/BentoWorkGrid'
import CapabilitiesTicker from '@/components/CapabilitiesTicker'
import Marquee from '@/components/Marquee'
import MagneticButton from '@/components/MagneticButton'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const data = await getHomepageResolved()
  return seoToMetadata(data.seo)
}

const CAPABILITIES = [
  'Custom Fabrication',
  'LED Video Wall',
  'Drone Light Shows',
  'Stage Design',
  'Experiential Events',
  'Event Production',
  'Immersive Environments',
  'Laser Light Shows',
  'Multimedia Displays',
  'DJ Equipment Rentals',
  'Audio Production',
  'Projection Mapping',
]

export default async function HomePage() {
  const data = await getHomepageResolved()
  const allProjects = await getAllProjectsResolved()
  const heroImage = data.media.heroImage || '/og-default.jpg'
  const galleryImages = data.media.galleryImages || []
  const projectsBySlug = new Map(allProjects.map((project) => [project.canonicalSlug, project]))

  // Featured 4 projects for homepage grid
  const featuredSlugs = ['run-for-the-oceans', 'aku-world', 'projekt-x', 'myshelter']
  const featured = featuredSlugs
    .map((slug) => ({ slug, project: projectsBySlug.get(slug) }))
    .filter((row): row is { slug: string; project: (typeof allProjects)[number] } => Boolean(row.project))

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex flex-col justify-end hero overflow-hidden bg-black border-b border-white/10">
        <HeroMedia imageSrc={heroImage} imageAlt="BEATROX hero media" />
        <HomeHero />
      </section>

      {/* ── Philosophy ────────────────────────────────────────────────────── */}
      <section className="section border-t border-white/10">
        <Reveal className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                heading: 'Who We Are',
                body: "Engineers, artists, and architects of awe. We build the things people can't stop talking about.",
              },
              {
                heading: 'What We Do',
                body: 'From concept to curtain call — design, fabrication, deployment, and operation. Full spectrum, zero compromise.',
              },
              {
                heading: 'How We Do It',
                body: "Your vision + our obsession. We prototype fast, iterate relentlessly, and only stop when it's extraordinary.",
              },
            ].map((col) => (
              <div key={col.heading}>
                <h2 className="heading-sm text-[var(--accent)] mb-4">{col.heading}</h2>
                <p className="text-base text-white/75 leading-relaxed">{col.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {galleryImages.length > 0 && (
        <section className="section border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
            {galleryImages.slice(0, 6).map((img, idx) => (
              <div key={`${img}-${idx}`} className="relative h-52 md:h-64 bg-neutral-950 overflow-hidden">
                <Image
                  src={img}
                  alt={`Homepage media ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Capabilities Ticker ───────────────────────────────────────────── */}
      <section className="py-16 border-t border-[var(--border)] overflow-hidden" aria-label="Tech capabilities">
        <h2 className="sr-only">Tech Capabilities</h2>
        <CapabilitiesTicker items={CAPABILITIES} />
      </section>

      {/* ── Featured Work ─────────────────────────────────────────────────── */}
      <section className="section border-t border-white/10">
        <Reveal className="max-w-[1120px] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <h2 className="heading-lg">Work</h2>
            <Link href="/work" className="text-sm font-semibold tracking-[0.18em] uppercase text-white/70 hover:text-white transition-colors">
              View All →
            </Link>
          </div>
          <BentoWorkGrid
            projects={featured.map(({ project, slug }) => {
              const firstImage = project.images?.find(img => img.url && img.url !== '')
              return {
                slug,
                title: project.title,
                client: project.metadata?.client,
                tags: project.hero?.tags,
                image: firstImage?.url || project.seo?.og?.image || '/og-default.jpg',
                alt: firstImage?.alt || project.title,
              }
            })}
          />
        </Reveal>
      </section>

      {/* ── Infinite Marquee ──────────────────────────────────────────────── */}
      <Marquee
        items={(galleryImages.length > 0
          ? galleryImages.slice(0, 8).map((img, idx) => ({ src: img, alt: `Project highlight ${idx + 1}` }))
          : featured.map(({ project, slug }) => {
              const firstImage = project.images?.find(img => img.url && img.url !== '')
              return {
                src: firstImage?.url || project.seo?.og?.image || '/og-default.jpg',
                alt: `${project.title} (${slug})`,
              }
            })
        )}
      />

      {/* ── CTA Bar ───────────────────────────────────────────────────────── */}
      <section className="section border-t border-[var(--border)] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="heading-lg mb-5">Let&apos;s Build Something Extraordinary</h2>
          <p className="text-base text-[var(--text-secondary)] mb-10 leading-relaxed">
            Every great experience starts with a conversation.
          </p>
          <MagneticButton href="/book" variant="accent">Start a Project</MagneticButton>
        </div>
      </section>
    </>
  )
}

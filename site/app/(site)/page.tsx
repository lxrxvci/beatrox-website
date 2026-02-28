import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getHomepage, getAllProjectsResolved } from '@/lib/content'
import Reveal from '@/components/Reveal'

export async function generateMetadata(): Promise<Metadata> {
  const data = getHomepage()
  return {
    title: data.seo.title,
    description: data.seo.description,
    openGraph: {
      title: data.seo.og.title,
      description: data.seo.og.description,
      images: [data.seo.og.image],
    },
  }
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
  const data = getHomepage()
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
      <section className="relative min-h-[100svh] flex flex-col justify-end pb-24 px-6 lg:px-10 pt-24 overflow-hidden bg-black border-b border-white/10">
        <Image
          src={heroImage}
          alt="BEATROX hero media"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black pointer-events-none" />

        <div className="relative max-w-[1120px] mx-auto w-full pb-6 lg:pb-10">
          <p className="heading-sm text-white/50 mb-6">Experiential Design & Event Production</p>
          <h1 className="heading-xl max-w-5xl mb-8">
            {data.hero.headline}
          </h1>
          <p className="text-base text-white/70 max-w-xl mb-10 leading-relaxed">
            {data.hero.subheadline}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={data.hero.cta.url} className="btn-primary">{data.hero.cta.label}</Link>
            <Link href={data.hero.secondaryCta.url} className="btn-ghost">{data.hero.secondaryCta.label}</Link>
          </div>
        </div>
      </section>

      {/* ── Philosophy ────────────────────────────────────────────────────── */}
      <section className="section border-t border-white/10">
        <Reveal className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {data.sections.find(s => s.type === 'philosophy')?.columns?.map((col) => (
              <div key={col.heading}>
                <h2 className="heading-sm text-white/40 mb-4">{col.heading}</h2>
                <p className="text-sm text-white/70 leading-relaxed">{col.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {galleryImages.length > 0 && (
        <section className="border-t border-white/10">
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

      {/* ── Capabilities Grid ─────────────────────────────────────────────── */}
      <section className="section border-t border-white/10">
        <Reveal className="max-w-[1120px] mx-auto">
          <h2 className="heading-sm text-white/40 mb-12">Tech Capabilities</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-white/10">
            {CAPABILITIES.map(cap => (
              <div key={cap} className="bg-black px-6 py-5 flex items-center">
                <span className="text-xs font-medium tracking-[0.1em] uppercase text-white/70">{cap}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Featured Work ─────────────────────────────────────────────────── */}
      <section className="section border-t border-white/10">
        <Reveal className="max-w-[1120px] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <h2 className="heading-lg">Work</h2>
            <Link href="/work" className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10">
            {featured.map(({ project, slug }) => {
              const firstImage = project.images?.find(img => img.url && img.url !== '')
              const imgSrc = firstImage?.url || project.seo?.og?.image || '/og-default.jpg'
              return (
                <Link
                  key={slug}
                  href={`/work/${slug}`}
                  className="project-card relative aspect-square overflow-hidden bg-neutral-950 group block"
                >
                  <Image
                    src={imgSrc}
                    alt={firstImage?.alt || project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="project-card-overlay">
                    <div>
                      <p className="heading-sm text-white mb-2">{project.title}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {project.hero?.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </Reveal>
      </section>

      {/* ── CTA Bar ───────────────────────────────────────────────────────── */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="heading-lg mb-4">Ready to create something extraordinary?</h2>
          <p className="text-sm text-white/50 mb-10 leading-relaxed">
            Our team of technical and creative directors is ready to help you bring your vision to life.
          </p>
          <Link href="/contact" className="btn-primary">Book a Discovery Call</Link>
        </div>
      </section>
    </>
  )
}

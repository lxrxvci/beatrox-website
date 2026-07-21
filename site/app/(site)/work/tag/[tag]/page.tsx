import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CTASection from '@/components/CTASection'
import { normalizeProjectTag } from '@/lib/json-content'
import { getProjectsByTagResolved, getProjectTagsResolved } from '@/lib/content'
import { humanizeTag } from '@/lib/tags'

export const revalidate = 300

interface Props {
  params: Promise<{ tag: string }>
}

export async function generateStaticParams() {
  const tags = await getProjectTagsResolved()
  return tags.map((tag) => ({ tag }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const normalizedTag = normalizeProjectTag(tag)
  if (!normalizedTag) return {}
  const displayTag = humanizeTag(normalizedTag)
  return {
    title: `Work tagged "${displayTag}"`,
    description: `Portfolio projects tagged ${displayTag}.`,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `Work tagged "${displayTag}" — BEATROX`,
      description: `Portfolio projects tagged ${displayTag}.`,
      images: ['/og-default.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Work tagged "${displayTag}" — BEATROX`,
      description: `Portfolio projects tagged ${displayTag}.`,
      images: ['/og-default.jpg'],
    },
    alternates: {
      canonical: `/work/tag/${normalizedTag}`,
    },
  }
}

export default async function WorkTagPage({ params }: Props) {
  const { tag } = await params
  const normalizedTag = normalizeProjectTag(tag)
  if (!normalizedTag) notFound()

  const projects = await getProjectsByTagResolved(normalizedTag)
  if (projects.length === 0) notFound()

  const displayTag = humanizeTag(normalizedTag)

  const heroImage =
    projects[0]?.images?.find((img) => img.url && img.url !== '')?.url ||
    projects[0]?.seo?.og?.image ||
    '/og-default.jpg'

  return (
    <>
      <section className="relative hero min-h-[42vh] flex flex-col justify-end overflow-hidden bg-black">
        <Image src={heroImage} alt={`Projects tagged ${normalizedTag}`} fill priority sizes="100vw" className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="relative max-w-[1400px] mx-auto w-full">
          <Link href="/work" className="text-sm tracking-[0.18em] uppercase text-white/80 hover:text-white transition-colors mb-6 inline-block">
            ← Work
          </Link>
          <p className="heading-sm text-white/75 mb-3">Tag</p>
          <h1 className="heading-xl max-w-3xl">{displayTag}</h1>
        </div>
      </section>

      <section className="border-t border-white/10 section">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10">
            {projects.map((project) => (
              <Link
                key={project.canonicalSlug}
                href={`/work/${project.canonicalSlug}`}
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
                    <p className="heading-sm text-white leading-[1.4] mb-3 break-words">{project.title}</p>
                    {project.metadata?.client && (
                      <p className="text-sm text-white/75 tracking-[0.12em] uppercase mb-3">
                        {project.metadata.client}
                      </p>
                    )}
                    {/* Same minimal tag treatment as BentoWorkGrid: plain mono
                        text (no bordered pills) capped at 2 below sm, so tags
                        never crowd the card art on mobile. */}
                    <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                      {(project.tags || []).slice(0, 3).map((projectTag, tagIndex) => (
                        <span
                          key={projectTag}
                          className={`mono text-[10px] sm:text-[11px] uppercase${
                            projectTag === normalizedTag
                              ? ' text-white'
                              : ' text-[var(--text-secondary)]'
                          }${tagIndex > 1 ? ' hidden sm:inline' : ''}`}
                        >
                          {humanizeTag(projectTag)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        heading={`Interested in ${displayTag} projects?`}
        subheading="Let's talk about how we can deliver the same impact for your event."
        primaryLabel="Start Your Project"
        primaryHref="/book"
        secondaryLabel="Explore Services"
        secondaryHref="/services"
        accentWord={displayTag}
      />
    </>
  )
}

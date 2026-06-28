import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjectsByTag, getProjectTags, normalizeProjectTag } from '@/lib/json-content'

interface Props {
  params: Promise<{ tag: string }>
}

export function generateStaticParams() {
  return getProjectTags().map((tag) => ({ tag }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const normalizedTag = normalizeProjectTag(tag)
  if (!normalizedTag) return {}
  return {
    title: `Work tagged "${normalizedTag}"`,
    description: `Portfolio projects tagged ${normalizedTag}.`,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `Work tagged "${normalizedTag}" — BEATROX`,
      description: `Portfolio projects tagged ${normalizedTag}.`,
      images: ['/og-default.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Work tagged "${normalizedTag}" — BEATROX`,
      description: `Portfolio projects tagged ${normalizedTag}.`,
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

  const projects = getProjectsByTag(normalizedTag)
  if (projects.length === 0) notFound()

  const heroImage =
    projects[0]?.images?.find((img) => img.url && img.url !== '')?.url ||
    projects[0]?.seo?.og?.image ||
    '/og-default.jpg'

  return (
    <>
      <section className="relative pt-24 min-h-[42vh] flex flex-col justify-end overflow-hidden bg-black">
        <Image src={heroImage} alt={`Projects tagged ${normalizedTag}`} fill priority sizes="100vw" className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="relative max-w-[1400px] mx-auto w-full px-6 lg:px-10 pb-14">
          <Link href="/work" className="text-[0.65rem] tracking-[0.2em] uppercase text-white/35 hover:text-white transition-colors mb-6 inline-block">
            ← Work
          </Link>
          <p className="heading-sm text-white/40 mb-3">Tag</p>
          <h1 className="heading-xl max-w-3xl">{normalizedTag}</h1>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 lg:px-10 py-16 lg:py-24">
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
                    <p className="heading-sm text-white mb-2">{project.title}</p>
                    {project.metadata?.client && (
                      <p className="text-[0.65rem] text-white/35 tracking-[0.16em] uppercase mb-2">
                        {project.metadata.client}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {(project.tags || []).slice(0, 4).map((projectTag) => (
                        <span key={projectTag} className={`tag ${projectTag === normalizedTag ? 'border-white/60' : ''}`}>
                          {projectTag}
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
    </>
  )
}

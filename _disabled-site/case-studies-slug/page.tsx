import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCaseStudyResolved, getCaseStudySlugsResolved, normalizeCaseStudySlug } from '@/lib/content'
import VideoEmbedStrip from '@/components/VideoEmbedStrip'
import ProjectGallery from '@/components/ProjectGallery'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return (await getCaseStudySlugsResolved()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const caseStudy = await getCaseStudyResolved(normalizeCaseStudySlug(slug))
  if (!caseStudy) return {}
  return {
    title: caseStudy.seo.title,
    description: caseStudy.seo.description,
    openGraph: {
      title: caseStudy.seo.og.title,
      description: caseStudy.seo.og.description,
      images: [caseStudy.seo.og.image],
    },
  }
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const caseStudy = await getCaseStudyResolved(normalizeCaseStudySlug(slug))
  if (!caseStudy) notFound()

  const validImages = caseStudy.images?.filter((img) => img.url && img.url !== '') ?? []
  const heroImage = validImages[0]

  return (
    <>
      <section className="relative pt-24 min-h-[60vh] flex flex-col justify-end overflow-hidden bg-black">
        {heroImage && (
          <>
            <Image src={heroImage.url} alt={heroImage.alt} fill priority sizes="100vw" className="object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </>
        )}
        <div className="relative max-w-[1400px] mx-auto w-full px-6 lg:px-10 pb-16">
          <Link href="/case-studies" className="text-[0.65rem] tracking-[0.2em] uppercase text-white/30 hover:text-white transition-colors mb-8 inline-block">
            ← Case Studies
          </Link>
          <p className="heading-sm text-white/40 mb-3">{caseStudy.metadata.type}</p>
          <h1 className="heading-xl max-w-3xl">{caseStudy.title}</h1>
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-16">
            <aside className="space-y-8">
              {caseStudy.metadata.client && (
                <div>
                  <p className="heading-sm text-white/30 mb-2">Client</p>
                  <p className="text-sm text-white/80">{caseStudy.metadata.client}</p>
                </div>
              )}
              {caseStudy.metadata.location && (
                <div>
                  <p className="heading-sm text-white/30 mb-2">Location</p>
                  <p className="text-sm text-white/80">{caseStudy.metadata.location}</p>
                </div>
              )}
              {caseStudy.metadata.type && (
                <div>
                  <p className="heading-sm text-white/30 mb-2">Type</p>
                  <p className="text-sm text-white/80">{caseStudy.metadata.type}</p>
                </div>
              )}
            </aside>

            <div className="space-y-12">
              {caseStudy.body.map((block, i) => (
                <div key={i}>
                  {block.heading && <h2 className="heading-sm text-white/40 mb-4">{block.heading}</h2>}
                  {block.content && <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">{block.content}</p>}
                  {block.items && (
                    <ul className="space-y-2 mt-2">
                      {block.items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                          <span className="text-white/20 mt-1">—</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {validImages.length > 0 && (
        <section className="border-t border-white/10">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4 mb-2">
            <p className="heading-sm text-white/30">Gallery</p>
          </div>
          <ProjectGallery images={validImages} />
        </section>
      )}

      {caseStudy.videos && caseStudy.videos.length > 0 && <VideoEmbedStrip title="Case Study Video" videos={caseStudy.videos} />}
    </>
  )
}

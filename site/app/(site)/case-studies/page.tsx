import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getAllCaseStudiesResolved } from '@/lib/content'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Case Studies',
    description: 'Execution-focused case studies from BEATROX production work.',
  }
}

export default async function CaseStudiesPage() {
  const caseStudies = await getAllCaseStudiesResolved()
  const heroImage =
    caseStudies[0]?.images?.find((img) => img.url && img.url !== '')?.url ||
    caseStudies[0]?.seo?.og?.image ||
    '/og-default.jpg'

  return (
    <>
      <section className="relative pt-24 min-h-[48vh] flex flex-col justify-end overflow-hidden bg-black">
        <Image src={heroImage} alt="Case studies hero" fill priority sizes="100vw" className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="relative max-w-[1400px] mx-auto w-full px-6 lg:px-10 pb-14">
          <p className="heading-sm text-white/40 mb-3">Sprint Execution</p>
          <h1 className="heading-xl max-w-3xl">Case Studies</h1>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 lg:px-10 py-16 lg:py-24">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10">
            {caseStudies.map((entry) => (
              <Link
                key={entry.canonicalSlug}
                href={`/case-studies/${entry.canonicalSlug}`}
                className="project-card relative aspect-[16/10] overflow-hidden bg-neutral-950 group block"
              >
                <Image
                  src={entry.images?.find((img) => img.url && img.url !== '')?.url || entry.seo?.og?.image || '/og-default.jpg'}
                  alt={entry.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="project-card-overlay">
                  <div>
                    <p className="heading-sm text-white mb-2">{entry.title}</p>
                    {entry.metadata?.client && (
                      <p className="text-[0.65rem] text-white/35 tracking-[0.16em] uppercase mb-2">{entry.metadata.client}</p>
                    )}
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

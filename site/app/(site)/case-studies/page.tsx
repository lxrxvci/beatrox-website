import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getAllCaseStudiesResolved } from '@/lib/content'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Case Studies',
    description: 'Execution-focused case studies from BEATROX production work.',
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: 'Case Studies — BEATROX',
      description: 'Execution-focused case studies from BEATROX production work.',
      images: ['/og-default.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Case Studies — BEATROX',
      description: 'Execution-focused case studies from BEATROX production work.',
      images: ['/og-default.jpg'],
    },
    alternates: {
      canonical: '/case-studies',
    },
  }
}

export default async function CaseStudiesPage() {
  const caseStudies = await getAllCaseStudiesResolved()

  return (
    <>
      <section className="relative hero min-h-[48vh] flex flex-col justify-end overflow-hidden bg-black">
        <Image src="/og-default.jpg" alt="Case studies hero" fill priority sizes="100vw" className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="relative max-w-[1400px] mx-auto w-full">
          <p className="heading-sm text-white/75 mb-3">Sprint Execution</p>
          <h1 className="heading-xl max-w-3xl">Case Studies</h1>
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="max-w-[1120px] mx-auto">
          {caseStudies.length === 0 ? (
            <p className="text-base text-white/70">Case studies coming soon.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10">
              {caseStudies.map((study) => {
                const firstImage = study.images?.find((img) => img.url && img.url !== '')
                const image = firstImage?.url || study.seo?.og?.image || '/og-default.jpg'
                return (
                  <Link
                    key={study.canonicalSlug}
                    href={`/case-studies/${study.canonicalSlug}`}
                    className="group relative block bg-black overflow-hidden"
                  >
                    <div className="relative h-64 md:h-80 overflow-hidden">
                      <Image
                        src={image}
                        alt={firstImage?.alt || study.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    </div>
                    <div className="relative p-6 md:p-8">
                      {study.metadata?.type && (
                        <p className="heading-sm text-white/40 mb-2">{study.metadata.type}</p>
                      )}
                      <h2 className="heading-md text-white group-hover:text-[var(--accent)] transition-colors">
                        {study.title}
                      </h2>
                      {study.metadata?.client && (
                        <p className="text-sm text-white/60 mt-2">{study.metadata.client}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-5">Have a project in mind?</h2>
          <p className="text-base text-white/70 mb-8 leading-relaxed">
            Let&apos;s talk about how we can bring your vision to life with our full-service production capabilities.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/book" className="btn-primary">Start Your Project</Link>
            <Link href="/services" className="btn-ghost">Explore Services</Link>
          </div>
        </div>
      </section>
    </>
  )
}

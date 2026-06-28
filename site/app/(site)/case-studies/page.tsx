import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

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

export default function CaseStudiesPage() {
  return (
    <>
      <section className="relative pt-24 min-h-[48vh] flex flex-col justify-end overflow-hidden bg-black">
        <Image src="/og-default.jpg" alt="Case studies hero" fill priority sizes="100vw" className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="relative max-w-[1400px] mx-auto w-full px-6 lg:px-10 pb-14">
          <p className="heading-sm text-white/40 mb-3">Sprint Execution</p>
          <h1 className="heading-xl max-w-3xl">Case Studies</h1>
        </div>
      </section>

      <section className="section border-t border-white/10">
        <div className="max-w-[1120px] mx-auto">
          <p className="text-sm text-white/50">Case studies coming soon.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-4">Have a project in mind?</h2>
          <p className="text-sm text-white/50 mb-8 leading-relaxed">
            Let&apos;s talk about how we can bring your vision to life with our full-service production capabilities.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="btn-primary">Start Your Project</Link>
            <Link href="/services" className="btn-ghost">Explore Services</Link>
          </div>
        </div>
      </section>
    </>
  )
}

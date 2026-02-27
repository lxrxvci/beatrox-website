import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getAbout } from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  const data = getAbout()
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

export default function AboutPage() {
  const data = getAbout()
  const heroImage = data.media?.heroImage || '/og-default.jpg'
  const sectionImages = data.media?.sectionImages || []
  const story = data.sections.find((s) => s.type === 'text_block')
  const pillars = data.sections.find((s) => s.type === 'three_column')
  const capability = data.sections.find((s) => s.type === 'capabilities_summary')

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6 lg:px-10 border-b border-white/10 overflow-hidden">
        <Image
          src={heroImage}
          alt="About page hero"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/55 to-black/90" />
        <div className="max-w-[1120px] mx-auto">
          <p className="heading-sm text-white/30 mb-4">About Us</p>
          <h1 className="heading-xl max-w-3xl">{data.hero.headline}</h1>
          <p className="text-sm text-white/50 mt-6 max-w-3xl leading-relaxed">{data.hero.subheadline}</p>
        </div>
      </section>

      {/* Core sections aligned to live structure */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-start">
          <div className="space-y-6">
            <h2 className="heading-sm text-white/35">Who are we</h2>
            <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
              {story?.body || data.hero.subheadline}
            </p>
          </div>
          {sectionImages[1] && (
            <div className="relative h-72 md:h-[420px] bg-neutral-950 overflow-hidden">
              <Image src={sectionImages[1]} alt="About supporting visual" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
            </div>
          )}
        </div>
      </section>

      {pillars?.columns && (
        <section className="section border-b border-white/10">
          <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            {pillars.columns.map((col) => (
              <div key={col.heading}>
                <h3 className="heading-sm text-white mb-4">{col.heading}</h3>
                <p className="text-sm text-white/65 leading-relaxed">{col.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {capability?.categories && (
        <section className="section border-b border-white/10">
          <div className="max-w-[1120px] mx-auto">
            <h2 className="heading-sm text-white/35 mb-8">Tech Capabilities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8">
              {capability.categories.flatMap((cat) => cat.items).map((item) => (
                <p key={item} className="text-xs text-white/65">{item}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-4">Ready to work together?</h2>
          <p className="text-sm text-white/50 mb-8">
            Our team of creative and technical directors is ready to bring your vision to life.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="btn-primary">Book a Discovery Call</Link>
            <Link href="/work" className="btn-ghost">View Our Work</Link>
          </div>
        </div>
      </section>
    </>
  )
}

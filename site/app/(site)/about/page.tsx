import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getAboutResolved, getCMSPageBySlug } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import KineticHeading from '@/components/KineticHeading'
import CMSBlockRenderer from '@/components/CMSBlockRenderer'
import Reveal from '@/components/Reveal'
import { EditableImage, EditableText } from '@/components/admin'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const data = await getAboutResolved()
  return seoToMetadata(data.seo, '/about')
}

export default async function AboutPage({ preview = false }: { preview?: boolean }) {
  const data = await getAboutResolved(preview)
  const cmsPage = await getCMSPageBySlug('about', preview)
  const heroImage = data.media?.heroImage || '/og-default.jpg'
  const sectionImages = data.media?.sectionImages || []
  const story = data.sections.find((s) => s.type === 'text_block')
  const pillars = data.sections.find((s) => s.type === 'three_column')
  const capability = data.sections.find((s) => s.type === 'capabilities_summary')

  if (cmsPage?.blocks && cmsPage.blocks.length > 0) {
    return (
      <article>
        <section className="relative hero border-b border-white/10 overflow-hidden">
          <EditableImage
            collection="pages"
            documentId={cmsPage.id}
            fieldPath="media.heroImage"
            bareRelationship
            value={heroImage}
          >
            <Image
              src={heroImage}
              alt="About page hero"
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-35"
            />
          </EditableImage>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />
          <div className="max-w-[1120px] mx-auto">
            <p className="overline mb-4">About Us</p>
            <KineticHeading text="The Team Behind the Tech" className="heading-xl max-w-3xl max-[480px]:text-[2.5rem] max-[380px]:text-[2.1rem]" />
            <p className="text-base text-white mt-6 max-w-3xl leading-relaxed">
              <EditableText collection="pages" documentId={cmsPage?.id} fieldPath="hero.subheadline" value={data.hero.subheadline}>
                {data.hero.subheadline}
              </EditableText>
            </p>
          </div>
        </section>
        <CMSBlockRenderer blocks={cmsPage.blocks} collection="pages" documentId={cmsPage.id} />
      </article>
    )
  }

  return (
    <>
      {/* Hero */}
      <section className="relative hero border-b border-white/10 overflow-hidden">
        <Image
          src={heroImage}
          alt="About page hero"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />
        <div className="max-w-[1120px] mx-auto">
          <p className="overline mb-4">About Us</p>
          <KineticHeading text="The Team Behind the Tech" className="heading-xl max-w-3xl max-[480px]:text-[2.5rem] max-[380px]:text-[2.1rem]" />
          <p className="text-base text-white mt-6 max-w-3xl leading-relaxed">{data.hero.subheadline}</p>
        </div>
      </section>

      {/* Core sections aligned to live structure */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-start">
          <div className="space-y-6">
            <h2 className="heading-sm text-white">Who are we</h2>
            <blockquote className="heading-md text-[var(--accent)] !normal-case tracking-normal leading-snug">
              &ldquo;We don&apos;t just produce events. We engineer awe.&rdquo;
            </blockquote>
            <p className="text-base text-white leading-relaxed whitespace-pre-line">
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
          <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
            {pillars.columns.map((col, colIndex) => {
              const image = sectionImages[colIndex + 1]
              return (
                <Reveal key={col.heading} delayMs={colIndex * 120}>
                  {image && (
                    <div className="relative aspect-[4/3] bg-neutral-950 overflow-hidden mb-6">
                      <Image src={image} alt={col.heading} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                    </div>
                  )}
                  <p className="font-mono text-xs text-[var(--accent)] mb-3">{String(colIndex + 1).padStart(2, '0')}</p>
                  <h3 className="heading-sm text-white mb-4">{col.heading}</h3>
                  <p className="text-base text-white leading-relaxed">{col.body}</p>
                </Reveal>
              )
            })}
          </div>
        </section>
      )}

      {capability?.categories && (
        <section className="section border-b border-white/10">
          <div className="max-w-[1120px] mx-auto">
            <h2 className="heading-sm text-white mb-8">Tech Capabilities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8">
              {capability.categories.flatMap((cat) => cat.items).map((item) => (
                <p key={item} className="text-sm text-white">{item}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-5">Ready to work <span className="text-[var(--accent)]">together</span>?</h2>
          <p className="text-base text-white mb-8">
            Our team of creative and technical directors is ready to bring your vision to life.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/book" className="btn-primary btn-primary--accent">Book a Discovery Call</Link>
            <Link href="/work" className="btn-ghost">View Our Work</Link>
          </div>
        </div>
      </section>
    </>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCMSPageBySlug, getCMSPageSlugs, type SeoMeta } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import CMSBlockRenderer from '@/components/CMSBlockRenderer'

export const dynamicParams = false
export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await getCMSPageSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getCMSPageBySlug(slug)
  if (!page) return {}

  const seo: SeoMeta = {
    title: page.seo?.title || page.title,
    description: page.seo?.description || '',
    og: {
      title: page.seo?.ogTitle || page.seo?.title || page.title,
      description: page.seo?.ogDescription || page.seo?.description || '',
      image: page.seo?.ogImage || '/og-default.jpg',
    },
  }

  return seoToMetadata(seo)
}

export default async function CMSPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getCMSPageBySlug(slug)
  if (!page) notFound()

  const hasHero = page.hero && (page.hero.headline || page.hero.subheadline)

  return (
    <article>
      {hasHero && (
        <section className="hero border-b border-white/10">
          <div className="max-w-[1120px] mx-auto">
            {page.hero?.eyebrow && <p className="overline mb-4">{page.hero.eyebrow}</p>}
            {page.hero?.headline && <h1 className="heading-xl max-w-3xl">{page.hero.headline}</h1>}
            {page.hero?.subheadline && (
              <p className="text-base text-[var(--text-secondary)] mt-6 max-w-3xl leading-relaxed">
                {page.hero.subheadline}
              </p>
            )}
            {page.hero?.cta?.label && page.hero?.cta?.url && (
              <a href={page.hero.cta.url} className="btn-primary inline-block mt-8">
                {page.hero.cta.label}
              </a>
            )}
          </div>
        </section>
      )}

      {page.blocks && page.blocks.length > 0 && (
        <CMSBlockRenderer blocks={page.blocks} collection="pages" documentId={page.id} />
      )}
    </article>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCMSPageBySlug } from '@/lib/content'
import CMSBlockRenderer from '@/components/CMSBlockRenderer'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getCMSPageBySlug(slug)
  if (!page) return {}

  const seoTitle = page.seo?.title || page.title
  const seoDescription = page.seo?.description

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: page.seo?.ogTitle || seoTitle,
      description: page.seo?.ogDescription || seoDescription,
      images: page.seo?.ogImage ? [page.seo.ogImage] : undefined,
    },
  }
}

export default async function CMSPage({ params }: Props) {
  const { slug } = await params
  const page = await getCMSPageBySlug(slug)
  if (!page) notFound()

  return (
    <>
      <section className="pt-28 pb-12 px-6 lg:px-10 border-b border-white/10">
        <div className="max-w-[1120px] mx-auto">
          <p className="heading-sm text-white/40 mb-4">Page</p>
          <h1 className="heading-xl">{page.hero?.headline || page.title}</h1>
          {page.hero?.subheadline && (
            <p className="text-sm text-white/65 mt-5 max-w-3xl">{page.hero.subheadline}</p>
          )}
        </div>
      </section>
      <CMSBlockRenderer blocks={page.blocks} />
    </>
  )
}

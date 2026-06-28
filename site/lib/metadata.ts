import type { Metadata } from 'next'
import type { SeoMeta } from './content'

export function seoToMetadata(seo: SeoMeta): Metadata {
  return {
    title: seo.title,
    description: seo.description,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: seo.og.title,
      description: seo.og.description,
      images: [seo.og.image],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.og.title,
      description: seo.og.description,
      images: [seo.og.image],
    },
  }
}

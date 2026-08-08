import type { Metadata } from 'next'
import type { SeoMeta } from './content'

export function seoToMetadata(seo: SeoMeta, canonicalPath?: string): Metadata {
  return {
    // Bypass the root layout's "%s | BEATROX" title template when the SEO
    // title already carries the brand, otherwise titles render as
    // "Services | BEATROX | BEATROX" (OP-13/OP-14).
    title: /beatrox/i.test(seo.title) ? { absolute: seo.title } : seo.title,
    description: seo.description,
    // Resolved against metadataBase (root layout: https://www.beatrox.com).
    ...(canonicalPath ? { alternates: { canonical: canonicalPath } } : {}),
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

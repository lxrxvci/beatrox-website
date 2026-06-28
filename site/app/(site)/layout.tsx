import type { Metadata } from 'next'
import '../globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import JsonLd from '@/components/JsonLd'
import { buildOrganizationSchema } from '@/lib/schema'
import { FALLBACK_SEO_DEFAULTS, FALLBACK_SITE_STYLES } from '@/lib/fallbacks'

export async function generateMetadata(): Promise<Metadata> {
  const seoDefaults = FALLBACK_SEO_DEFAULTS
  return {
    title: {
      default: seoDefaults.defaultTitle,
      template: seoDefaults.titleTemplate,
    },
    description: seoDefaults.defaultDescription,
    metadataBase: new URL('https://www.beatrox.com'),
    keywords: [
      'experiential design', 'event production', 'Portland', 'LED video walls',
      'drone light shows', 'projection mapping', 'custom fabrication',
      'stage design', 'immersive environments', 'audiovisual production',
      'lighting design', 'multimedia displays', 'live events', 'brand activation',
      'festival production', 'technical direction', 'AV system integration',
    ],
    authors: [{ name: 'BEATROX', url: 'https://www.beatrox.com' }],
    creator: 'BEATROX',
    robots: {
      index: !seoDefaults.noindexByDefault,
      follow: true,
      googleBot: {
        index: !seoDefaults.noindexByDefault,
        follow: true,
      },
    },
    openGraph: {
      siteName: seoDefaults.siteName,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoDefaults.defaultTitle,
      description: seoDefaults.defaultDescription,
      images: ['/og-default.jpg'],
    },
  }
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const styles = FALLBACK_SITE_STYLES
  const cssVars = {
    '--brand-primary': styles.brandPrimary,
    '--brand-secondary': styles.brandSecondary,
    '--site-bg': styles.backgroundColor,
    '--font-heading': styles.fontFamilyHeading,
    '--font-body': styles.fontFamilyBody,
  } as React.CSSProperties

  return (
    <div className="bg-black text-white antialiased" style={cssVars}>
      <JsonLd data={buildOrganizationSchema()} />
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

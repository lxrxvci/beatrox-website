import type { Metadata } from 'next'
import Script from 'next/script'
import '../globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import JsonLd from '@/components/JsonLd'
import { buildOrganizationSchema } from '@/lib/schema'
import { Analytics } from '@vercel/analytics/react'
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
    // Only override font variables when CMS provides explicit families;
    // otherwise the next/font variables on :root are used.
    ...(styles.fontFamilyHeading !== 'inherit' && { '--font-heading': styles.fontFamilyHeading }),
    ...(styles.fontFamilyBody !== 'inherit' && { '--font-body': styles.fontFamilyBody }),
  } as React.CSSProperties

  return (
    <div className="bg-black text-white antialiased" style={cssVars}>
      <JsonLd data={buildOrganizationSchema()} />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Nav />
      <main id="main-content">{children}</main>
      <Footer />
      <Analytics />
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}
    </div>
  )
}

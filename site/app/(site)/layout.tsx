import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { cookies } from 'next/headers'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import '../globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import SmoothScroll from '@/components/SmoothScroll'
import { AdminEditProvider, AdminOverlay } from '@/components/admin'
import JsonLd from '@/components/JsonLd'
import { buildLocalBusinessSchema, buildOrganizationSchema } from '@/lib/schema'
import { Analytics } from '@vercel/analytics/react'
import { getSeoDefaults, getSiteStyles } from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  const seoDefaults = await getSeoDefaults()
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

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const styles = await getSiteStyles()
  // httpOnly Payload session cookie — gates the admin-edit UI fetch only;
  // writes are still authenticated server-side.
  const maybeAdmin = (await cookies()).has('payload-token')
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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className="bg-black text-white antialiased" style={cssVars}>
          <JsonLd data={buildOrganizationSchema()} />
          <JsonLd data={buildLocalBusinessSchema()} />
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          {/* Film-grain atmosphere — decorative noise overlay above page
              backgrounds, below nav/admin chrome. Non-interactive, hidden
              from assistive tech. */}
          <div aria-hidden="true" className="grain-overlay" />
          <AdminEditProvider maybeAdmin={maybeAdmin}>
            <SmoothScroll>
              <Nav />
              {/* Curtain wrapper: lifts to reveal the fixed footer on desktop */}
              <main
                id="main-content"
                className="curtain-main relative z-10 bg-[var(--bg-primary)]"
              >
                {children}
              </main>
              <div className="curtain-footer lg:fixed lg:inset-x-0 lg:bottom-0 lg:z-0 lg:overflow-hidden">
                <Footer />
              </div>
            </SmoothScroll>
            <AdminOverlay />
          </AdminEditProvider>
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
      </body>
    </html>
  )
}

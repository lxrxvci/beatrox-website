import type { Metadata } from 'next'
import '../globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
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
    openGraph: {
      siteName: seoDefaults.siteName,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
    },
    robots: seoDefaults.noindexByDefault ? { index: false, follow: false } : undefined,
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const styles = await getSiteStyles()
  const cssVars = {
    '--brand-primary': styles.brandPrimary,
    '--brand-secondary': styles.brandSecondary,
    '--site-bg': styles.backgroundColor,
    '--font-heading': styles.fontFamilyHeading,
    '--font-body': styles.fontFamilyBody,
  } as React.CSSProperties

  return (
    <div className="bg-black text-white antialiased" style={cssVars}>
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

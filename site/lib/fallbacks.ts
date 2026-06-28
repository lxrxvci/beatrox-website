export interface NavigationLink {
  label: string
  href: string
}

export interface SiteStyleSettings {
  brandPrimary: string
  brandSecondary: string
  backgroundColor: string
  fontFamilyHeading: string
  fontFamilyBody: string
  buttonStyle: 'sharp' | 'rounded'
}

export interface SeoDefaultsSettings {
  siteName: string
  defaultTitle: string
  titleTemplate: string
  defaultDescription: string
  noindexByDefault: boolean
}

export const FALLBACK_NAVIGATION: NavigationLink[] = [
  { label: 'About', href: '/about' },
  { label: 'Work', href: '/work' },
  { label: 'Services', href: '/services' },
  { label: 'Rentals', href: '/rentals' },
  { label: 'Team', href: '/team' },
  { label: 'Contact', href: '/contact' },
]

export const FALLBACK_SITE_STYLES: SiteStyleSettings = {
  brandPrimary: '#ffffff',
  brandSecondary: '#a1a1aa',
  backgroundColor: '#000000',
  fontFamilyHeading: 'inherit',
  fontFamilyBody: 'inherit',
  buttonStyle: 'sharp',
}

export const FALLBACK_SEO_DEFAULTS: SeoDefaultsSettings = {
  siteName: 'BEATROX',
  defaultTitle: 'BEATROX — Experiential Design & Event Production',
  titleTemplate: '%s | BEATROX',
  defaultDescription:
    'Portland-based experiential design and event production. Drone light shows, LED video walls, projection mapping, custom fabrication, and full-service event production.',
  noindexByDefault: false,
}

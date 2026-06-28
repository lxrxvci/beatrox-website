export interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  name: string
  url: string
  logo: string
  address?: {
    '@type': 'PostalAddress'
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  sameAs?: string[]
}

export interface LocalBusinessSchema {
  '@context': 'https://schema.org'
  '@type': 'LocalBusiness'
  name: string
  url: string
  logo: string
  address: {
    '@type': 'PostalAddress'
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  sameAs?: string[]
  telephone?: string
  areaServed?: string
  priceRange?: string
}

export interface ServiceSchema {
  '@context': 'https://schema.org'
  '@type': 'Service'
  name: string
  description: string
  provider: {
    '@type': 'Organization'
    name: string
    url: string
  }
  areaServed?: string
  serviceType?: string
}

export function buildOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BEATROX',
    url: 'https://www.beatrox.com',
    logo: 'https://www.beatrox.com/og-default.jpg',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '8625 NE Halsey St',
      addressLocality: 'Portland',
      addressRegion: 'OR',
      postalCode: '97220',
      addressCountry: 'US',
    },
    sameAs: [
      'https://www.youtube.com/@beatrox',
      'https://www.instagram.com/beatrox/',
    ],
  }
}

export function buildLocalBusinessSchema(): LocalBusinessSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'BEATROX',
    url: 'https://www.beatrox.com',
    logo: 'https://www.beatrox.com/og-default.jpg',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '8625 NE Halsey St',
      addressLocality: 'Portland',
      addressRegion: 'OR',
      postalCode: '97220',
      addressCountry: 'US',
    },
    sameAs: [
      'https://www.youtube.com/@beatrox',
      'https://www.instagram.com/beatrox/',
    ],
    areaServed: 'Portland, OR and worldwide',
    priceRange: '$$$',
  }
}

export function buildServiceSchema(
  name: string,
  description: string,
  serviceType?: string
): ServiceSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: 'BEATROX',
      url: 'https://www.beatrox.com',
    },
    areaServed: 'Portland, OR and worldwide',
    serviceType: serviceType || 'Experiential Design & Event Production',
  }
}

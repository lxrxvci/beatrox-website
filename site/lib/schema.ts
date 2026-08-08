import { getAllServices } from './json-content'

const SITE_URL = 'https://www.beatrox.com'

/** Stable entity @id, reused anywhere the business is referenced (OP-05). */
export const LOCALBUSINESS_ID = `${SITE_URL}/#localbusiness`

const POSTAL_ADDRESS = {
  '@type': 'PostalAddress' as const,
  streetAddress: '1313 SE 3rd Ave',
  addressLocality: 'Portland',
  addressRegion: 'OR',
  postalCode: '97214',
  addressCountry: 'US',
}

const GEO = {
  '@type': 'GeoCoordinates' as const,
  latitude: 45.5134853,
  longitude: -122.6629198,
}

const SOCIAL_PROFILES = [
  'https://www.youtube.com/@beatrox',
  'https://www.instagram.com/beatrox/',
]

/** Studio location plus the real operating footprint. Beatrox produces
    globally; hyper-local (metro city) targeting lives on rentals.beatrox.com,
    not the main brand site. */
const AREA_SERVED = [
  { '@type': 'City' as const, name: 'Portland, OR' },
  { '@type': 'Country' as const, name: 'United States' },
]

export interface LocalBusinessSchema {
  '@context': 'https://schema.org'
  '@type': 'LocalBusiness'
  '@id': string
  name: string
  legalName?: string
  url: string
  logo: string
  image: string
  address: typeof POSTAL_ADDRESS
  geo: typeof GEO
  hasMap: string
  openingHoursSpecification?: {
    '@type': 'OpeningHoursSpecification'
    dayOfWeek: string[]
    opens: string
    closes: string
  }[]
  sameAs?: string[]
  telephone?: string
  areaServed?: typeof AREA_SERVED
  priceRange?: string
  hasOfferCatalog?: {
    '@type': 'OfferCatalog'
    name: string
    itemListElement: {
      '@type': 'Offer'
      itemOffered: {
        '@type': 'Service'
        name: string
        url: string
      }
    }[]
  }
}

export interface ServiceSchema {
  '@context': 'https://schema.org'
  '@type': 'Service'
  name: string
  description: string
  provider: {
    '@type': 'Organization'
    '@id': string
    name: string
    url: string
  }
  areaServed?: typeof AREA_SERVED
  serviceType?: string
}

/** Offer catalog generated from the services content source so schema,
    GBP Services, and the website never drift apart (OP-06, GBP-08). */
function buildOfferCatalog(): NonNullable<LocalBusinessSchema['hasOfferCatalog']> {
  const bareSlug = (slug: string) => slug.replace(/^\/(services|tech)\/+/, '')
  return {
    '@type': 'OfferCatalog',
    name: 'Beatrox Services',
    itemListElement: getAllServices().map((service) => ({
      '@type': 'Offer' as const,
      itemOffered: {
        '@type': 'Service' as const,
        name: service.title,
        url: `${SITE_URL}/${service.pageType === 'tech' ? 'tech' : 'services'}/${bareSlug(service.slug)}`,
      },
    })),
  }
}

export function buildLocalBusinessSchema(): LocalBusinessSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': LOCALBUSINESS_ID,
    name: 'Beatrox',
    legalName: 'Beatrox LLC',
    url: SITE_URL,
    logo: `${SITE_URL}/og-default.jpg`,
    image: `${SITE_URL}/og-default.jpg`,
    address: POSTAL_ADDRESS,
    geo: GEO,
    hasMap:
      'https://www.google.com/maps/search/?api=1&query=1313+SE+3rd+Ave%2C+Portland%2C+OR+97214',
    // Matches the hours stated on /contact and the GBP exactly (2026-08-08 set).
    // Friday/Saturday close at 2 AM the following morning; per Google's
    // LocalBusiness doc, overnight hours use a single spec with the opening day.
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday'],
        opens: '11:00',
        closes: '22:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens: '12:00',
        closes: '22:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Friday'],
        opens: '12:00',
        closes: '02:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '11:00',
        closes: '02:00',
      },
    ],
    sameAs: SOCIAL_PROFILES,
    telephone: '+15035154715',
    areaServed: AREA_SERVED,
    priceRange: '$$$',
    hasOfferCatalog: buildOfferCatalog(),
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
      '@id': LOCALBUSINESS_ID,
      name: 'Beatrox',
      url: SITE_URL,
    },
    areaServed: AREA_SERVED,
    serviceType: serviceType || 'Experiential Design & Event Production',
  }
}

export interface PersonSchema {
  '@context': 'https://schema.org'
  '@type': 'Person'
  '@id': string
  name: string
  jobTitle: string
  description?: string
  image?: string
  sameAs?: string[]
  worksFor: {
    '@type': 'Organization'
    '@id': string
    name: string
    url: string
  }
}

/** Minimal shape the team schema needs; satisfied by TeamMember from
    lib/content and by the team.json fallback data. */
export interface TeamMemberInput {
  name: string
  title: string
  bio?: string
  photo?: { url: string; alt: string }
  sameAs?: string[]
}

function personSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** One Person node per leadership/team member, each linked back to the
    LocalBusiness entity (OP-05). sameAs and image are emitted only when the
    source data actually carries them; nothing is invented. */
export function buildTeamSchema(members: TeamMemberInput[]): PersonSchema[] {
  return members.map((member) => {
    const person: PersonSchema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': `${SITE_URL}/#person-${personSlug(member.name)}`,
      name: member.name,
      jobTitle: member.title,
      worksFor: {
        '@type': 'Organization',
        '@id': LOCALBUSINESS_ID,
        name: 'Beatrox',
        url: SITE_URL,
      },
    }
    if (member.bio) person.description = member.bio
    if (member.photo?.url) {
      person.image = member.photo.url.startsWith('http')
        ? member.photo.url
        : `${SITE_URL}${member.photo.url}`
    }
    if (member.sameAs?.length) person.sameAs = member.sameAs
    return person
  })
}

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqPageSchema {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  mainEntity: {
    '@type': 'Question'
    name: string
    acceptedAnswer: {
      '@type': 'Answer'
      text: string
    }
  }[]
}

export function buildFaqSchema(faqItems: FaqItem[]): FaqPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export interface BreadcrumbItem {
  name: string
  path: string
}

export interface BreadcrumbListSchema {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: {
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }[]
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://www.beatrox.com${item.path}`,
    })),
  }
}

import path from 'path'
import { pathToFileURL } from 'url'
import {
  assertCredentials,
  findOneByField,
  login,
  normalizeSlug,
  readJson,
  resolveMediaByLegacyUrl,
  toLexicalText,
  upsertBySlug,
  upsertGlobal,
} from './cms-import-utils.mjs'

const CONTENT_ROOT = path.resolve(process.cwd(), '..', 'content')

const PAGE_FILES = ['homepage.json', 'about.json', 'work.json', 'services-index.json', 'team.json', 'contact.json']

function normalizePageSlug(file, source) {
  const mapped = file === 'homepage.json' ? 'home' : source.slug
  return normalizeSlug(mapped || file.replace('.json', ''))
}

function toLexicalBody(value) {
  if (!value) return undefined
  if (typeof value === 'object' && value.root) return value
  return toLexicalText(String(value))
}

async function mapSectionsToBlocks(source, token) {
  const sections = Array.isArray(source.sections) ? source.sections : []
  const blocks = await Promise.all(
    sections.map(async (section) => {
      const type = section.type || 'text_block'
      if (type === 'intro') {
        const body = toLexicalBody(section.body)
        if (!body) return null
        return {
          blockType: 'intro',
          heading: section.heading || '',
          body,
          cta: section.cta || undefined,
        }
      }
      if ((type === 'philosophy' || type === 'three_column') && Array.isArray(section.columns)) {
        return {
          blockType: 'philosophy',
          heading: section.heading || 'Philosophy',
          columns: section.columns.map((col) => ({
            heading: col.heading || '',
            body: toLexicalBody(col.body),
            ...(col.image ? { image: col.image } : {}),
          })),
        }
      }
      if (type === 'values' && Array.isArray(section.items)) {
        return {
          blockType: 'philosophy',
          heading: section.heading || 'Values',
          columns: section.items.map((item) => ({
            heading: item.title || item.heading || '',
            body: toLexicalBody(item.body),
          })),
        }
      }
      if ((type === 'capabilities_grid' || type === 'capabilities_summary') && Array.isArray(section.items || section.categories)) {
        const items = Array.isArray(section.items)
          ? section.items
              .map((item) => ({ label: item.label || item.title || '', icon: item.icon || undefined }))
              .filter((item) => item.label)
          : section.categories.flatMap((cat) => (cat.items || []).map((item) => ({ label: item })))
        return {
          blockType: 'capabilitiesGrid',
          heading: section.heading || 'Capabilities',
          items,
        }
      }
      if (type === 'featured_work' && Array.isArray(section.items)) {
        const projectIds = []
        for (const item of section.items) {
          const bareSlug = String(item.slug || '').replace(/^\/+/, '').replace(/^work\/+/, '')
          if (!bareSlug) continue
          const project = await findOneByField('projects', 'slug', bareSlug, token)
          if (project?.id) projectIds.push(project.id)
        }
        return {
          blockType: 'featuredWork',
          heading: section.heading || 'Featured Work',
          projects: projectIds,
        }
      }
      if (type === 'cta_bar' && section.cta) {
        return {
          blockType: 'ctaBar',
          heading: section.heading || 'Ready to get started?',
          body: toLexicalBody(section.body),
          cta: { label: section.cta.label || 'Contact', url: section.cta.url || '/contact' },
        }
      }
      if (Array.isArray(section.items) && section.items.length > 0) {
        return {
          blockType: 'features',
          heading: section.heading || '',
          items: section.items
            .map((item) => ({ label: item.label || item.title || item.body || '' }))
            .filter((item) => item.label),
        }
      }
      const textBody = String(section.body || '').trim()
      if (!textBody) return null
      return {
        blockType: 'text',
        heading: section.heading || '',
        body: toLexicalText(textBody),
      }
    }),
  )
  return blocks.filter(Boolean)
}

async function mapPageMedia(source, token) {
  const media = source?.media
  if (!media || typeof media !== 'object') return undefined
  const heroUrl = media.heroImage || ''
  const heroDoc = await resolveMediaByLegacyUrl(heroUrl, token)
  const galleryUrls = Array.isArray(media.galleryImages)
    ? media.galleryImages
    : Array.isArray(media.sectionImages)
      ? media.sectionImages
      : []
  const galleryImages = []
  for (const url of galleryUrls) {
    if (!url) continue
    const doc = await resolveMediaByLegacyUrl(url, token)
    galleryImages.push({ media: doc?.id, legacyUrl: url })
  }
  return {
    heroImage: heroDoc?.id,
    heroImageLegacyUrl: heroUrl,
    galleryImages,
  }
}

function mapContactGroups(source) {
  return {
    address: source?.address
      ? {
          company: source.address.company || '',
          street: source.address.street || '',
          city: source.address.city || '',
          state: source.address.state || '',
          zip: source.address.zip || '',
          country: source.address.country || '',
          formatted: source.address.formatted || '',
        }
      : undefined,
    contactInfo: source?.contact
      ? {
          email: source.contact.email || '',
          phone: source.contact.phone || '',
          phoneFormatted: source.contact.phoneFormatted || '',
        }
      : undefined,
    social: source?.social
      ? {
          youtube: source.social.youtube || '',
          instagram: source.social.instagram || '',
        }
      : undefined,
    consultationForm: source?.consultationForm
      ? {
          heading: source.consultationForm.heading || '',
          description: source.consultationForm.description || '',
          submitLabel: source.consultationForm.submitLabel || '',
          successMessage: source.consultationForm.successMessage || '',
          fields: (source.consultationForm.fields || []).map((field) => ({
            id: field.id || '',
            label: field.label || '',
            type: field.type || 'text',
            required: Boolean(field.required),
            placeholder: field.placeholder || undefined,
            options: Array.isArray(field.options) ? field.options.map((value) => ({ value })) : [],
          })),
        }
      : undefined,
    emailSignup: source?.emailSignup
      ? {
          heading: source.emailSignup.heading || '',
          description: source.emailSignup.description || '',
          placeholder: source.emailSignup.placeholder || '',
          submitLabel: source.emailSignup.submitLabel || '',
        }
      : undefined,
  }
}

export async function importPages(token) {
  const results = []
  for (let index = 0; index < PAGE_FILES.length; index += 1) {
    const file = PAGE_FILES[index]
    const filePath = path.join(CONTENT_ROOT, file)
    const source = readJson(filePath)
    const slug = normalizePageSlug(file, source)
    const ogImageDoc = await resolveMediaByLegacyUrl(source?.seo?.og?.image, token)
    const media = await mapPageMedia(source, token)

    const pageDoc = await upsertBySlug(
      'pages',
      slug,
      {
        title: source.title || slug,
        slug,
        status: 'published',
        isEnabled: true,
        showInNav: !['home'].includes(slug),
        navLabel: source.title || slug,
        navOrder: (index + 1) * 10,
        hero: {
          headline: source?.hero?.headline || source.title || slug,
          subheadline: source?.hero?.subheadline || '',
          cta: source?.hero?.cta || undefined,
          secondaryCta: source?.hero?.secondaryCta || undefined,
        },
        seo: {
          title: source?.seo?.title || source.title || slug,
          description: source?.seo?.description || '',
          ogTitle: source?.seo?.og?.title || source?.seo?.title || source.title || slug,
          ogDescription: source?.seo?.og?.description || source?.seo?.description || '',
          ogImage: ogImageDoc?.id,
        },
        ...(media ? { media } : {}),
        ...(slug === 'contact' ? mapContactGroups(source) : {}),
        blocks: await mapSectionsToBlocks(source, token),
      },
      token,
    )
    results.push(pageDoc)
  }

  await upsertGlobal(
    'navigation',
    {
      items: [
        { enabled: true, label: 'About', path: '/about', order: 10 },
        { enabled: true, label: 'Work', path: '/work', order: 20 },
        { enabled: true, label: 'Services', path: '/services', order: 30 },
        { enabled: true, label: 'Rentals', path: '/rentals', order: 35 },
        { enabled: true, label: 'Team', path: '/team', order: 40 },
        { enabled: true, label: 'Contact', path: '/contact', order: 50 },
      ],
    },
    token,
  )

  await upsertGlobal(
    'site-styles',
    {
      brandPrimary: '#ffffff',
      brandSecondary: '#a1a1aa',
      backgroundColor: '#000000',
      fontFamilyHeading: 'inherit',
      fontFamilyBody: 'inherit',
      buttonStyle: 'sharp',
    },
    token,
  )

  await upsertGlobal(
    'seo-defaults',
    {
      siteName: 'BEATROX',
      defaultTitle: 'Experiential Design & Event Production | BEATROX',
      titleTemplate: '%s | BEATROX',
      defaultDescription:
        'Portland-based experiential design and event production. Drone light shows, LED video walls, projection mapping, custom fabrication, and full-service event production.',
      noindexByDefault: false,
    },
    token,
  )

  return { count: results.length }
}

async function run() {
  assertCredentials()
  const token = await login()
  const result = await importPages(token)
  console.log(`Imported pages: ${result.count}`)
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  run().catch((error) => {
    console.error('Page import failed:', error.message)
    process.exitCode = 1
  })
}

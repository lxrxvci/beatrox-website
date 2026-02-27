import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '@/payload.config'

const CONTENT_ROOT = path.resolve(process.cwd(), '..', 'content')

type LegacyPage = {
  title?: string
  slug?: string
  hero?: {
    headline?: string
    subheadline?: string
  }
  seo?: {
    title?: string
    description?: string
    og?: {
      title?: string
      description?: string
    }
  }
  sections?: Array<{
    heading?: string
    body?: string
  }>
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

function normalizeSlug(input?: string): string {
  if (!input) return ''
  return input.replace(/^\/+/, '').replace(/\/+$/, '')
}

async function upsertPage(payload: Awaited<ReturnType<typeof getPayload>>, page: LegacyPage, navOrder: number) {
  const slug = normalizeSlug(page.slug) || normalizeSlug(page.title?.toLowerCase().replace(/\s+/g, '-')) || `page-${navOrder}`
  const title = page.title || slug
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const blocks =
    page.sections?.slice(0, 8).map((section) => ({
      blockType: 'text',
      heading: section.heading || undefined,
      body: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  mode: 'normal',
                  text: section.body || '',
                  type: 'text',
                  style: '',
                  detail: 0,
                  format: 0,
                  version: 1,
                },
              ],
              direction: 'ltr',
              textFormat: 0,
              textStyle: '',
            },
          ],
          direction: 'ltr',
        },
      },
    })) || []

  const data = {
    title,
    slug,
    isEnabled: true,
    showInNav: slug !== '',
    navLabel: title,
    navOrder,
    hero: {
      headline: page.hero?.headline || title,
      subheadline: page.hero?.subheadline || '',
    },
    seo: {
      title: page.seo?.title || title,
      description: page.seo?.description || '',
      ogTitle: page.seo?.og?.title || page.seo?.title || title,
      ogDescription: page.seo?.og?.description || page.seo?.description || '',
    },
    blocks,
  }

  if (existing.docs[0]) {
    await payload.update({
      collection: 'pages',
      id: existing.docs[0].id,
      data,
    })
    return
  }

  await payload.create({
    collection: 'pages',
    data,
  })
}

async function seed() {
  const payload = await getPayload({ config })

  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      items: [
        { enabled: true, label: 'About', path: '/about', order: 10 },
        { enabled: true, label: 'Work', path: '/work', order: 20 },
        { enabled: true, label: 'Services', path: '/services', order: 30 },
        { enabled: true, label: 'Team', path: '/team', order: 40 },
        { enabled: true, label: 'Contact', path: '/contact', order: 50 },
      ],
    },
  })

  await payload.updateGlobal({
    slug: 'site-styles',
    data: {
      brandPrimary: '#ffffff',
      brandSecondary: '#a1a1aa',
      backgroundColor: '#000000',
      fontFamilyHeading: 'inherit',
      fontFamilyBody: 'inherit',
      buttonStyle: 'sharp',
    },
  })

  await payload.updateGlobal({
    slug: 'seo-defaults',
    data: {
      siteName: 'BEATROX',
      defaultTitle: 'BEATROX — Experiential Design & Event Production',
      titleTemplate: '%s | BEATROX',
      defaultDescription:
        'Portland-based experiential design and event production. Drone light shows, LED video walls, projection mapping, custom fabrication, and full-service event production.',
      noindexByDefault: false,
    },
  })

  const pageFiles = ['homepage.json', 'about.json', 'work.json', 'services-index.json', 'team.json', 'contact.json']

  for (let index = 0; index < pageFiles.length; index += 1) {
    const file = pageFiles[index]
    const filePath = path.join(CONTENT_ROOT, file)
    if (!fs.existsSync(filePath)) continue
    const source = readJson<LegacyPage>(filePath)
    await upsertPage(payload, source, (index + 1) * 10)
  }

  console.log('CMS seed completed.')
}

seed().catch((error) => {
  console.error('CMS seed failed:', error)
  process.exit(1)
})

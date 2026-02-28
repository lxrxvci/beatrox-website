import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '@/payload.config'

type LegacyCaseStudy = {
  title?: string
  hero?: {
    subheadline?: string
    tags?: string[]
  }
  seo?: {
    title?: string
    description?: string
    og?: {
      title?: string
      description?: string
      image?: string
    }
  }
  metadata?: {
    client?: string
    type?: string
    partners?: string[]
  }
  body?: Array<{
    type?: string
    heading?: string
    content?: string
    items?: string[]
  }>
  images?: Array<{ url?: string; alt?: string }>
  videos?: Array<{ title?: string; provider?: string; url?: string; embedUrl?: string }>
}

const CONTENT_FILE = path.resolve(process.cwd(), '..', 'content', 'portfolio', 'infinite-playlist.json')
const CANONICAL_TITLE = 'Amazon Music Live - Infinite Playlist Tour'
const CANONICAL_SLUG = 'amazon-music-live-infinite-playlist-tour'

const VIDEO_TITLE_BY_ID: Record<string, string> = {
  dAscyMAltCc: 'Stage Coach Infinite Playlist Tour - Recap Video',
  _MOJ_AOpApE: 'Outside Lands Infinite Playlist Tour - Recap Video',
  yzqcpqORO6w: 'Amazon Music Live Outside Lands Activation Recap Video After Movie',
  kgWQxYT3qZE: 'Lighting and Environmental Design for Amazon Music Live at Stagecoach 2023',
  K6q4bdCMADI: 'Merchandise presented for Amazon Music at Stagecoach 2023',
}

function asArray<T>(input: unknown): T[] {
  return Array.isArray(input) ? (input as T[]) : []
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

function youtubeIdFromUrl(url: string): string {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  return match?.[1] || ''
}

async function resolveMediaIdByLegacyUrl(payload: Awaited<ReturnType<typeof getPayload>>, legacyUrl: string): Promise<string | number | undefined> {
  if (!legacyUrl || !legacyUrl.startsWith('/')) return undefined
  const filename = legacyUrl.split('/').pop()
  if (!filename) return undefined
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  })
  return existing.docs[0]?.id
}

async function run() {
  const payload = await getPayload({ config })
  const source = readJson<LegacyCaseStudy>(CONTENT_FILE)

  const ogImageId = await resolveMediaIdByLegacyUrl(payload, source?.seo?.og?.image || '')
  const imageRows = await Promise.all(
    asArray<{ url?: string; alt?: string }>(source.images).map(async (img) => ({
      media: await resolveMediaIdByLegacyUrl(payload, img.url || ''),
      legacyUrl: img.url || '',
      alt: img.alt || 'Amazon Music Live activation image',
    })),
  )

  const body = asArray<NonNullable<LegacyCaseStudy['body']>[number]>(source.body).map((block) => ({
    type: block.type || 'text',
    heading: block.heading || '',
    content: block.content || '',
    items: asArray<string>(block.items).map((value) => ({ value })),
  }))

  body.push({
    type: 'outcomes',
    heading: 'Outcomes Snapshot',
    content: 'Measured output from the campaign deployment footprint:',
    items: [
      { value: '2 major festival activations executed (Outside Lands + Stagecoach)' },
      { value: '5 documented recap and technical highlight videos delivered' },
      { value: '8 interactive fan touchpoints deployed across the experience' },
      { value: '3 strategic partners coordinated across production and operations' },
    ],
  })

  const videos = asArray<NonNullable<LegacyCaseStudy['videos']>[number]>(source.videos).map((video) => {
    const videoId = youtubeIdFromUrl(video.url || video.embedUrl || '')
    return {
      title: VIDEO_TITLE_BY_ID[videoId] || video.title || 'Campaign video',
      provider: video.provider || 'youtube',
      url: video.url || '',
      embedUrl: video.embedUrl || (videoId ? `https://www.youtube.com/embed/${videoId}` : ''),
    }
  })

  const data = {
    title: CANONICAL_TITLE,
    slug: CANONICAL_SLUG,
    status: 'published',
    _status: 'published',
    isEnabled: true,
    listOrder: 10,
    hero: {
      headline: CANONICAL_TITLE,
      subheadline: source?.hero?.subheadline || '',
      tags: asArray<string>(source?.hero?.tags).map((tag) => ({ tag })),
    },
    metadata: {
      client: source?.metadata?.client || 'Amazon Music Live',
      location: 'Outside Lands (San Francisco, CA) and Stagecoach (Indio, CA)',
      type: source?.metadata?.type || '',
      investmentRange: 'Under $100K',
      partners: asArray<string>(source?.metadata?.partners).map((name) => ({ name })),
    },
    seo: {
      title: source?.seo?.title || `${CANONICAL_TITLE} - Case Study`,
      description: source?.seo?.description || '',
      ogTitle: source?.seo?.og?.title || source?.seo?.title || CANONICAL_TITLE,
      ogDescription: source?.seo?.og?.description || source?.seo?.description || '',
      canonicalUrl: `/case-studies/${CANONICAL_SLUG}`,
      noindex: false,
      ogImage: ogImageId,
    },
    body,
    images: imageRows,
    videos,
  }

  const existing = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: CANONICAL_SLUG } },
    limit: 1,
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'case-studies',
      id: existing.docs[0].id,
      data,
      draft: false,
    })
  } else {
    await payload.create({
      collection: 'case-studies',
      data,
      draft: false,
    })
  }

  console.log(`Upserted case study: ${CANONICAL_SLUG}`)
}

run().catch((error) => {
  console.error('Local case study upsert failed:', error)
  process.exit(1)
})

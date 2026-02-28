import path from 'path'
import { pathToFileURL } from 'url'
import {
  assertCredentials,
  login,
  readJson,
  resolveMediaByLegacyUrl,
  upsertBySlug,
} from './cms-import-utils.mjs'

const CONTENT_FILE = path.resolve(process.cwd(), '..', 'content', 'portfolio', 'infinite-playlist.json')
const CANONICAL_TITLE = 'Amazon Music Live - Infinite Playlist Tour'
const CANONICAL_SLUG = 'amazon-music-live-infinite-playlist-tour'

const VIDEO_TITLE_BY_ID = {
  dAscyMAltCc: 'Stage Coach Infinite Playlist Tour - Recap Video',
  _MOJ_AOpApE: 'Outside Lands Infinite Playlist Tour - Recap Video',
  yzqcpqORO6w: 'Amazon Music Live Outside Lands Activation Recap Video After Movie',
  kgWQxYT3qZE: 'Lighting and Environmental Design for Amazon Music Live at Stagecoach 2023',
  K6q4bdCMADI: 'Merchandise presented for Amazon Music at Stagecoach 2023',
}

function asArray(input) {
  return Array.isArray(input) ? input : []
}

function youtubeIdFromUrl(url) {
  if (!url) return ''
  const match = String(url).match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  return match?.[1] || ''
}

function mapBody(body) {
  const mapped = asArray(body).map((block) => ({
    type: block.type || 'text',
    heading: block.heading || '',
    content: block.content || '',
    items: asArray(block.items).map((item) => ({ value: item })),
  }))

  mapped.push({
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

  return mapped
}

async function mapImages(images, token) {
  const out = []
  for (const image of asArray(images)) {
    const media = await resolveMediaByLegacyUrl(image.url, token)
    out.push({
      media: media?.id,
      legacyUrl: image.url || '',
      alt: image.alt || 'Amazon Music Live activation image',
    })
  }
  return out
}

function mapVideos(videos) {
  return asArray(videos).map((video) => {
    const videoId = youtubeIdFromUrl(video.url || video.embedUrl || '')
    return {
      title: VIDEO_TITLE_BY_ID[videoId] || video.title || 'Campaign video',
      provider: video.provider || 'youtube',
      url: video.url || '',
      embedUrl: video.embedUrl || (videoId ? `https://www.youtube.com/embed/${videoId}` : ''),
    }
  })
}

export async function importAmazonCaseStudy(token) {
  const source = readJson(CONTENT_FILE)
  const ogImageDoc = await resolveMediaByLegacyUrl(source?.seo?.og?.image, token)
  const images = await mapImages(source.images, token)

  return upsertBySlug(
    'case-studies',
    CANONICAL_SLUG,
    {
      title: CANONICAL_TITLE,
      slug: CANONICAL_SLUG,
      _status: 'published',
      status: 'published',
      isEnabled: true,
      listOrder: 10,
      hero: {
        headline: CANONICAL_TITLE,
        subheadline: source?.hero?.subheadline || '',
        tags: asArray(source?.hero?.tags).map((tag) => ({ tag })),
      },
      metadata: {
        client: source?.metadata?.client || 'Amazon Music Live',
        location: 'Outside Lands (San Francisco, CA) and Stagecoach (Indio, CA)',
        type: source?.metadata?.type || '',
        investmentRange: 'Under $100K',
        partners: asArray(source?.metadata?.partners).map((name) => ({ name })),
      },
      seo: {
        title: source?.seo?.title || `${CANONICAL_TITLE} - Case Study`,
        description: source?.seo?.description || '',
        ogTitle: source?.seo?.og?.title || source?.seo?.title || CANONICAL_TITLE,
        ogDescription: source?.seo?.og?.description || source?.seo?.description || '',
        canonicalUrl: `/case-studies/${CANONICAL_SLUG}`,
        noindex: false,
        ogImage: ogImageDoc?.id,
      },
      body: mapBody(source.body),
      images,
      videos: mapVideos(source.videos),
    },
    token,
  )
}

async function run() {
  assertCredentials()
  const token = await login()
  const result = await importAmazonCaseStudy(token)
  const slug = result?.doc?.slug || result?.slug || CANONICAL_SLUG
  console.log(`Upserted case study: ${slug}`)
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  run().catch((error) => {
    console.error('Amazon case study import failed:', error.message)
    process.exitCode = 1
  })
}

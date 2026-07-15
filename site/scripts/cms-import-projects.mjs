import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import {
  assertCredentials,
  login,
  normalizeSlug,
  readJson,
  resolveMediaByLegacyUrl,
  toLexicalText,
  upsertBySlug,
} from './cms-import-utils.mjs'

const CONTENT_ROOT = path.resolve(process.cwd(), '..', 'content')
const PROJECTS_DIR = path.join(CONTENT_ROOT, 'portfolio')

function asArray(input) {
  return Array.isArray(input) ? input : []
}

async function mapProjectImages(images, token) {
  const out = []
  for (const image of asArray(images)) {
    const media = await resolveMediaByLegacyUrl(image.url, token)
    out.push({
      media: media?.id,
      legacyUrl: image.url || '',
      alt: image.alt || 'Project media',
      filename: image.filename || '',
      note: image.note || '',
    })
  }
  return out
}

function mapBody(body) {
  return asArray(body).map((block) => ({
    type: block.type || 'text',
    heading: block.heading || '',
    content: block.content || '',
    // FAQ-style blocks carry {question, answer} objects; other blocks carry plain strings.
    items: asArray(block.items).map((item) =>
      item && typeof item === 'object'
        ? { question: String(item.question || ''), answer: String(item.answer || '') }
        : { value: String(item ?? '') },
    ),
  }))
}

function mapContentBlocks(body) {
  const blocks = []
  for (const block of asArray(body)) {
    const type = block.type || 'text'
    const heading = block.heading || ''
    const content = block.content || ''

    if (type === 'video' || (block.url && /youtube|vimeo|instagram/i.test(block.provider || ''))) {
      blocks.push({
        blockType: 'video',
        heading,
        url: block.url || '',
        provider: block.provider || 'external',
      })
      continue
    }

    if (type === 'gallery' && Array.isArray(block.images) && block.images.length > 0) {
      // Gallery blocks in legacy JSON do not carry resolved media IDs; skip or map to text.
      // A future migration can resolve each image via resolveMediaByLegacyUrl.
      continue
    }

    const textParts = []
    if (heading) textParts.push(heading)
    if (content) textParts.push(content)
    if (Array.isArray(block.items) && block.items.length > 0) {
      textParts.push(block.items.map((item) => (typeof item === 'string' ? item : item.value || item.question || '')).join('\n'))
    }

    const textBody = textParts.join('\n\n').trim()
    if (!textBody) continue

    blocks.push({
      blockType: 'text',
      heading: type === 'heading' ? heading : undefined,
      body: toLexicalText(textBody),
    })
  }
  return blocks
}

export async function importProjects(token) {
  const files = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.json')).sort()
  let count = 0

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const source = readJson(path.join(PROJECTS_DIR, file))
    // Store the canonical bare slug (the collection's beforeValidate hook strips
    // any "/work/" prefix anyway — looking up the prefixed form always misses).
    const slug = normalizeSlug(source.slug || file.replace('.json', '')).replace(/^work\/+/, '')
    const ogImageDoc = await resolveMediaByLegacyUrl(source?.seo?.og?.image, token)
    const images = await mapProjectImages(source.images, token)

    await upsertBySlug(
      'projects',
      slug,
      {
        title: source.title || slug,
        slug,
        status: 'published',
        isEnabled: true,
        listOrder: (index + 1) * 10,
        hero: {
          headline: source?.hero?.headline || source.title || slug,
          subheadline: source?.hero?.subheadline || '',
          tags: asArray(source?.hero?.tags).map((tag) => ({ tag })),
        },
        metadata: {
          client: source?.metadata?.client || '',
          location: source?.metadata?.location || '',
          locations: asArray(source?.metadata?.locations).map((item) => ({ location: item })),
          type: source?.metadata?.type || '',
          partners: asArray(source?.metadata?.partners).map((item) => ({ name: item })),
          tech: asArray(source?.metadata?.tech).map((item) => ({ value: item })),
          techniques: asArray(source?.metadata?.techniques).map((item) => ({ value: item })),
          materials: asArray(source?.metadata?.materials).map((item) => ({ value: item })),
          spec: asArray(source?.metadata?.spec).map((item) => ({ value: item })),
          software: asArray(source?.metadata?.software).map((item) => ({ value: item })),
        },
        seo: {
          title: source?.seo?.title || source.title || slug,
          description: source?.seo?.description || '',
          ogTitle: source?.seo?.og?.title || source?.seo?.title || source.title || slug,
          ogDescription: source?.seo?.og?.description || source?.seo?.description || '',
          ogImage: ogImageDoc?.id,
          ogImageLegacyUrl: source?.seo?.og?.image || '',
        },
        body: mapBody(source.body),
        contentBlocks: mapContentBlocks(source.body),
        images,
        videos: asArray(source.videos).map((video) => ({
          title: video.title || 'Video',
          provider: video.provider || 'external',
          url: video.url || '',
          embedUrl: video.embedUrl || '',
          note: video.note || '',
        })),
      },
      token,
    )
    count += 1
  }

  return { count }
}

async function run() {
  assertCredentials()
  const token = await login()
  const result = await importProjects(token)
  console.log(`Imported projects: ${result.count}`)
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  run().catch((error) => {
    console.error('Project import failed:', error.message)
    process.exitCode = 1
  })
}

import fs from 'fs'
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
} from './cms-import-utils.mjs'

const CONTENT_ROOT = path.resolve(process.cwd(), '..', 'content')
const SERVICES_DIR = path.join(CONTENT_ROOT, 'services')

function asArray(input) {
  return Array.isArray(input) ? input : []
}

function mapBody(body) {
  return asArray(body).map((block) => ({
    type: block.type || 'text',
    heading: block.heading || '',
    content: block.content || '',
    // FAQ blocks carry {question, answer} objects; other blocks carry plain strings.
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

    if (type === 'faq' && Array.isArray(block.items) && block.items.length > 0) {
      const faqText = block.items
        .map((item) => `Q: ${item.question || ''}\nA: ${item.answer || ''}`)
        .join('\n\n')
      blocks.push({
        blockType: 'text',
        heading,
        body: toLexicalText(faqText),
      })
      continue
    }

    if (type === 'video' || (block.url && /youtube|vimeo|instagram/i.test(block.provider || ''))) {
      blocks.push({
        blockType: 'video',
        heading,
        url: block.url || '',
        provider: block.provider || 'external',
      })
      continue
    }

    const textParts = []
    if (heading) textParts.push(heading)
    if (block.content) textParts.push(block.content)
    if (Array.isArray(block.items) && block.items.length > 0) {
      textParts.push(block.items.map((item) => (typeof item === 'string' ? item : item.value || '')).join('\n'))
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

async function mapGallery(images, token) {
  const out = []
  for (const image of asArray(images)) {
    const mediaDoc = await resolveMediaByLegacyUrl(image, token)
    out.push({
      media: mediaDoc?.id,
      legacyUrl: image,
    })
  }
  return out
}

async function mapRelatedWork(relatedWork, token) {
  const out = []
  for (const row of asArray(relatedWork)) {
    const slug = normalizeSlug(row.slug || '').replace(/^work\//, '')
    const project = slug ? await findOneByField('projects', 'slug', slug, token) : null
    out.push({
      project: project?.id,
      title: row.title || project?.title || slug,
      slug: slug ? `/work/${slug}` : row.slug || '',
    })
  }
  return out
}

export async function importServices(token) {
  const files = fs.readdirSync(SERVICES_DIR).filter((f) => f.endsWith('.json')).sort()
  let count = 0

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const source = readJson(path.join(SERVICES_DIR, file))
    const slug = normalizeSlug(source.slug || file.replace('.json', ''))
    const ogImageDoc = await resolveMediaByLegacyUrl(source?.seo?.og?.image, token)
    const heroImageDoc = await resolveMediaByLegacyUrl(source?.media?.heroImage, token)

    await upsertBySlug(
      'services',
      slug,
      {
        title: source.title || slug,
        slug,
        status: 'published',
        isEnabled: true,
        category: source.category || '',
        listOrder: (index + 1) * 10,
        hero: {
          headline: source?.hero?.headline || source.title || slug,
          subheadline: source?.hero?.subheadline || '',
          cta: source?.hero?.cta || { label: 'Contact', url: '/contact' },
        },
        capabilities: asArray(source.capabilities).map((item) => ({ value: item })),
        body: mapBody(source.body),
        contentBlocks: mapContentBlocks(source.body),
        relatedWork: await mapRelatedWork(source.relatedWork, token),
        media: {
          heroImage: heroImageDoc?.id,
          heroImageLegacyUrl: source?.media?.heroImage || '',
          galleryImages: await mapGallery(source?.media?.galleryImages, token),
        },
        seo: {
          title: source?.seo?.title || source.title || slug,
          description: source?.seo?.description || '',
          ogTitle: source?.seo?.og?.title || source?.seo?.title || source.title || slug,
          ogDescription: source?.seo?.og?.description || source?.seo?.description || '',
          ogImage: ogImageDoc?.id,
          ogImageLegacyUrl: source?.seo?.og?.image || '',
        },
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
  const result = await importServices(token)
  console.log(`Imported services: ${result.count}`)
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  run().catch((error) => {
    console.error('Service import failed:', error.message)
    process.exitCode = 1
  })
}

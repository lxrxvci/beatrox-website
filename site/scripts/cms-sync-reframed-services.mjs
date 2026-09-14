#!/usr/bin/env node
/**
 * One-off: sync the keyword-reframed service pages into the production CMS
 * via the Payload local API (direct DB, no REST).
 *
 * Why local: the body.linkLabel/linkUrl fields (handoff blocks) were pushed
 * to the prod DB locally (scripts/push-schema.mjs) before the collection
 * change deploys, so the live REST API does not know those columns yet.
 *
 * Only the reframed fields are touched (title/hero/body/seo + published
 * state); relatedWork, media, curatedImages, listOrder are left as-is.
 * `slug` is always sent because the Services beforeValidate hook re-slugifies
 * from `title` when slug is absent.
 */
import fs from 'node:fs'
import path from 'node:path'
import './load-env.mjs'

const SLUGS = [
  'led-video-wall-rentals',
  'sound-equipment-rentals',
  'lighting-services',
  'event-production',
]
const SERVICES_DIR = path.resolve(process.cwd(), '..', 'content', 'services')

const asArray = (input) => (Array.isArray(input) ? input : [])

function mapBody(body) {
  return asArray(body).map((block) => ({
    type: block.type || 'text',
    heading: block.heading || '',
    content: block.content || '',
    items: asArray(block.items).map((item) =>
      item && typeof item === 'object'
        ? { question: String(item.question || ''), answer: String(item.answer || '') }
        : { value: String(item ?? '') },
    ),
    linkLabel: block.linkLabel || '',
    linkUrl: block.linkUrl || '',
  }))
}

async function main() {
  const { getPayload } = await import('payload')
  const { default: payloadConfig } = await import('../payload.config.ts')
  const payload = await getPayload({ config: payloadConfig })

  for (const slug of SLUGS) {
    const source = JSON.parse(fs.readFileSync(path.join(SERVICES_DIR, `${slug}.json`), 'utf-8'))
    const storedSlug = `services/${slug}`

    const found = await payload.find({
      collection: 'services',
      where: { slug: { equals: storedSlug } },
      limit: 1,
      depth: 0,
      draft: true,
      overrideAccess: true,
    })
    const doc = found.docs[0]
    if (!doc) throw new Error(`CMS doc not found for slug ${storedSlug}`)

    const existingSeo = doc.seo || {}
    const seo = source.seo || {}

    const updated = await payload.update({
      collection: 'services',
      id: doc.id,
      overrideAccess: true,
      draft: false,
      data: {
        title: source.title || slug,
        slug: storedSlug,
        status: 'published',
        isEnabled: true,
        hero: {
          headline: source?.hero?.headline || source.title || slug,
          subheadline: source?.hero?.subheadline || '',
          cta: source?.hero?.cta || { label: 'Contact', url: '/contact' },
        },
        body: mapBody(source.body),
        seo: {
          canonicalUrl: existingSeo.canonicalUrl || '',
          noindex: existingSeo.noindex === true,
          ogImage: existingSeo.ogImage || null,
          ogImageLegacyUrl: existingSeo.ogImageLegacyUrl || '',
          title: seo.title || source.title || slug,
          description: seo.description || '',
          ogTitle: seo?.og?.title || seo.title || source.title || slug,
          ogDescription: seo?.og?.description || seo.description || '',
        },
      },
    })

    const handoff = (updated.body || []).find((b) => b.type === 'handoff')
    console.log(`updated ${storedSlug}`)
    console.log(`  title: ${updated.title}`)
    console.log(`  seo.title: ${updated.seo?.title}`)
    console.log(`  _status: ${updated._status}`)
    console.log(`  handoff link: ${handoff ? `${handoff.linkLabel} -> ${handoff.linkUrl}` : '(none)'}`)
  }

  process.exit(0)
}

main().catch((error) => {
  console.error('Service sync failed:', error)
  process.exit(1)
})

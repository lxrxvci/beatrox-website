#!/usr/bin/env node
/**
 * One-off: switch the public contact email in the CMS from hello@beatrox.com
 * to admin@beatrox.com (client directive 2026-08-08).
 *
 * The live site renders contact data from the CMS DB, so editing
 * site/content/contact.json alone does not change production. This script
 * deep-walks the content collections and globals and replaces every exact
 * occurrence of the old address.
 *
 * Modes:
 *   default   DRY RUN (read-only), prints every match with before/after.
 *   --apply   Performs the updates. Also requires EMAIL_UPDATE_CONFIRM=apply,
 *             and DASH_PURGE_ALLOW_REMOTE=yes for non-localhost DBs (same
 *             guard convention as cms-dash-purge.mjs).
 *
 * Run (from site/):  npm run cms:update-contact-email[:apply]
 */
import './load-env.mjs'
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

const APPLY = process.argv.includes('--apply')
if (APPLY && process.env.EMAIL_UPDATE_CONFIRM !== 'apply') {
  console.error('Refusing to write: set EMAIL_UPDATE_CONFIRM=apply to confirm --apply mode.')
  process.exit(1)
}

const FROM = 'hello@beatrox.com'
const TO = 'admin@beatrox.com'
const COLLECTIONS = ['pages', 'services', 'projects', 'case-studies', 'team']
const GLOBALS = ['seo-defaults', 'navigation', 'site-styles', 'capability-tiles']

function replaceDeep(value, pathTrail, hits) {
  if (typeof value === 'string') {
    if (!value.includes(FROM)) return value
    hits.push({ path: pathTrail, before: value, after: value.split(FROM).join(TO) })
    return value.split(FROM).join(TO)
  }
  if (Array.isArray(value)) {
    return value.map((item, i) => replaceDeep(item, `${pathTrail}[${i}]`, hits))
  }
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = replaceDeep(v, pathTrail ? `${pathTrail}.${k}` : k, hits)
    }
    return out
  }
  return value
}

async function main() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config.ts')
  const payload = await getPayload({ config })

  console.log(`CONTACT EMAIL SWITCH ${APPLY ? '-- APPLY MODE' : '-- DRY RUN (read-only)'}`)
  console.log(`${FROM} -> ${TO}`)

  let totalHits = 0
  let totalDocs = 0

  for (const slug of COLLECTIONS) {
    let page = 1
    for (;;) {
      let result
      try {
        result = await payload.find({ collection: slug, limit: 200, page, depth: 0, overrideAccess: true })
      } catch (err) {
        console.log(`[${slug}] could not read: ${err.message}`)
        break
      }
      for (const doc of result.docs) {
        const hits = []
        const cleaned = replaceDeep(doc, '', hits)
        if (hits.length === 0) continue
        totalHits += hits.length
        const label = doc.slug || doc.name || doc.id
        for (const hit of hits) {
          console.log(`[${slug}] ${label} (id ${doc.id})`)
          console.log(`  field:  ${hit.path}`)
          console.log(`  BEFORE: ${JSON.stringify(hit.before)}`)
          console.log(`  AFTER:  ${JSON.stringify(hit.after)}`)
        }
        if (APPLY) {
          const topLevel = [...new Set(hits.map((h) => h.path.split('.')[0].split('[')[0]))]
          const data = {}
          for (const key of topLevel) data[key] = cleaned[key]
          const isPayloadDraft = doc._status && doc._status !== 'published'
          await payload.update({ collection: slug, id: doc.id, data, draft: isPayloadDraft, overrideAccess: true })
          totalDocs++
          console.log(`  APPLIED (fields: ${topLevel.join(', ')})`)
        }
      }
      if (!result.hasNextPage) break
      page++
    }
  }

  for (const slug of GLOBALS) {
    let doc
    try {
      doc = await payload.findGlobal({ slug, depth: 0, overrideAccess: true })
    } catch {
      continue // global does not exist in this project
    }
    const hits = []
    const cleaned = replaceDeep(doc, '', hits)
    if (hits.length === 0) continue
    totalHits += hits.length
    for (const hit of hits) {
      console.log(`[global:${slug}]`)
      console.log(`  field:  ${hit.path}`)
      console.log(`  BEFORE: ${JSON.stringify(hit.before)}`)
      console.log(`  AFTER:  ${JSON.stringify(hit.after)}`)
    }
    if (APPLY) {
      const topLevel = [...new Set(hits.map((h) => h.path.split('.')[0].split('[')[0]))]
      const data = {}
      for (const key of topLevel) data[key] = cleaned[key]
      await payload.updateGlobal({ slug, data, overrideAccess: true })
      totalDocs++
      console.log(`  APPLIED (fields: ${topLevel.join(', ')})`)
    }
  }

  console.log('')
  console.log(`Total: ${totalHits} occurrence(s) across ${totalDocs} doc(s) ${APPLY ? 'updated' : 'would be updated'}.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

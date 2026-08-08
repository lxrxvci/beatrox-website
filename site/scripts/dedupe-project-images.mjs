#!/usr/bin/env node
/**
 * Duplicate image remover, DRY-RUN by default; `--apply` writes.
 *
 * Removes confirmed duplicate rows from project docs' `images` arrays
 * (later occurrence of a same-scene pair; reviewed visually in
 * reports/image-tags/dupe-pairs.jpg). The JSON fallback files
 * (site/content/portfolio + content/portfolio) are updated separately by
 * scripts/dedupe-project-images.py, run both, then `npm run cms:parity`.
 *
 * Run (from site/): `node` via esbuild bundle like tags:images.
 */
import './load-env.mjs'
import { getPayload } from 'payload'
import config from '../payload.config.ts'

const apply = process.argv.includes('--apply')

// slug -> indices to REMOVE (later occurrence of each confirmed pair)
const REMOVALS = {
  'cnn-road-to-270': [5],
  disenchantment: [11],
  'el-camino': [10],
  'g-man-experiential-campaign': [11],
  'projecting-change-racing-extinction': [10],
  'the-great-escape': [13],
  destination: [15, 17, 13, 14, 18, 19, 11],
  'projekt-x': [10, 13, 16, 20, 15],
  myshelter: [22, 23],
}

const payload = await getPayload({ config })

console.log(`\nDedupe project images ${apply ? '(APPLY)' : '(DRY-RUN, no writes)'}\n`)

for (const [slug, removeIndices] of Object.entries(REMOVALS)) {
  const bare = slug
  const result = await payload.find({
    collection: 'projects',
    where: { slug: { equals: bare } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const doc = result.docs[0]
  if (!doc) {
    console.log(`SKIP ${slug}: not found`)
    continue
  }
  const images = Array.isArray(doc.images) ? doc.images : []
  const toRemove = new Set(removeIndices)
  const kept = images.filter((_, i) => !toRemove.has(i))
  console.log(
    `${apply ? '[apply]' : '[plan]'} ${slug}: ${images.length} -> ${kept.length} (removing ${removeIndices.sort((a, b) => a - b).join(', ')})`,
  )
  if (apply) {
    await payload.update({
      collection: 'projects',
      id: doc.id,
      data: { images: kept },
      overrideAccess: true,
    })
  }
}

console.log('')
process.exit(0)

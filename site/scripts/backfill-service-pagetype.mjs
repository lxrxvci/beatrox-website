#!/usr/bin/env node
/**
 * One-off backfill: set `pageType` on existing service docs in the CMS DB
 * from the tagged JSON files in content/services/ (the source of truth).
 *
 * Unlike cms:import:services, this touches ONLY the pageType field, no
 * content re-import, no clobbering of CMS edits. Needed because the DB docs
 * were seeded before pageType existed, so the parity gate reports
 * CMS="service" vs JSON="tech"/"rental" for 34 docs.
 *
 * Run (from site/): see the esbuild bundle command used for cms:parity.
 */
import './load-env.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config.ts'

const SERVICES_DIR = path.join(process.cwd(), 'content', 'services')
const VALID = ['service', 'tech', 'rental']

async function main() {
  const payload = await getPayload({ config })
  const files = fs.readdirSync(SERVICES_DIR).filter((f) => f.endsWith('.json')).sort()

  let updated = 0
  let already = 0
  let missing = 0

  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(path.join(SERVICES_DIR, file), 'utf8'))
    const pageType = VALID.includes(json.pageType) ? json.pageType : 'service'
    const bare = file.replace(/\.json$/, '')

    // Seeded docs store the slug as "services/<slug>"; accept any form.
    const { docs } = await payload.find({
      collection: 'services',
      where: { slug: { in: [`services/${bare}`, bare, `/services/${bare}`] } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (!docs.length) {
      console.warn(`  ! no CMS doc for "${bare}"`)
      missing++
      continue
    }

    const doc = docs[0]
    if (doc.pageType === pageType) {
      already++
      continue
    }

    await payload.update({
      collection: 'services',
      id: doc.id,
      data: { pageType, _status: 'published' },
      draft: false,
      overrideAccess: true,
    })
    updated++
    console.log(`  ${bare}: ${doc.pageType || '(unset)'} -> ${pageType}`)
  }

  console.log(`Done: ${updated} updated, ${already} already correct, ${missing} missing`)
  process.exit(missing > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

#!/usr/bin/env node
/**
 * Bulk-publish site-facing content collections via the Payload REST API.
 *
 * Sets status='published' and isEnabled=true on every doc in:
 *   projects, services, team, pages
 *
 * Usage:
 *   CMS_SEED_BASE_URL=https://beatrox-website.vercel.app \
 *   CMS_SEED_EMAIL=... CMS_SEED_PASSWORD=... \
 *   node ./scripts/cms-publish-site.mjs [--apply]
 *
 * Without --apply it runs as a dry-run and only reports what would change.
 */
import { api, login, assertCredentials } from './cms-import-utils.mjs'

const COLLECTIONS = ['projects', 'services', 'team', 'pages']
const APPLY = process.argv.includes('--apply')

async function fetchAllDocs(collection, token) {
  const docs = []
  let page = 1
  for (;;) {
    const query = new URLSearchParams({ limit: '100', page: String(page), depth: '0' })
    const result = await api(`/api/${collection}?${query.toString()}`, {
      headers: { Authorization: `JWT ${token}` },
    })
    docs.push(...(result.docs || []))
    if (!result.hasNextPage) break
    page += 1
  }
  return docs
}

async function main() {
  assertCredentials()
  const token = await login()

  const summary = {}
  for (const collection of COLLECTIONS) {
    const docs = await fetchAllDocs(collection, token)
    let needsPublish = 0
    let updated = 0

    for (const doc of docs) {
      const patch = {}
      if (doc.status !== 'published') patch.status = 'published'
      if (doc.isEnabled !== true) patch.isEnabled = true
      if (Object.keys(patch).length === 0) continue

      needsPublish += 1
      if (APPLY) {
        await api(`/api/${collection}/${doc.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `JWT ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patch),
        })
        updated += 1
      }
    }

    summary[collection] = { total: docs.length, needsPublish, updated }
    console.log(
      `${collection}: total=${docs.length} needsPublish=${needsPublish}${APPLY ? ` updated=${updated}` : ' (dry-run)'}`,
    )
  }

  if (!APPLY) {
    const pending = Object.values(summary).reduce((n, s) => n + s.needsPublish, 0)
    if (pending > 0) console.log('\nDry-run only. Re-run with --apply to publish.')
  }
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})

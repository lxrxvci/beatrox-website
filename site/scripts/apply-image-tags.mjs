#!/usr/bin/env node
/**
 * Per-image tag applier, DRY-RUN by default; `--apply` writes.
 *
 * Reads AI-vision proposals from ../reports/image-tags/<project>.json
 * (produced by the contact-sheet vision pass; see
 * scripts/build-image-contact-sheets.py + build-image-tag-report.py) and
 * writes image-level serviceTags/techTags onto each project doc's `images`
 * array rows (numeric service-doc ID arrays, same shape the inline editor
 * PATCHes via /api/admin-update).
 *
 * Flags:
 *   --apply              write to the DB (default: dry-run, no writes)
 *   --confidence=high    only apply proposals marked high confidence
 *   --force              overwrite rows that already have image tags
 *                        (default: skip already-tagged rows)
 *
 * Run (from site/): `npm run tags:images` / `npm run tags:images:apply`.
 * Bundled by esbuild like cms:parity.
 */
import './load-env.mjs'
import { readFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config.ts'

const apply = process.argv.includes('--apply')
const force = process.argv.includes('--force')
const confArg = process.argv.find((a) => a.startsWith('--confidence='))
const minConfidence = confArg ? confArg.split('=')[1] : null

// Resolved from cwd (the script runs from site/); bundling into scripts/.tmp
// would break an import.meta.url-relative path.
const PROPOSALS_DIR = join(process.cwd(), '..', 'reports', 'image-tags')

const payload = await getPayload({ config })

// ─── Load proposals ─────────────────────────────────────────────────────────

const proposals = new Map() // slug -> rows[]
for (const file of readdirSync(PROPOSALS_DIR)) {
  if (!file.endsWith('.json') || file === 'manifest.json') continue
  const slug = basename(file, '.json')
  proposals.set(slug, JSON.parse(readFileSync(join(PROPOSALS_DIR, file), 'utf8')))
}

// ─── Load services (slug -> doc) and projects ───────────────────────────────

const [servicesResult, projectsResult] = await Promise.all([
  payload.find({ collection: 'services', limit: 500, depth: 0, overrideAccess: true }),
  payload.find({
    collection: 'projects',
    where: { status: { equals: 'published' } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  }),
])

/** CMS service slugs may be bare or carry a "services/" / "/services/" prefix. */
const bareSlug = (slug) =>
  String(slug || '')
    .replace(/^\/+/, '')
    .replace(/^(services|tech)\/+/, '')
const serviceDocBySlug = new Map()
for (const doc of servicesResult.docs) {
  serviceDocBySlug.set(bareSlug(doc.slug), doc)
}

const projectBySlug = new Map()
for (const doc of projectsResult.docs) {
  const bare = String(doc.slug || '').replace(/^\/work\/+/, '')
  if (bare) projectBySlug.set(bare, doc)
  if (doc.canonicalSlug) projectBySlug.set(String(doc.canonicalSlug), doc)
}

const idsFor = (slugs, pageType, warn) =>
  (slugs || [])
    .map((slug) => {
      const doc = serviceDocBySlug.get(slug)
      if (!doc) {
        warn.push(`unknown slug '${slug}' (dropped)`)
        return null
      }
      if (doc.pageType !== pageType) {
        warn.push(`slug '${slug}' has pageType '${doc.pageType}', expected '${pageType}' (dropped)`)
        return null
      }
      return doc.id
    })
    .filter((id) => Number.isFinite(id))

// ─── Plan writes ────────────────────────────────────────────────────────────

console.log('')
console.log(
  `Image tag apply ${apply ? '(APPLY)' : '(DRY-RUN, no writes)'}, ${proposals.size} project proposal file(s)` +
    (minConfidence ? `, confidence >= ${minConfidence}` : '') +
    (force ? ', --force overwriting tagged rows' : ''),
)
console.log('')

let totalRowsWritten = 0
let totalProjects = 0

for (const [slug, rows] of proposals) {
  const doc = projectBySlug.get(slug)
  if (!doc) {
    console.log(`SKIP ${slug}: no published project doc found`)
    continue
  }
  const images = (Array.isArray(doc.images) ? doc.images : []).map((row) => ({ ...row }))
  const warn = []
  let planned = 0

  for (const row of rows) {
    const target = images[row.index]
    if (!target) {
      warn.push(`images.${row.index} does not exist on the doc (skipped)`)
      continue
    }
    if (minConfidence && row.confidence !== minConfidence) continue
    const serviceIds = idsFor(row.serviceSlugs, 'service', warn)
    const techIds = idsFor(row.techSlugs, 'tech', warn)
    if (serviceIds.length === 0 && techIds.length === 0) continue
    const alreadyTagged =
      (Array.isArray(target.serviceTags) && target.serviceTags.length > 0) ||
      (Array.isArray(target.techTags) && target.techTags.length > 0)
    if (alreadyTagged && !force) continue
    target.serviceTags = serviceIds
    target.techTags = techIds
    planned += 1
  }

  if (planned === 0) {
    console.log(`SKIP ${slug}: 0 rows to write${warn.length ? ` (${warn.join('; ')})` : ''}`)
    continue
  }

  totalProjects += 1
  totalRowsWritten += planned
  console.log(`${apply ? '[apply]' : '[plan]'} ${slug}: ${planned} image row(s)`)
  for (const w of warn) console.log(`    ⚠ ${w}`)

  if (apply) {
    await payload.update({
      collection: 'projects',
      id: doc.id,
      data: { images },
      overrideAccess: true,
    })
  }
}

console.log('')
console.log(
  `${apply ? 'WROTE' : 'WOULD WRITE'} ${totalRowsWritten} image row(s) across ${totalProjects} project(s).` +
    (apply ? '' : ' Re-run with --apply to write.'),
)

process.exit(0)

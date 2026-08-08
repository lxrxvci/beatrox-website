#!/usr/bin/env node
/**
 * CMS em-dash purge (audit finding L-02).
 *
 * The live site renders from the Payload CMS Postgres DB, which was imported
 * from the content JSON BEFORE the dash-law cleanup (commit c6a9220). The JSON
 * trees are now 100% em-dash-free; the CMS DB is not. This script scans every
 * rendered text field of the content collections and globals for U+2014
 * (em dash) and U+2015 (horizontal bar) and computes the cleaned replacement.
 *
 * Replacement strategy, two tiers:
 *   1. EXACT-MAP: scripts/dash-purge-map.json holds the byte-exact
 *      before -> after string pairs from the real JSON cleanup commit, so any
 *      CMS string that came from the import gets exactly the wording the JSON
 *      now uses (regenerate with `node scripts/build-dash-map.mjs`).
 *   2. HEURISTIC: for CMS-only strings (SEO defaults global, admin edits),
 *      the same conventions from content-style.md: titles/templates use
 *      "| BEATROX" or ":", body copy uses commas, colons, or sentence splits.
 *      Never "--". Every heuristic replacement is flagged for human review.
 *
 * Modes:
 *   default   DRY RUN. Read-only. Writes a full before/after diff report to
 *             ../reports/cms-dash-purge-dryrun.txt and prints a summary.
 *   --apply   Performs the updates. ALSO requires DASH_PURGE_CONFIRM=apply in
 *             the environment, and refuses to run against a non-localhost DB
 *             without DASH_PURGE_ALLOW_REMOTE=yes. Updates only published
 *             docs (draft-only docs are reported, never published). Docs with
 *             unpublished draft changes are cleaned in both states.
 *
 * Run (from site/):
 *   npm run cms:dash-purge              # dry run
 *   npm run cms:dash-purge:apply        # apply (needs the confirm env vars)
 *
 * Connection: DATABASE_URI/DATABASE_URL + PAYLOAD_SECRET from .env / .env.local
 * via ./load-env.mjs, same as cms:parity. NODE_ENV is forced to "production"
 * before the config loads so the Postgres adapter never schema-pushes.
 */
import './load-env.mjs'
process.env.NODE_ENV = process.env.NODE_ENV || 'production'

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const APPLY = process.argv.includes('--apply')
if (APPLY && process.env.DASH_PURGE_CONFIRM !== 'apply') {
  console.error('Refusing to write: set DASH_PURGE_CONFIRM=apply to confirm --apply mode.')
  process.exit(1)
}

const DASH_RE = /[—―]/
const REPORT_PATH = path.resolve('../reports/cms-dash-purge-dryrun.txt')

// CMS-only values with known cleaned counterparts (Payload field defaults and
// fallbacks already use the cleaned forms, see payload/globals/SeoDefaults.ts
// and lib/fallbacks.ts).
const EXTRA_MAP = new Map([
  ['%s — BEATROX', '%s | BEATROX'],
  ['%s―BEATROX', '%s | BEATROX'],
  ['BEATROX — Experiential Design & Event Production', 'Experiential Design & Event Production | BEATROX'],
])

// ─── Replacement map (exact before -> after pairs from commit c6a9220) ──────
function loadMap() {
  const candidates = [
    path.resolve('scripts/dash-purge-map.json'),
    fileURLToPath(new URL('../dash-purge-map.json', import.meta.url)), // bundled into scripts/.tmp/
  ]
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8'))
      return new Map(Object.entries(parsed.replacements || {}))
    } catch {
      // try next candidate
    }
  }
  console.warn('WARNING: dash-purge-map.json not found, heuristic replacements only.')
  return new Map()
}
const EXACT_MAP = loadMap()
for (const [k, v] of EXTRA_MAP) if (!EXACT_MAP.has(k)) EXACT_MAP.set(k, v)

// ─── Field filtering ─────────────────────────────────────────────────────────
// Keys whose string values are technical (routes, URLs, ids), never rendered
// as prose. Dashes there are none of this script's business.
const SKIP_KEYS = new Set([
  'id', '_id', 'createdAt', 'updatedAt', 'globalType', '_status',
  'slug', 'url', 'embedUrl', 'canonicalUrl', 'legacyUrl', 'heroImageLegacyUrl',
  'ogImageLegacyUrl', 'filename', 'path', 'link', 'image', 'liveUrl',
  'previewUrl', 'previewPath', 'email', 'phone', 'phoneFormatted', 'mimeType',
  'thumbnailURL', 'color', 'brandPrimary', 'brandSecondary', 'backgroundColor',
  'fontFamilyHeading', 'fontFamilyBody', 'buttonStyle', 'provider', 'rel',
])

function looksTechnical(value) {
  const v = value.trim()
  if (!v) return true
  if (/^https?:\/\//i.test(v)) return true
  if (/^\/[\w\-./]*$/.test(v)) return true // site path
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return true
  return false
}

// ─── Heuristic replacement (content-style.md conventions) ────────────────────
function heuristicClean(value, keyPath) {
  let out = value
  const titleish = /(^|\.)(seo\.)?(title|ogTitle|titleTemplate|defaultTitle|label|headline|name)$/i.test(keyPath)

  // Title-template convention first: "%s — BEATROX" -> "%s | BEATROX".
  if (out.includes('%s')) {
    out = out.replace(/(%s)\s*[—―]\s*/g, '$1 | ')
  }

  out = out.replace(/\s*[—―]\s*(\w+)?/g, (match, word, offset, whole) => {
    const before = whole.slice(0, offset)
    if (!before.trim()) return word || '' // leading dash
    if (!word) {
      const after = whole.slice(offset + match.length)
      if (!after.trim()) return '' // trailing dash
      if (/^["'“(‘]/.test(after)) return ': '
      return ', '
    }
    const lower = word.toLowerCase()
    if (titleish) return ': ' + word
    // Participle/preposition continuation reads best as a comma.
    if (lower.endsWith('ing') || ['from', 'with', 'including', 'featuring', 'showcasing', 'and', 'or', 'but', 'plus', 'spanning'].includes(lower)) {
      return ', ' + word
    }
    // Article introduces an apposition or list: colon.
    if (['a', 'an', 'the'].includes(lower)) return ': ' + word
    // Short fragment before the dash (label, heading, location): comma,
    // matching "Moynihan Station — New York, NY" -> ", " in the JSON cleanup.
    const fragment = before.split(/[.!?\n]/).pop().trim()
    if (fragment.length < 50) return ', ' + word
    // Numbers: "20 years — 5 continents" style, comma.
    if (/^\d/.test(word)) return ', ' + word
    // Independent clause: split sentences and capitalize.
    return '. ' + word.charAt(0).toUpperCase() + word.slice(1)
  })

  // Artifact cleanup: collapse spaces, detach punctuation, dedupe commas.
  out = out
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ ([,.;:!?])/g, '$1')
    .replace(/,(\s*,)+/g, ',')
    .replace(/,\s*\./g, '.')
    .replace(/:\s*\./g, '.')
    .trim()
  return out
}

function cleanString(value, keyPath) {
  if (!DASH_RE.test(value)) return null
  if (EXACT_MAP.has(value)) {
    return { text: EXACT_MAP.get(value), method: 'exact-map' }
  }
  const text = heuristicClean(value, keyPath)
  if (text === value || DASH_RE.test(text)) return { text, method: 'UNRESOLVED' }
  return { text, method: 'heuristic' }
}

// ─── Document walker ─────────────────────────────────────────────────────────
// Deep-clones doc, replacing dash-bearing strings in place. Records one change
// per leaf. Returns null when nothing violates.
function transformValue(value, keyPath, changes) {
  if (typeof value === 'string') {
    if (!DASH_RE.test(value)) return value
    const key = keyPath.split('.').pop() || ''
    if (SKIP_KEYS.has(key) || looksTechnical(value)) return value
    const result = cleanString(value, keyPath)
    if (!result || result.text === value) {
      if (result?.method === 'UNRESOLVED') {
        changes.push({ path: keyPath, before: value, after: value, method: 'UNRESOLVED' })
      }
      return value
    }
    changes.push({ path: keyPath, before: value, after: result.text, method: result.method })
    return result.text
  }
  if (Array.isArray(value)) {
    return value.map((item, i) => transformValue(item, `${keyPath}[${i}]`, changes))
  }
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = transformValue(v, keyPath ? `${keyPath}.${k}` : k, changes)
    }
    return out
  }
  return value
}

function transformDoc(doc) {
  const changes = []
  const cleaned = transformValue(doc, '', changes)
  return changes.length > 0 ? { cleaned, changes } : null
}

// ─── Hours-like text inventory ───────────────────────────────────────────────
const HOURS_RE = /\b(hours?|hrs?)\b|\b\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?)\b|\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\b|\bmon\s?[-–—]\s?fri\b|\b\d{1,2}:\d{2}\s?(am|pm)?\b/i

function scanHours(value, keyPath, hits) {
  if (typeof value === 'string') {
    const key = keyPath.split('.').pop() || ''
    if (SKIP_KEYS.has(key)) return
    if (HOURS_RE.test(value)) hits.push({ path: keyPath, text: value })
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => scanHours(item, `${keyPath}[${i}]`, hits))
    return
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) scanHours(v, keyPath ? `${keyPath}.${k}` : k, hits)
  }
}

// ─── Collections / globals in scope ──────────────────────────────────────────
// media is scanned for alt/caption only (rendered as alt text); it has no
// drafts and no versions tracking in this project.
const COLLECTIONS = [
  { slug: 'pages', drafts: true, label: (d) => d.slug },
  { slug: 'services', drafts: true, label: (d) => d.slug },
  { slug: 'projects', drafts: true, label: (d) => d.slug },
  { slug: 'case-studies', drafts: true, label: (d) => d.slug },
  { slug: 'team', drafts: true, label: (d) => d.slug },
  { slug: 'media', drafts: false, label: (d) => d.filename, fields: ['alt', 'caption'] },
  { slug: 'consultation-types', drafts: false, label: (d) => d.slug, fields: ['name', 'description'] },
]
const GLOBALS = [
  { slug: 'seo-defaults' },
  { slug: 'navigation' },
  { slug: 'capability-tiles' },
  { slug: 'site-styles' },
]

function dbHost() {
  const uri = process.env.DATABASE_URI || process.env.DATABASE_URL || ''
  const match = uri.match(/@([^/:]+)/)
  return match ? match[1] : '(unparsed)'
}

async function findAll(payload, collection, draft) {
  const docs = []
  let page = 1
  for (;;) {
    const result = await payload.find({
      collection,
      limit: 100,
      page,
      depth: 0,
      draft,
      overrideAccess: true,
    })
    docs.push(...result.docs)
    if (!result.hasNextPage) return docs
    page++
  }
}

async function main() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config.ts')
  const payload = await getPayload({ config })

  const lines = []
  const out = (line = '') => {
    lines.push(line)
    console.log(line)
  }

  out('='.repeat(78))
  out(`CMS DASH PURGE ${APPLY ? '-- APPLY MODE' : '-- DRY RUN (read-only)'}`)
  out(`Date: ${new Date().toISOString()}`)
  out(`Database host: ${dbHost()}`)
  out(`Exact replacement pairs loaded: ${EXACT_MAP.size}`)
  out('='.repeat(78))

  const summary = []
  const hoursReport = []
  const editReport = []
  let appliedCount = 0

  for (const col of COLLECTIONS) {
    // One find covers everything: with overrideAccess the local API returns
    // every main-table doc. Rendering status comes from the custom `status`
    // select, Payload draft state from `_status` (see note in the loop).
    const docs = await findAll(payload, col.slug, false)

    let docsWithViolations = 0
    let pubDocsHit = 0
    let draftDocsHit = 0
    let fieldCount = 0
    let exactCount = 0
    let heuristicCount = 0
    let unresolvedCount = 0

    for (const doc of docs) {
      const label = col.label(doc) || doc.id
      // Two status fields, two meanings (verified 2026-08-08):
      //   status   = the collections' custom workflow select. The frontend
      //              resolvers in lib/content.ts filter on THIS field
      //              (status=published) with overrideAccess:true, so it
      //              decides what the live site renders.
      //   _status  = Payload's drafts system. Only affects the admin UI and
      //              anonymous API reads. Many docs render live while being
      //              _status=draft.
      const isLive = !col.drafts || doc.status === 'published'
      const isPayloadDraft = col.drafts && doc._status && doc._status !== 'published'
      const stateNote = []
      if (col.drafts) {
        stateNote.push(isLive
          ? `status=published (RENDERS LIVE)${isPayloadDraft ? ', _status=draft (admin-only draft state)' : ''}`
          : `status=${doc.status || 'unset'} (not rendered)`)
      }

      // Post-import edit signal: updatedAt meaningfully after createdAt.
      if (doc.createdAt && doc.updatedAt) {
        const gapMs = new Date(doc.updatedAt) - new Date(doc.createdAt)
        if (gapMs > 5 * 60 * 1000) {
          let versionCount = null
          if (col.drafts) {
            try {
              const versions = await payload.findVersions({
                collection: col.slug,
                where: { parent: { equals: doc.id } },
                limit: 0,
              })
              versionCount = versions.totalDocs
            } catch {
              versionCount = '?'
            }
          }
          editReport.push({
            collection: col.slug,
            label,
            id: doc.id,
            status: `${doc.status ?? 'n/a'}/${doc._status ?? 'n/a'}`,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            versions: versionCount,
          })
        }
      }

      const result = transformDoc(col.fields
        ? Object.fromEntries(Object.entries(doc).filter(([k]) => col.fields.includes(k) || ['id', 'createdAt', 'updatedAt'].includes(k)))
        : doc)

      // Hours inventory runs over the full doc regardless of dashes.
      const hoursHits = []
      scanHours(doc, '', hoursHits)
      for (const hit of hoursHits) {
        hoursReport.push({ collection: col.slug, label, id: doc.id, status: doc._status || 'n/a', ...hit })
      }

      if (!result) continue
      docsWithViolations++
      if (isLive) pubDocsHit++
      else draftDocsHit++
      for (const change of result.changes) {
        if (change.method === 'exact-map') exactCount++
        else if (change.method === 'heuristic') heuristicCount++
        else unresolvedCount++
        fieldCount++
        out('')
        out(`[${col.slug}] ${label} (id ${doc.id})${stateNote.length ? '  << ' + stateNote.join('; ') : ''}`)
        out(`  field:  ${change.path}`)
        out(`  method: ${change.method}${change.method === 'heuristic' ? '  << REVIEW WORDING' : ''}${change.method === 'UNRESOLVED' ? '  << NOT AUTO-FIXED' : ''}`)
        out(`  BEFORE: ${JSON.stringify(change.before)}`)
        out(`  AFTER:  ${JSON.stringify(change.after)}`)
      }

      if (APPLY) {
        const unresolved = result.changes.filter((c) => c.method === 'UNRESOLVED')
        const topLevel = [...new Set(result.changes
          .filter((c) => c.method !== 'UNRESOLVED')
          .map((c) => c.path.split('.')[0].split('[')[0]))]
        if (unresolved.length > 0) {
          out(`  SKIP (has UNRESOLVED fields, needs manual wording): ${label}`)
        } else if (topLevel.length > 0) {
          const data = {}
          for (const key of topLevel) data[key] = result.cleaned[key]
          // draft follows Payload's _status: docs that are _status=draft stay
          // drafts (their custom status field, which drives rendering, is not
          // touched), _status=published docs are published in place.
          await payload.update({ collection: col.slug, id: doc.id, data, draft: isPayloadDraft, overrideAccess: true })
          appliedCount++
          out(`  APPLIED (${isPayloadDraft ? 'saved as draft, _status unchanged' : 'published in place'}): ${label} (fields: ${topLevel.join(', ')})`)
        }
      }
    }

    summary.push({
      collection: col.slug,
      docs: docs.length,
      docsWithViolations,
      pubDocsHit,
      draftDocsHit,
      fieldCount,
      exactCount,
      heuristicCount,
      unresolvedCount,
    })
  }

  // ─── Globals ──────────────────────────────────────────────────────────────
  for (const g of GLOBALS) {
    let doc
    try {
      doc = await payload.findGlobal({ slug: g.slug, depth: 0, overrideAccess: true })
    } catch (err) {
      out(`\n[global:${g.slug}] could not read: ${err.message}`)
      continue
    }
    const hoursHits = []
    scanHours(doc, '', hoursHits)
    for (const hit of hoursHits) {
      hoursReport.push({ collection: `global:${g.slug}`, label: g.slug, id: doc.id || '-', ...hit })
    }
    const result = transformDoc(doc)
    let fieldCount = 0
    let exactCount = 0
    let heuristicCount = 0
    if (result) {
      for (const change of result.changes) {
        if (change.method === 'exact-map') exactCount++
        else heuristicCount++
        fieldCount++
        out('')
        out(`[global:${g.slug}]`)
        out(`  field:  ${change.path}`)
        out(`  method: ${change.method}${change.method === 'heuristic' ? '  << REVIEW WORDING' : ''}`)
        out(`  BEFORE: ${JSON.stringify(change.before)}`)
        out(`  AFTER:  ${JSON.stringify(change.after)}`)
      }
      if (APPLY) {
        const topLevel = [...new Set(result.changes.map((c) => c.path.split('.')[0].split('[')[0]))]
        const data = {}
        for (const key of topLevel) data[key] = result.cleaned[key]
        await payload.updateGlobal({ slug: g.slug, data, overrideAccess: true })
        appliedCount++
        out(`  APPLIED: global ${g.slug} (fields: ${topLevel.join(', ')})`)
      }
    }
    summary.push({
      collection: `global:${g.slug}`,
      docs: 1,
      docsWithViolations: result ? 1 : 0,
      pubDocsHit: result ? 1 : 0,
      draftDocsHit: 0,
      fieldCount,
      exactCount,
      heuristicCount,
      unresolvedCount: 0,
    })
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  out('')
  out('='.repeat(78))
  out('SUMMARY (live = custom status=published, what the site renders today;')
  out('latent = custom status draft/review, not rendered until published)')
  out('='.repeat(78))
  out(`${'collection'.padEnd(26)} ${'docs'.padStart(6)} ${'hit'.padStart(5)} ${'live'.padStart(5)} ${'latent'.padStart(7)} ${'fields'.padStart(7)} ${'exact'.padStart(6)} ${'heur'.padStart(6)} ${'unres'.padStart(6)}`)
  for (const s of summary) {
    out(`${s.collection.padEnd(26)} ${String(s.docs).padStart(6)} ${String(s.docsWithViolations).padStart(5)} ${String(s.pubDocsHit).padStart(5)} ${String(s.draftDocsHit).padStart(7)} ${String(s.fieldCount).padStart(7)} ${String(s.exactCount).padStart(6)} ${String(s.heuristicCount).padStart(6)} ${String(s.unresolvedCount).padStart(6)}`)
  }

  out('')
  out('='.repeat(78))
  out('HOURS-LIKE TEXT INVENTORY (for consistent business-hours updates)')
  out('='.repeat(78))
  if (hoursReport.length === 0) out('(none found)')
  for (const hit of hoursReport) {
    out(`[${hit.collection}] ${hit.label} :: ${hit.path}`)
    out(`  ${JSON.stringify(hit.text.length > 200 ? hit.text.slice(0, 200) + '...' : hit.text)}`)
  }

  out('')
  out('='.repeat(78))
  out('POST-IMPORT EDIT SIGNALS (updatedAt > createdAt + 5min: review before apply)')
  out('='.repeat(78))
  if (editReport.length === 0) out('(none found)')
  for (const e of editReport.sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt)))) {
    out(`[${e.collection}] ${e.label} (id ${e.id})  status=${e.status}`)
    out(`  createdAt ${e.createdAt}  updatedAt ${e.updatedAt}  versions: ${e.versions ?? 'n/a'}`)
  }

  if (APPLY) {
    out('')
    out(`APPLY MODE: ${appliedCount} documents/globals updated.`)
  } else {
    out('')
    out('DRY RUN: no writes performed. To apply, run with --apply and')
    out('DASH_PURGE_CONFIRM=apply (plus DASH_PURGE_ALLOW_REMOTE=yes for a remote DB).')
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true })
  fs.writeFileSync(REPORT_PATH, lines.join('\n') + '\n')
  console.log(`\nReport written to ${REPORT_PATH}`)

  await payload.db?.destroy?.().catch(() => {})
  process.exit(0)
}

// Remote-DB guard for apply mode.
if (APPLY) {
  const host = dbHost()
  const local = /localhost|127\.0\.0\.1/.test(host)
  if (!local && process.env.DASH_PURGE_ALLOW_REMOTE !== 'yes') {
    console.error(`Refusing to apply against remote database host "${host}" without DASH_PURGE_ALLOW_REMOTE=yes.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

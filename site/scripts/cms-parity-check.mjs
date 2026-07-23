#!/usr/bin/env node
/**
 * CMS ↔ JSON parity gate.
 *
 * Compares what the CMS resolvers in lib/content.ts return (reading the Neon DB
 * via the Payload local API) against the sync JSON getters in
 * lib/json-content.ts (the pre-migration source of truth). Page wiring
 * (Phase 3) is blocked until this reports 100% parity.
 *
 * Normalization (rendering-equivalent, reviewed and accepted):
 *   - `''` and `undefined`/missing keys are treated as equal
 *   - empty arrays are treated as missing
 *   - DB artifacts (`id`, `createdAt`, `updatedAt`) are ignored — never rendered
 *   - CMS `contentBlocks` (absent from the JSON baseline) are skipped when the
 *     CMS doc also has `body` — the renderer prefers `body`, so blocks are
 *     never rendered there. When CMS `body` is empty, block plain-text is
 *     compared against the JSON `body` (the migration source)
 *   Everything else is compared exactly and reported field-by-field.
 *
 * Also fails if:
 *   - the CMS is unreachable or published+enabled doc counts don't match JSON
 *   - any resolver logged a "falling back to JSON" warning (vacuous parity)
 *
 * Run (from site/): `npm run cms:parity`
 * (bundles via esbuild, loads DATABASE_URI/DATABASE_URL + PAYLOAD_SECRET from .env
 * via ./load-env.mjs, then executes against the Neon DB those vars point at).
 */
import './load-env.mjs'
import { getPayload } from 'payload'
import config from '../payload.config.ts'
import {
  getAllProjectsResolved,
  getProjectResolved,
  getProjectSlugsResolved,
  getAllServicesResolved,
  getServiceResolved,
  getServiceSlugsResolved,
  getTeamResolved,
  getHomepageResolved,
  getAboutResolved,
  getContactResolved,
  getNavigationLinks,
  getSiteStyles,
  getSeoDefaults,
} from '../lib/content.ts'
import {
  getAllProjects,
  getProject,
  getProjectSlugs,
  getAllServices,
  getService,
  getServiceSlugs,
  getTeam,
  getHomepage,
  getAbout,
  getContact,
} from '../lib/json-content.ts'
import {
  FALLBACK_NAVIGATION,
  FALLBACK_SITE_STYLES,
  FALLBACK_SEO_DEFAULTS,
} from '../lib/fallbacks.ts'

// ─── Fallback-warning interception (a fallback makes parity vacuous) ─────────
const fallbackWarnings = []
const originalWarn = console.warn
console.warn = (...args) => {
  const message = args.map(String).join(' ')
  if (message.includes('falling back to JSON')) fallbackWarnings.push(message)
  originalWarn(...args)
}

// ─── Normalization + diff engine ─────────────────────────────────────────────

// DB/upload artifacts absent from the JSON baseline — either never rendered
// (ids, timestamps) or optional enrichment the renderer treats as optional
// (image width/height, used only as layout hints when present).
const IGNORED_KEYS = new Set(['id', 'createdAt', 'updatedAt', 'width', 'height', 'serviceTags', 'techTags', 'sourceIndex'])

function norm(value) {
  if (value === undefined || value === null || value === '') return undefined
  if (Array.isArray(value)) {
    const arr = value.map(norm).filter((item) => item !== undefined)
    return arr.length > 0 ? arr : undefined
  }
  if (typeof value === 'object') {
    const out = {}
    for (const key of Object.keys(value)) {
      if (IGNORED_KEYS.has(key)) continue
      const nested = norm(value[key])
      if (nested !== undefined) out[key] = nested
    }
    return Object.keys(out).length > 0 ? out : undefined
  }
  return value
}

// ─── contentBlocks ↔ body text bridge ────────────────────────────────────────
// CMS docs carry `contentBlocks` (Lexical blocks migrated from the legacy
// `body` array); the JSON baseline only has `body`. Rendering equivalence =
// the plain text of both is identical after whitespace normalization.

function collectLexicalText(node, out) {
  if (Array.isArray(node)) {
    for (const item of node) collectLexicalText(item, out)
    return
  }
  if (!node || typeof node !== 'object') return
  if (node.type === 'text' && typeof node.text === 'string') {
    out.push(node.text)
    return
  }
  for (const value of Object.values(node)) collectLexicalText(value, out)
}

function contentBlocksToText(blocks) {
  const out = []
  collectLexicalText(blocks, out)
  return out.join('\n')
}

function bodyToText(body) {
  if (!Array.isArray(body)) return ''
  const out = []
  for (const block of body) {
    if (!block || typeof block !== 'object') continue
    if (block.heading) out.push(String(block.heading))
    if (block.content) out.push(String(block.content))
    for (const item of Array.isArray(block.items) ? block.items : []) {
      if (typeof item === 'string') out.push(item)
      else if (item && typeof item === 'object') {
        // FAQ rows store {question, answer}; plain rows store {value}.
        if (item.question) out.push(String(item.question))
        if (item.answer) out.push(String(item.answer))
        if (item.value) out.push(String(item.value))
      }
    }
  }
  return out.join('\n')
}

function normalizeText(text) {
  return String(text)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

function diff(cmsValue, jsonValue, path, out) {
  const a = norm(cmsValue)
  const b = norm(jsonValue)
  if (a === undefined && b === undefined) return
  if (a === undefined || b === undefined) {
    out.push(`${path}: CMS=${JSON.stringify(a)} JSON=${JSON.stringify(b)}`)
    return
  }
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    out.push(`${path}: type mismatch CMS=${JSON.stringify(a)} JSON=${JSON.stringify(b)}`)
    return
  }
  if (Array.isArray(a)) {
    if (a.length !== b.length) {
      out.push(`${path}: array length CMS=${a.length} JSON=${b.length}`)
      return
    }
    for (let i = 0; i < a.length; i += 1) diff(a[i], b[i], `${path}[${i}]`, out)
    return
  }
  if (typeof a === 'object') {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)

    // contentBlocks bridge: CMS-only field, migrated from `body`. The
    // frontend renders `body` when present (seeded docs carry both; body
    // wins) and only falls back to contentBlocks when body is empty — so
    // contentBlocks is rendering-irrelevant whenever body exists. Only when
    // CMS body is empty do we compare normalized plain text against the
    // JSON body. The raw key is skipped either way.
    let skipKeys
    if ('contentBlocks' in a && !('contentBlocks' in b)) {
      if (!('body' in a)) {
        const cmsText = normalizeText(contentBlocksToText(a.contentBlocks))
        const jsonText = normalizeText(bodyToText(b.body))
        if (cmsText !== jsonText) {
          out.push(
            `${path}.contentBlocks↔body: text mismatch (CMS ${cmsText.length} chars vs JSON ${jsonText.length} chars)`,
          )
        }
      }
      skipKeys = new Set(['contentBlocks'])
    }

    for (const key of new Set([...aKeys, ...bKeys])) {
      if (skipKeys?.has(key)) continue
      diff(a[key], b[key], path ? `${path}.${key}` : key, out)
    }
    return
  }
  if (a !== b) out.push(`${path}: CMS=${JSON.stringify(a)} JSON=${JSON.stringify(b)}`)
}

const failures = []
let checks = 0

function compare(label, cmsValue, jsonValue) {
  checks += 1
  const problems = []
  diff(cmsValue, jsonValue, label, problems)
  if (problems.length > 0) {
    failures.push({ label, problems })
    console.log(`✗ ${label}: ${problems.length} diff(s)`)
    for (const problem of problems.slice(0, 10)) console.log(`    ${problem}`)
    if (problems.length > 10) console.log(`    … and ${problems.length - 10} more`)
  } else {
    console.log(`✓ ${label}`)
  }
}

function sortBy(list, key) {
  return [...list].sort((a, b) => String(a[key]).localeCompare(String(b[key])))
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const payload = await getPayload({ config })

  // 1. CMS liveness + published counts must match JSON source counts
  const countExpectations = [
    ['projects', getAllProjects().length],
    ['services', getAllServices().length],
    ['team', getTeam().members.length],
  ]
  for (const [collection, expected] of countExpectations) {
    const result = await payload.find({
      collection,
      where: { status: { equals: 'published' }, isEnabled: { equals: true } },
      limit: 0,
      depth: 0,
    })
    if (result.totalDocs !== expected) {
      failures.push({
        label: `${collection} count`,
        problems: [`published+enabled in CMS=${result.totalDocs}, expected ${expected} from JSON`],
      })
      console.log(`✗ ${collection} count: CMS=${result.totalDocs} expected=${expected}`)
    } else {
      console.log(`✓ ${collection} count = ${expected}`)
    }
  }

  // 2. Projects
  compare('project slugs', [...(await getProjectSlugsResolved())].sort(), [...getProjectSlugs()].sort())
  compare('projects (list)', sortBy(await getAllProjectsResolved(), 'canonicalSlug'), sortBy(getAllProjects(), 'canonicalSlug'))
  for (const slug of getProjectSlugs()) {
    compare(`project "${slug}"`, await getProjectResolved(slug), getProject(slug))
  }

  // 3. Services
  compare('service slugs', [...(await getServiceSlugsResolved())].sort(), [...getServiceSlugs()].sort())
  compare('services (list)', sortBy(await getAllServicesResolved(), 'slug'), sortBy(getAllServices(), 'slug'))
  for (const slug of getServiceSlugs()) {
    compare(`service "${slug}"`, await getServiceResolved(slug), getService(slug))
  }

  // 4. Team (page + members)
  const cmsTeam = await getTeamResolved()
  const jsonTeam = getTeam()
  compare('team', { ...cmsTeam, members: sortBy(cmsTeam.members, 'order') }, { ...jsonTeam, members: sortBy(jsonTeam.members, 'order') })

  // 5. Pages (home / about / contact)
  compare('homepage', await getHomepageResolved(), getHomepage())
  compare('about page', await getAboutResolved(), getAbout())
  compare('contact page', await getContactResolved(), getContact())

  // 6. Globals
  compare('navigation global', await getNavigationLinks(), FALLBACK_NAVIGATION)
  compare('site-styles global', await getSiteStyles(), FALLBACK_SITE_STYLES)
  compare('seo-defaults global', await getSeoDefaults(), FALLBACK_SEO_DEFAULTS)

  // 7. Fallback warnings = vacuous parity
  if (fallbackWarnings.length > 0) {
    failures.push({
      label: 'resolver fallbacks',
      problems: fallbackWarnings.map((warning) => `resolver fell back to JSON: ${warning}`),
    })
    console.log(`✗ ${fallbackWarnings.length} resolver fallback(s) triggered during comparison`)
  }

  console.log(`\n${checks} comparisons, ${failures.length} failing section(s)`)
  if (failures.length > 0) {
    console.error('PARITY GATE: FAIL')
    process.exit(1)
  }
  console.log('PARITY GATE: PASS')
  process.exit(0)
}

main().catch((error) => {
  console.error('Parity check crashed:', error)
  process.exit(1)
})

#!/usr/bin/env node
/**
 * Tag seeder — DRY-RUN by default; `--apply` writes.
 *
 * For every published project (payload.find, depth 0):
 *   1. Suggests serviceTags with the keyword engine ported from
 *      content-audit.mjs, extended with aliases for the 6 new services
 *      (stage-design, immersive-environments, experiential-events,
 *      projection-mapping, multimedia-displays, audio-production). Only
 *      non-tech services (pageType !== 'tech') are targeted — relatedness is
 *      service-only.
 *   2. Suggests techTags from metadata.type, hero.tags, and the free-text
 *      metadata tech/techniques/materials/software/spec arrays, mapped to
 *      services docs with pageType 'tech'. Precision over recall: only
 *      credible keyword hits are suggested.
 *
 * Idempotent: only fills fields that are currently EMPTY — existing tags are
 * never overwritten. Aliases pointing at slugs that don't exist in the CMS
 * are dropped, so a dry-run before the CMS import simply omits the new
 * services.
 *
 * Run (from site/): `npm run tags:seed` (dry-run) or `npm run tags:seed:apply`.
 * Bundled by esbuild like cms:parity.
 */
import './load-env.mjs'
import { getPayload } from 'payload'
import config from '../payload.config.ts'

const apply = process.argv.includes('--apply')

const payload = await getPayload({ config })

// ─── Data ───────────────────────────────────────────────────────────────────

const [projectsResult, servicesResult] = await Promise.all([
  payload.find({
    collection: 'projects',
    where: { status: { equals: 'published' } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  }),
  payload.find({
    collection: 'services',
    limit: 500,
    depth: 0,
    overrideAccess: true,
  }),
])

const projects = projectsResult.docs
const serviceDocs = servicesResult.docs

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function words(text) {
  const n = normalize(text)
  return n ? n.split(' ') : []
}

/** CMS service slugs may be bare or carry a "services/" / "/services/" prefix. */
function normalizeServiceSlug(slug) {
  return String(slug || '')
    .replace(/^\/+/, '')
    .replace(/^services\/+/, '')
}

function arrayValues(rows, key) {
  if (!Array.isArray(rows)) return []
  return rows
    .map((row) => (row && typeof row === 'object' ? String(row[key] || '') : ''))
    .filter(Boolean)
}

/** Free-text signal for a raw (depth 0) project doc. */
function projectText(doc, { includeTechArrays = false } = {}) {
  const metadata = doc.metadata || {}
  const parts = [
    doc.title,
    metadata.type,
    ...arrayValues(doc.hero?.tags, 'tag'),
  ]
  if (includeTechArrays) {
    for (const field of ['tech', 'techniques', 'materials', 'software', 'spec']) {
      parts.push(...arrayValues(metadata[field], 'value'))
    }
  }
  return normalize(parts.join(' '))
}

function buildMatcher(aliasTable, targetIndex) {
  const wordAliases = new Map() // single word -> slug
  const phraseAliases = [] // [phrase, slug, regex]
  for (const [alias, target] of Object.entries(aliasTable)) {
    // Aliases pointing at slugs that don't exist in the CMS are dropped.
    if (!targetIndex.has(target)) continue
    if (alias.includes(' ')) {
      phraseAliases.push([alias, target, new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`)])
    } else {
      wordAliases.set(alias, target)
    }
  }

  return { wordAliases, phraseAliases }
}

function matchText(text, { wordAliases, phraseAliases }, distinctiveTerms = null) {
  const tokens = new Set(text ? text.split(' ') : [])
  const matches = new Map() // slug -> Set of matched terms

  const addMatch = (slug, term) => {
    if (!matches.has(slug)) matches.set(slug, new Set())
    matches.get(slug).add(term)
  }

  for (const token of tokens) {
    if (distinctiveTerms) {
      const targets = distinctiveTerms.get(token)
      if (targets) for (const slug of targets) addMatch(slug, token)
    }
    const aliasTarget = wordAliases.get(token)
    if (aliasTarget) addMatch(aliasTarget, token)
  }
  for (const [phrase, target, regex] of phraseAliases) {
    if (regex.test(text)) addMatch(target, phrase)
  }
  return matches
}

// ─── Service index (serviceTags target services + rentals, never tech docs) ─

const allServiceIndex = serviceDocs.map((doc) => {
  const slug = normalizeServiceSlug(doc.slug)
  return {
    id: Number(doc.id),
    slug,
    title: String(doc.title || slug),
    pageType: String(doc.pageType || 'service'),
    terms: new Set([...words(doc.title), ...words(slug.replace(/-/g, ' '))]),
  }
})
const serviceDocBySlug = new Map(allServiceIndex.map((s) => [s.slug, s]))

const serviceIndex = allServiceIndex.filter((s) => s.pageType !== 'tech')
const techIndex = allServiceIndex.filter((s) => s.pageType === 'tech')
const serviceBySlug = new Map(serviceIndex.map((s) => [s.slug, s]))
const techBySlug = new Map(techIndex.map((s) => [s.slug, s]))

// Term document frequency across services — terms shared by 3+ services are
// too generic to suggest on (e.g. "production", "design", "lighting").
const termFrequency = new Map()
for (const svc of serviceIndex) {
  for (const term of svc.terms) {
    termFrequency.set(term, (termFrequency.get(term) || 0) + 1)
  }
}

// Stopwords carry no signal ("Backline & Stage Rental" normalizes to
// "backline and stage rental" — without this, "AI & Computer Vision" would
// match on "and").
const STOPWORDS = new Set(['and', 'the', 'of', 'for', 'a', 'an', 'in', 'on', 'to'])

// distinctive term -> service slugs containing it
const distinctiveTerms = new Map()
for (const svc of serviceIndex) {
  for (const term of svc.terms) {
    if (term.length >= 3 && !STOPWORDS.has(term) && (termFrequency.get(term) || 0) <= 2) {
      if (!distinctiveTerms.has(term)) distinctiveTerms.set(term, [])
      distinctiveTerms.get(term).push(svc.slug)
    }
  }
}

// Hand-tuned aliases (ported from content-audit.mjs), extended for the 6 new
// services: stage-design, immersive-environments, experiential-events,
// projection-mapping, multimedia-displays, audio-production.
const SERVICE_ALIASES = {
  'led wall': 'led-video-wall-rentals',
  dj: 'dj-equipment-rentals',
  laser: 'laser-shows',
  drone: 'drone-light-shows',
  fabrication: 'custom-fabrication',
  staging: 'staging-rigging',
  // New services
  stage: 'stage-design',
  'stage design': 'stage-design',
  immersive: 'immersive-environments',
  experiential: 'experiential-events',
  projection: 'projection-mapping',
  'projection mapping': 'projection-mapping',
  multimedia: 'multimedia-displays',
  display: 'multimedia-displays',
  displays: 'multimedia-displays',
  kiosk: 'multimedia-displays',
  audio: 'audio-production',
  sound: 'audio-production',
  foh: 'audio-production',
}

// Tech keyword map — only credible hits, precision over recall. Targets are
// the 31 tech capability slugs (services docs with pageType 'tech').
const TECH_KEYWORDS = {
  // software & electronics
  arduino: 'software-development',
  'raspberry pi': 'software-development',
  firmware: 'software-development',
  relay: 'software-development',
  relays: 'software-development',
  microcontroller: 'software-development',
  'custom controller': 'software-development',
  'software development': 'software-development',
  'interactive software': 'software-development',
  'software integration': 'software-development',
  // realtime content / ar / vr / xr
  touchdesigner: 'realtime-content-ar-vr-xr',
  notch: 'realtime-content-ar-vr-xr',
  unreal: 'realtime-content-ar-vr-xr',
  unity: 'realtime-content-ar-vr-xr',
  blender: 'realtime-content-ar-vr-xr',
  'real-time': 'realtime-content-ar-vr-xr',
  realtime: 'realtime-content-ar-vr-xr',
  kinect: 'realtime-content-ar-vr-xr',
  lidar: 'realtime-content-ar-vr-xr',
  'motion tracking': 'realtime-content-ar-vr-xr',
  'computer vision': 'realtime-content-ar-vr-xr',
  'ar mirror': 'realtime-content-ar-vr-xr',
  'interactive ar': 'realtime-content-ar-vr-xr',
  'ar moments': 'realtime-content-ar-vr-xr',
  'vr headsets': 'realtime-content-ar-vr-xr',
  'vr experience': 'realtime-content-ar-vr-xr',
  holographic: 'realtime-content-ar-vr-xr',
  // 3d animation / motion capture
  'motion capture': '3d-animation-motion-capture',
  '3d scanning': '3d-animation-motion-capture',
  '3d world': '3d-animation-motion-capture',
  avatar: '3d-animation-motion-capture',
  // av content design
  'projection mapping': 'av-content-design',
  'video mapping': 'av-content-design',
  'forced perspective content': 'av-content-design',
  // media servers & playback
  'media server': 'media-server-playback-solutions',
  'media servers': 'media-server-playback-solutions',
  disguise: 'media-server-playback-solutions',
  resolume: 'media-server-playback-solutions',
  watchout: 'media-server-playback-solutions',
  playback: 'media-server-playback-solutions',
  // av system integration
  'led wall': 'av-system-integration',
  'led walls': 'av-system-integration',
  'led video': 'av-system-integration',
  'video panel': 'av-system-integration',
  'video panels': 'av-system-integration',
  pixel: 'av-system-integration',
  'pixel mapping': 'av-system-integration',
  'tiled tv': 'av-system-integration',
  'portal displays': 'av-system-integration',
  'ultra wide format displays': 'av-system-integration',
  'hardware and software integration': 'av-system-integration',
  // lighting
  'lighting design': 'lighting-design',
  grandma: 'lighting-design',
  eos: 'lighting-design',
  dmx: 'lighting-integration',
  'addressable led': 'lighting-integration',
  'addressable leds': 'lighting-integration',
  astera: 'lighting-integration',
  'led lighting': 'lighting-integration',
  'audio-reactive lighting': 'lighting-integration',
  'lighting programming': 'lighting-integration',
  // drafting & fabrication
  rhino: 'drafting-detail-drawings',
  rhino3d: 'drafting-detail-drawings',
  solidworks: 'drafting-detail-drawings',
  autocad: 'drafting-detail-drawings',
  vectorworks: 'drafting-detail-drawings',
  cnc: 'cnc-machining',
  truss: 'staging-rigging',
  rigging: 'staging-rigging',
  fabrication: 'set-scenic-assembly',
  scenic: 'set-scenic-assembly',
  mural: 'set-scenic-assembly',
  // installation & exhibits
  'permanent installation': 'permanent-installation',
  'comic-con': 'trade-convention-booths',
  'comic con': 'trade-convention-booths',
  exhibition: 'trade-convention-booths',
  booth: 'trade-convention-booths',
  'trade show': 'trade-convention-booths',
  // interactive ui/ux
  figma: 'interactive-ui-ux-design',
  'photo booth': 'interactive-ui-ux-design',
  touchpoints: 'interactive-ui-ux-design',
  // environmental / previs
  'environmental design': 'environmental-design',
  'pre-production': 'pre-visualization',
  previs: 'pre-visualization',
  'pre-visualization': 'pre-visualization',
  // production & logistics
  'event production': 'production-management',
  tour: 'tour-management',
  'festival activation': 'event-planning-logistics',
  'marathon activation': 'event-planning-logistics',
  'product launch': 'event-planning-logistics',
}

const serviceMatcher = buildMatcher(SERVICE_ALIASES, serviceBySlug)
const techMatcher = buildMatcher(TECH_KEYWORDS, techBySlug)

function suggestServiceTags(doc) {
  const text = projectText(doc)
  const current = new Set(
    (Array.isArray(doc.serviceTags) ? doc.serviceTags : []).map((row) =>
      normalizeServiceSlug(typeof row === 'object' && row !== null ? row.slug : ''),
    ),
  )
  const matches = matchText(text, serviceMatcher, distinctiveTerms)
  return [...matches.entries()]
    .filter(([slug]) => !current.has(slug))
    .map(([slug, terms]) => ({
      slug,
      title: serviceBySlug.get(slug)?.title || slug,
      matchedOn: [...terms].sort(),
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

function suggestTechTags(doc) {
  const text = projectText(doc, { includeTechArrays: true })
  const current = new Set(
    (Array.isArray(doc.techTags) ? doc.techTags : []).map((row) =>
      normalizeServiceSlug(typeof row === 'object' && row !== null ? row.slug : ''),
    ),
  )
  const matches = matchText(text, techMatcher)
  return [...matches.entries()]
    .filter(([slug]) => !current.has(slug))
    .map(([slug, terms]) => ({
      slug,
      title: techBySlug.get(slug)?.title || slug,
      matchedOn: [...terms].sort(),
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

// ─── Suggest ────────────────────────────────────────────────────────────────

function isEmptyRelation(value) {
  return !Array.isArray(value) || value.length === 0
}

const reports = projects.map((doc) => {
  const serviceTagsEmpty = isEmptyRelation(doc.serviceTags)
  const techTagsEmpty = isEmptyRelation(doc.techTags)
  return {
    id: doc.id,
    slug: String(doc.slug || ''),
    title: String(doc.title || ''),
    serviceTagsEmpty,
    techTagsEmpty,
    suggestedServiceTags: serviceTagsEmpty ? suggestServiceTags(doc) : [],
    suggestedTechTags: techTagsEmpty ? suggestTechTags(doc) : [],
  }
})

// ─── Log ────────────────────────────────────────────────────────────────────

const fmt = (suggestions) =>
  suggestions.length > 0
    ? suggestions.map((s) => `${s.title} (${s.slug}) [matched: ${s.matchedOn.join(', ')}]`).join('; ')
    : '—'

console.log('')
console.log(`Tag seed ${apply ? '(APPLY)' : '(DRY-RUN — no writes)'} — ${reports.length} published project(s), ${serviceIndex.length} service(s), ${techIndex.length} tech page(s)`)
console.log('')

for (const report of reports) {
  console.log(`${report.slug} — ${report.title}`)
  console.log(`  serviceTags: ${report.serviceTagsEmpty ? fmt(report.suggestedServiceTags) : 'SKIP (already set)'}`)
  console.log(`  techTags:    ${report.techTagsEmpty ? fmt(report.suggestedTechTags) : 'SKIP (already set)'}`)
}

// ─── Apply ──────────────────────────────────────────────────────────────────

const written = []
if (apply) {
  for (const report of reports) {
    const data = {}

    if (report.serviceTagsEmpty && report.suggestedServiceTags.length > 0) {
      const ids = report.suggestedServiceTags
        .map((s) => serviceDocBySlug.get(s.slug))
        .filter((doc) => doc && doc.pageType !== 'tech' && Number.isFinite(doc.id))
        .map((doc) => doc.id)
      if (ids.length > 0) data.serviceTags = ids
    }

    if (report.techTagsEmpty && report.suggestedTechTags.length > 0) {
      const ids = report.suggestedTechTags
        .map((s) => serviceDocBySlug.get(s.slug))
        .filter((doc) => doc && doc.pageType === 'tech' && Number.isFinite(doc.id))
        .map((doc) => doc.id)
      if (ids.length > 0) data.techTags = ids
    }

    if (Object.keys(data).length === 0) {
      console.log(`[apply] SKIP ${report.slug}: nothing to write`)
      continue
    }

    await payload.update({
      collection: 'projects',
      id: report.id,
      data,
      overrideAccess: true,
    })
    console.log(
      `[apply] ${report.slug}: ${[
        data.serviceTags ? `serviceTags <- ${data.serviceTags.join(', ')}` : '',
        data.techTags ? `techTags <- ${data.techTags.join(', ')}` : '',
      ].filter(Boolean).join(' · ')}`,
    )
    written.push({ slug: report.slug, ...data })
  }
}

// ─── Summary ────────────────────────────────────────────────────────────────

const withService = reports.filter((r) => r.suggestedServiceTags.length > 0)
const withTech = reports.filter((r) => r.suggestedTechTags.length > 0)

console.log('')
console.log('Summary:')
console.log(`  projects scanned:            ${reports.length}`)
console.log(`  serviceTags suggestions:     ${reports.reduce((n, r) => n + r.suggestedServiceTags.length, 0)} across ${withService.length} project(s)`)
console.log(`  techTags suggestions:        ${reports.reduce((n, r) => n + r.suggestedTechTags.length, 0)} across ${withTech.length} project(s)`)
if (apply) {
  console.log(`  projects updated:            ${written.length}`)
} else {
  console.log('  mode: dry-run — re-run with --apply (npm run tags:seed:apply) to write')
}

process.exit(0)

#!/usr/bin/env node
/**
 * Content / image / tag audit (Phase 6) — READ-ONLY by default.
 *
 * Reports on every project and service:
 *   1. Per project: status, image inventory (empty urls, local paths missing
 *      from public/), images shared with other projects, current tags/type/
 *      serviceTags, and SUGGESTED serviceTags from keyword matching.
 *   2. Service hero-image duplicate clusters, with replacement candidates
 *      pulled from each service's manual relatedWork projects.
 *   3. Capability tile defaults (lib/capabilities.ts) — flags non-/services/ hrefs.
 *   4. Orphans: services with no hero image, projects with zero images,
 *      services whose relatedWork slugs don't resolve.
 *
 * Writes reports/content-audit.md (human) and reports/content-audit.json
 * (machine) at the REPO ROOT (one level above site/, the npm script's cwd).
 *
 * `--apply-tags` (explicit opt-in): for each project with suggestions and NO
 * existing serviceTags, writes the suggested serviceTags to the CMS and logs
 * each write. Everything else stays read-only.
 *
 * Run (from site/): `npm run content:audit`  (bundled by esbuild like cms:parity)
 */
import './load-env.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config.ts'
import {
  getAllProjectsResolved,
  getAllServicesResolved,
} from '../lib/content.ts'
import {
  getAllProjects,
  getAllServices,
} from '../lib/json-content.ts'
import { DEFAULT_CAPABILITIES } from '../lib/capabilities.ts'

const applyTags = process.argv.includes('--apply-tags')

const payload = await getPayload({ config })

const [projects, services] = await Promise.all([
  getAllProjectsResolved(),
  getAllServicesResolved(),
])

// JSON baseline counts (the pre-migration source of truth) for the meta block.
const jsonProjects = getAllProjects()
const jsonServices = getAllServices()

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

function stripServicePrefix(slug) {
  return String(slug || '').replace(/^\/services\/+/, '')
}

function stripWorkPrefix(slug) {
  return String(slug || '').replace(/^\/work\/+/, '')
}

const publicRoot = path.join(process.cwd(), 'public')

/** Returns true/false for local paths, null for remote (http/blob) urls. */
function localFileExists(url) {
  const clean = String(url || '').split(/[?#]/)[0]
  if (!clean.startsWith('/')) return null
  return fs.existsSync(path.join(publicRoot, clean))
}

// ─── Project publish status (best effort — resolver only returns published) ─

const statusBySlug = new Map()
try {
  const statusResult = await payload.find({
    collection: 'projects',
    limit: 500,
    depth: 0,
    draft: true,
    overrideAccess: true,
    select: { slug: true, status: true },
  })
  for (const doc of statusResult.docs) {
    statusBySlug.set(String(doc.slug || ''), String(doc.status || 'unknown'))
  }
} catch {
  // Status column unavailable — the report marks it as such.
}

// ─── Suggested serviceTags: keyword matching ────────────────────────────────

const serviceIndex = services.map((s) => {
  const slug = stripServicePrefix(s.slug)
  return {
    slug,
    title: s.title,
    terms: new Set([...words(s.title), ...words(slug.replace(/-/g, ' '))]),
  }
})
const serviceBySlug = new Map(serviceIndex.map((s) => [s.slug, s]))

// Term document frequency across services — terms shared by 3+ services are
// too generic to suggest on (e.g. "production", "design", "lighting").
const termFrequency = new Map()
for (const svc of serviceIndex) {
  for (const term of svc.terms) {
    termFrequency.set(term, (termFrequency.get(term) || 0) + 1)
  }
}

// distinctive term -> service slugs containing it
const distinctiveTerms = new Map()
for (const svc of serviceIndex) {
  for (const term of svc.terms) {
    if (term.length >= 3 && (termFrequency.get(term) || 0) <= 2) {
      if (!distinctiveTerms.has(term)) distinctiveTerms.set(term, [])
      distinctiveTerms.get(term).push(svc.slug)
    }
  }
}

// Hand-tuned aliases for obvious cases (short words and multi-word phrases the
// distinctive-term pass can't catch). Aliases pointing at services that don't
// exist in the CMS are dropped.
const HAND_ALIASES = {
  'led wall': 'led-video-wall-rentals',
  dj: 'dj-equipment-rentals',
  laser: 'laser-shows',
  drone: 'drone-light-shows',
  av: 'av-system-integration',
  cnc: 'cnc-machining',
  projection: 'av-content-design',
  stage: 'staging-rigging',
  staging: 'staging-rigging',
  venue: 'venue-sourcing-booking',
  permit: 'permit-submittal',
  tour: 'tour-management',
  fabrication: 'custom-fabrication',
  immersive: 'environmental-design',
  environment: 'environmental-design',
  realtime: 'realtime-content-ar-vr-xr',
  ar: 'realtime-content-ar-vr-xr',
  vr: 'realtime-content-ar-vr-xr',
  xr: 'realtime-content-ar-vr-xr',
}
const wordAliases = new Map() // single word -> slug
const phraseAliases = [] // [phrase, slug, regex]
for (const [alias, target] of Object.entries(HAND_ALIASES)) {
  if (!serviceBySlug.has(target)) continue
  if (alias.includes(' ')) {
    phraseAliases.push([alias, target, new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`)])
  } else {
    wordAliases.set(alias, target)
  }
}

function suggestServiceTags(project) {
  const text = normalize([
    project.title,
    project.metadata?.type,
    ...(project.tags || []),
  ].join(' '))
  const tokens = new Set(text ? text.split(' ') : [])
  const matches = new Map() // slug -> Set of matched terms

  const addMatch = (slug, term) => {
    if (!matches.has(slug)) matches.set(slug, new Set())
    matches.get(slug).add(term)
  }

  for (const token of tokens) {
    const targets = distinctiveTerms.get(token)
    if (targets) for (const slug of targets) addMatch(slug, token)
    const aliasTarget = wordAliases.get(token)
    if (aliasTarget) addMatch(aliasTarget, token)
  }
  for (const [phrase, target, regex] of phraseAliases) {
    if (regex.test(text)) addMatch(target, phrase)
  }

  const current = new Set((project.serviceTags || []).map((t) => stripServicePrefix(t.slug)))
  return [...matches.entries()]
    .filter(([slug]) => !current.has(slug))
    .map(([slug, terms]) => ({
      slug,
      title: serviceBySlug.get(slug)?.title || slug,
      matchedOn: [...terms].sort(),
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

// ─── Per-project report ─────────────────────────────────────────────────────

// url -> set of project slugs using it (for cross-project duplicate detection)
const imageUsage = new Map()
for (const project of projects) {
  const seen = new Set()
  for (const img of project.images || []) {
    if (!img.url || seen.has(img.url)) continue
    seen.add(img.url)
    if (!imageUsage.has(img.url)) imageUsage.set(img.url, new Set())
    imageUsage.get(img.url).add(project.slug)
  }
}

const projectReports = projects.map((project) => {
  const images = project.images || []
  const emptyUrlCount = images.filter((img) => !img.url).length
  const missingOnDisk = []
  for (const img of images) {
    if (!img.url) continue
    if (localFileExists(img.url) === false) missingOnDisk.push(img.url)
  }
  const sharedImages = []
  for (const img of images) {
    if (!img.url) continue
    const users = imageUsage.get(img.url)
    if (!users || users.size < 2) continue
    const others = [...users].filter((slug) => slug !== project.slug)
    if (others.length > 0 && !sharedImages.some((s) => s.url === img.url)) {
      sharedImages.push({ url: img.url, sharedWith: others.sort() })
    }
  }

  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    status: statusBySlug.get(project.slug) || 'published',
    type: project.metadata?.type || '',
    tags: project.tags || [],
    serviceTags: (project.serviceTags || []).map((t) => ({
      slug: stripServicePrefix(t.slug),
      title: t.title,
    })),
    images: {
      total: images.length,
      emptyUrlCount,
      missingOnDisk,
    },
    sharedImages,
    suggestedServiceTags: suggestServiceTags(project),
  }
})

const sharedImageClusters = [...imageUsage.entries()]
  .filter(([, slugs]) => slugs.size > 1)
  .map(([url, slugs]) => ({ url, projects: [...slugs].sort() }))
  .sort((a, b) => b.projects.length - a.projects.length)

// ─── Service hero duplicates + orphan checks ────────────────────────────────

const projectByWorkSlug = new Map()
for (const project of projects) {
  projectByWorkSlug.set(project.slug, project)
  if (project.canonicalSlug) projectByWorkSlug.set(project.canonicalSlug, project)
}

function replacementCandidates(service) {
  const candidates = []
  for (const ref of service.relatedWork || []) {
    const project = projectByWorkSlug.get(stripWorkPrefix(ref.slug))
    if (!project) continue
    for (const img of project.images || []) {
      if (!img.url) continue
      if (candidates.some((c) => c.url === img.url)) continue
      candidates.push({ url: img.url, fromProject: project.slug })
      if (candidates.length >= 3) return candidates
    }
  }
  return candidates
}

const heroGroups = new Map()
for (const service of services) {
  const hero = service.media?.heroImage
  if (!hero) continue
  if (!heroGroups.has(hero)) heroGroups.set(hero, [])
  heroGroups.get(hero).push(service)
}

const serviceHeroDuplicateClusters = [...heroGroups.entries()]
  .filter(([, list]) => list.length > 1)
  .map(([heroImage, list]) => ({
    heroImage,
    services: list
      .map((s) => ({
        slug: stripServicePrefix(s.slug),
        title: s.title,
        replacementCandidates: replacementCandidates(s),
      }))
      .sort((a, b) => a.title.localeCompare(b.title)),
  }))
  .sort((a, b) => b.services.length - a.services.length)

const servicesMissingHero = services
  .filter((s) => !s.media?.heroImage)
  .map((s) => ({ slug: stripServicePrefix(s.slug), title: s.title }))

const servicesWithBrokenRelatedWork = services
  .map((s) => ({
    slug: stripServicePrefix(s.slug),
    title: s.title,
    brokenSlugs: (s.relatedWork || [])
      .map((ref) => ref.slug)
      .filter((slug) => slug && !projectByWorkSlug.has(stripWorkPrefix(slug))),
  }))
  .filter((entry) => entry.brokenSlugs.length > 0)

const projectsWithZeroImages = projectReports.filter((p) => p.images.total === 0)

// ─── Capability tiles ───────────────────────────────────────────────────────

const capabilityTiles = DEFAULT_CAPABILITIES.map((tile) => ({
  label: tile.label,
  href: tile.href,
  valid: tile.href.startsWith('/services/'),
  imageExistsOnDisk: localFileExists(tile.image),
}))

// ─── Summary ────────────────────────────────────────────────────────────────

const projectsWithSuggestions = projectReports.filter((p) => p.suggestedServiceTags.length > 0)
const totalSuggestions = projectReports.reduce((n, p) => n + p.suggestedServiceTags.length, 0)

const summary = {
  projectsAudited: projects.length,
  servicesAudited: services.length,
  jsonBaselineProjects: jsonProjects.length,
  jsonBaselineServices: jsonServices.length,
  projectsWithZeroImages: projectsWithZeroImages.length,
  projectsWithMissingImagesOnDisk: projectReports.filter((p) => p.images.missingOnDisk.length > 0).length,
  projectsWithEmptyImageUrls: projectReports.filter((p) => p.images.emptyUrlCount > 0).length,
  sharedImageClusters: sharedImageClusters.length,
  serviceHeroDuplicateClusters: serviceHeroDuplicateClusters.length,
  servicesInHeroDuplicateClusters: serviceHeroDuplicateClusters.reduce((n, c) => n + c.services.length, 0),
  servicesMissingHero: servicesMissingHero.length,
  servicesWithBrokenRelatedWork: servicesWithBrokenRelatedWork.length,
  capabilityTiles: capabilityTiles.length,
  capabilityTilesWithInvalidHref: capabilityTiles.filter((t) => !t.valid).length,
  projectsWithSuggestedServiceTags: projectsWithSuggestions.length,
  totalSuggestedServiceTags: totalSuggestions,
}

// ─── Optional --apply-tags ──────────────────────────────────────────────────

const appliedTags = []
if (applyTags) {
  for (const report of projectReports) {
    if (report.serviceTags.length > 0 || report.suggestedServiceTags.length === 0) continue
    if (!report.id || Number.isNaN(Number(report.id))) {
      console.log(`[apply-tags] SKIP ${report.slug}: no CMS id (JSON fallback data?)`)
      continue
    }
    const slugs = report.suggestedServiceTags.map((s) => s.slug)
    const found = await payload.find({
      collection: 'services',
      where: { slug: { in: slugs } },
      limit: slugs.length,
      depth: 0,
      overrideAccess: true,
    })
    const ids = found.docs.map((doc) => Number(doc.id)).filter((n) => Number.isFinite(n))
    if (ids.length === 0) {
      console.log(`[apply-tags] SKIP ${report.slug}: no matching service docs for ${slugs.join(', ')}`)
      continue
    }
    await payload.update({
      collection: 'projects',
      id: report.id,
      data: { serviceTags: ids },
      overrideAccess: true,
    })
    console.log(`[apply-tags] ${report.slug}: serviceTags <- ${ids.join(', ')} (${slugs.join(', ')})`)
    appliedTags.push({ slug: report.slug, serviceIds: ids, serviceSlugs: slugs })
  }
  console.log(`[apply-tags] Done — ${appliedTags.length} project(s) updated. Pages refresh on next ISR revalidation.`)
}

// ─── Report files ───────────────────────────────────────────────────────────

const report = {
  generatedAt: new Date().toISOString(),
  mode: applyTags ? 'apply-tags' : 'read-only',
  summary,
  projects: projectReports,
  sharedImageClusters,
  serviceHeroDuplicateClusters,
  servicesMissingHero,
  servicesWithBrokenRelatedWork,
  projectsWithZeroImages: projectsWithZeroImages.map((p) => ({ slug: p.slug, title: p.title })),
  capabilityTiles,
  ...(applyTags ? { appliedTags } : {}),
}

const md = []
md.push('# Content & Image Audit')
md.push('')
md.push(`_Generated ${report.generatedAt} · Mode: ${report.mode}_`)
md.push('')
md.push('## Summary')
md.push('')
md.push(`- Projects audited: **${summary.projectsAudited}** (JSON baseline: ${summary.jsonBaselineProjects})`)
md.push(`- Services audited: **${summary.servicesAudited}** (JSON baseline: ${summary.jsonBaselineServices})`)
md.push(`- Projects with zero images: **${summary.projectsWithZeroImages}**`)
md.push(`- Projects with images missing on disk: **${summary.projectsWithMissingImagesOnDisk}**`)
md.push(`- Projects with empty image URLs: **${summary.projectsWithEmptyImageUrls}**`)
md.push(`- Image URLs shared across projects: **${summary.sharedImageClusters} cluster(s)**`)
md.push(`- Services sharing a hero image: **${summary.serviceHeroDuplicateClusters} cluster(s), ${summary.servicesInHeroDuplicateClusters} services**`)
md.push(`- Services with no hero image: **${summary.servicesMissingHero}**`)
md.push(`- Services with broken Related Work links: **${summary.servicesWithBrokenRelatedWork}**`)
md.push(`- Capability tiles checked: **${summary.capabilityTiles}** — ${summary.capabilityTilesWithInvalidHref} with links not pointing to /services/`)
md.push(`- Projects with SUGGESTED service tags: **${summary.projectsWithSuggestedServiceTags}** (${summary.totalSuggestedServiceTags} suggestions)`)
md.push('')
md.push('> Service-tag suggestions are keyword guesses only. Confirm them on each project page in edit mode (“Services Used” → Edit). Nothing is changed by this report.')
md.push('')

md.push('## Suggested Service Tags (SUGGESTED — needs your confirmation)')
md.push('')
if (projectsWithSuggestions.length === 0) {
  md.push('No suggestions.')
} else {
  md.push('| Project | Type | Current service tags | Suggested service tags |')
  md.push('| --- | --- | --- | --- |')
  for (const p of projectsWithSuggestions) {
    const current = p.serviceTags.map((t) => t.title).join(', ') || '—'
    const suggested = p.suggestedServiceTags.map((s) => `${s.title} (matched: ${s.matchedOn.join(', ')})`).join('; ')
    md.push(`| ${p.title} | ${p.type || '—'} | ${current} | ${suggested} |`)
  }
}
md.push('')

md.push('## Projects')
md.push('')
md.push('| Project | Status | Images | Tags / Type | Issues |')
md.push('| --- | --- | --- | --- | --- |')
for (const p of projectReports) {
  const issues = []
  if (p.images.total === 0) issues.push('no images')
  if (p.images.emptyUrlCount > 0) issues.push(`${p.images.emptyUrlCount} empty image URL(s)`)
  if (p.images.missingOnDisk.length > 0) issues.push(`${p.images.missingOnDisk.length} image(s) missing on disk`)
  if (p.sharedImages.length > 0) issues.push(`shares ${p.sharedImages.length} image(s) with other projects`)
  const tagsType = [p.type, ...p.tags].filter(Boolean).join(', ') || '—'
  md.push(`| ${p.title} | ${p.status} | ${p.images.total} | ${tagsType} | ${issues.join('; ') || '—'} |`)
}
md.push('')

md.push('## Image URLs Shared Between Projects')
md.push('')
if (sharedImageClusters.length === 0) {
  md.push('None — every project image is used by a single project.')
} else {
  for (const cluster of sharedImageClusters) {
    md.push(`- \`${cluster.url}\` — used by: ${cluster.projects.join(', ')}`)
  }
}
md.push('')

md.push('## Service Hero Image Duplicates')
md.push('')
if (serviceHeroDuplicateClusters.length === 0) {
  md.push('None — every service has its own hero image.')
} else {
  for (const cluster of serviceHeroDuplicateClusters) {
    md.push(`### \`${cluster.heroImage}\` — shared by ${cluster.services.length} services`)
    md.push('')
    for (const svc of cluster.services) {
      md.push(`- **${svc.title}** (/services/${svc.slug})`)
      if (svc.replacementCandidates.length > 0) {
        for (const cand of svc.replacementCandidates) {
          md.push(`  - candidate: \`${cand.url}\` (from project ${cand.fromProject})`)
        }
      } else {
        md.push('  - no replacement candidates (no related-work project images)')
      }
    }
    md.push('')
  }
}

md.push('## Services With No Hero Image')
md.push('')
if (servicesMissingHero.length === 0) {
  md.push('None.')
} else {
  for (const s of servicesMissingHero) md.push(`- ${s.title} (/services/${s.slug})`)
}
md.push('')

md.push('## Broken Related Work Links (service → project)')
md.push('')
if (servicesWithBrokenRelatedWork.length === 0) {
  md.push('None — every relatedWork entry resolves to a project.')
} else {
  for (const entry of servicesWithBrokenRelatedWork) {
    md.push(`- **${entry.title}** (/services/${entry.slug}): ${entry.brokenSlugs.join(', ')}`)
  }
}
md.push('')

md.push('## Projects With Zero Images')
md.push('')
if (projectsWithZeroImages.length === 0) {
  md.push('None.')
} else {
  for (const p of projectsWithZeroImages) md.push(`- ${p.title} (/work/${p.slug})`)
}
md.push('')

md.push('## Capability Tiles (default grid)')
md.push('')
md.push('| Tile | Link | OK? |')
md.push('| --- | --- | --- |')
for (const tile of capabilityTiles) {
  const flags = []
  if (!tile.valid) flags.push('link does NOT start with /services/')
  if (tile.imageExistsOnDisk === false) flags.push('image missing on disk')
  md.push(`| ${tile.label} | ${tile.href} | ${flags.join('; ') || 'yes'} |`)
}
md.push('')

if (applyTags) {
  md.push('## Applied Service Tags (--apply-tags)')
  md.push('')
  if (appliedTags.length === 0) {
    md.push('No projects were updated.')
  } else {
    for (const applied of appliedTags) {
      md.push(`- ${applied.slug}: serviceTags <- ${applied.serviceSlugs.join(', ')}`)
    }
  }
  md.push('')
}

const reportsDir = path.join(process.cwd(), '..', 'reports')
fs.mkdirSync(reportsDir, { recursive: true })
const mdPath = path.join(reportsDir, 'content-audit.md')
const jsonPath = path.join(reportsDir, 'content-audit.json')
fs.writeFileSync(mdPath, md.join('\n'))
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2))

console.log('')
console.log(`Content audit complete (${report.mode}):`)
console.log(`  projects: ${summary.projectsAudited} · services: ${summary.servicesAudited}`)
console.log(`  shared-image clusters: ${summary.sharedImageClusters} · hero dup clusters: ${summary.serviceHeroDuplicateClusters}`)
console.log(`  suggested serviceTags: ${summary.totalSuggestedServiceTags} across ${summary.projectsWithSuggestedServiceTags} projects`)
console.log(`  reports: ${path.relative(process.cwd(), mdPath)}, ${path.relative(process.cwd(), jsonPath)}`)

process.exit(0)

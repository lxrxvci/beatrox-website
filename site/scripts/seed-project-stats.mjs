#!/usr/bin/env node
/**
 * Project stats seeder — DRY-RUN by default; `--apply` writes.
 *
 * Fills the optional `stats` array (impact strip below the hero) for every
 * published project that has none. Values are DRAFTS derived from each
 * project's own content (titles, subheadlines, metadata, vision-pass notes)
 * — review the dry-run output and refine in the CMS after applying.
 *
 * Idempotent: projects with existing stats are skipped.
 * Run (from site/): bundle with esbuild like tags:images.
 */
import './load-env.mjs'
import { getPayload } from 'payload'
import config from '../payload.config.ts'

const apply = process.argv.includes('--apply')

const STATS = {
  'aku-world': [
    { value: 'NFT', label: 'Metaverse city premiere' },
    { value: 'MIA', label: 'Miami experiential event' },
    { value: '360°', label: 'Projection-mapped room' },
  ],
  buzzfeed: [
    { value: '2016', label: 'BuzzFeed NewFronts' },
    { value: 'LIVE', label: 'Stage + interactive orbs' },
  ],
  'cnn-road-to-270': [
    { value: '270', label: 'Electoral votes to win' },
    { value: 'ESB', label: 'Empire State Building facade' },
    { value: 'NYC', label: 'Election-night projection' },
  ],
  'create-our-future': [
    { value: 'UO×ADI', label: 'Urban Outfitters × Adidas' },
    { value: 'CYC', label: 'Full-stage projection wall' },
  ],
  destination: [
    { value: 'SD', label: 'Destination: San Diego' },
    { value: 'MURAL', label: 'Interactive painted controller' },
  ],
  disenchantment: [
    { value: 'SDCC', label: 'San Diego Comic-Con' },
    { value: '100%', label: 'Custom-fabricated booth' },
  ],
  'dubai-360-spherical-projection-theatre': [
    { value: '360°', label: 'Spherical projection theatre' },
    { value: 'MALL', label: 'The Dubai Mall venue' },
  ],
  'el-camino': [
    { value: 'NFLX', label: 'El Camino premiere activation' },
    { value: 'SDCC', label: 'Comic-Con brand garage' },
  ],
  flir: [
    { value: '1978', label: 'FLIR history on the wall' },
    { value: 'LIDAR', label: 'Body-triggered timeline' },
  ],
  'g-man-experiential-campaign': [
    { value: 'C-HR', label: 'Toyota reveal campaign' },
    { value: 'TUNNEL', label: 'Immersive light environment' },
  ],
  'infinite-playlist': [
    { value: '2', label: 'Festival activations' },
    { value: 'LIVE', label: 'Amazon Music Live' },
    { value: 'AR', label: 'Kinect interactive moments' },
  ],
  myshelter: [
    { value: 'NYC', label: 'Bodega takeover' },
    { value: 'FOG', label: 'Low-lying forest atmosphere' },
    { value: 'LED', label: 'Addressable tube canopy' },
  ],
  'projecting-change-racing-extinction': [
    { value: '2', label: 'Global landmark projections' },
    { value: 'ESB', label: 'Empire State Building' },
    { value: 'RACE', label: 'Racing Extinction film' },
  ],
  'projekt-x': [
    { value: 'X', label: 'Custom stage element' },
    { value: 'DMX', label: 'Pixel-mapped LED wings' },
    { value: 'TOUR', label: 'Built for global touring' },
  ],
  'run-for-the-oceans': [
    { value: 'LED', label: 'Infinity tunnel build' },
    { value: 'LIDAR', label: 'Interactive ocean content' },
    { value: 'BK', label: 'Domino Park, Brooklyn' },
  ],
  'super-bowl-2020': [
    { value: 'LIV', label: 'Super Bowl 2020' },
    { value: 'MIA', label: 'Miami activation week' },
  ],
  'the-great-escape': [
    { value: '3', label: 'Themed escape vaults' },
    { value: 'LA', label: 'Outdoor retail venue' },
  ],
}

const payload = await getPayload({ config })

const projects = await payload.find({
  collection: 'projects',
  where: { status: { equals: 'published' } },
  limit: 100,
  depth: 0,
  overrideAccess: true,
})

console.log(`\nProject stats seed ${apply ? '(APPLY)' : '(DRY-RUN — no writes)'}\n`)

for (const doc of projects.docs) {
  const slug = String(doc.slug || '').replace(/^\/work\/+/, '')
  const draft = STATS[slug]
  if (!draft) {
    console.log(`SKIP ${slug}: no draft stats defined`)
    continue
  }
  const existing = Array.isArray(doc.stats) ? doc.stats.filter((r) => r && r.value && r.label) : []
  if (existing.length > 0) {
    console.log(`SKIP ${slug}: stats already set (${existing.length})`)
    continue
  }
  console.log(`${apply ? '[apply]' : '[plan]'} ${slug}: ${draft.map((s) => `${s.value} (${s.label})`).join(' · ')}`)
  if (apply) {
    await payload.update({
      collection: 'projects',
      id: doc.id,
      data: { stats: draft },
      overrideAccess: true,
    })
  }
}

console.log('')
process.exit(0)

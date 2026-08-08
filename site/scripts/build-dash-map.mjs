#!/usr/bin/env node
/**
 * One-off generator for dash-purge-map.json.
 *
 * Rebuilds every content JSON file as it stood BEFORE the dash-law cleanup
 * (commit c6a9220^) and AFTER it (c6a9220), walks both trees in parallel, and
 * records every leaf string that contained U+2014/U+2015 before and its exact
 * cleaned replacement after. The purge script uses this map for
 * byte-exact replacements on CMS docs that were imported from the pre-cleanup
 * JSON.
 *
 * Run (from site/): `node scripts/build-dash-map.mjs`
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const BEFORE_REF = 'c6a9220^'
const AFTER_REF = 'c6a9220'
const OUT_FILE = path.resolve('scripts/dash-purge-map.json')
const ROOTS = ['content', 'site/content']

function listJsonFiles(ref) {
  const out = []
  for (const root of ROOTS) {
    try {
      const listing = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, root], { encoding: 'utf8' })
      for (const line of listing.split('\n')) {
        const p = line.trim()
        if (p.endsWith('.json')) out.push(p)
      }
    } catch {
      // root absent at this ref, fine
    }
  }
  return out.sort()
}

function showFile(ref, filePath) {
  try {
    return execFileSync('git', ['show', `${ref}:${filePath}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  } catch {
    return null
  }
}

const DASH_RE = /[—―]/

function walkPairs(before, after, filePath, keyPath, map, conflicts) {
  if (typeof before === 'string' && typeof after === 'string') {
    if (before !== after && DASH_RE.test(before) && !DASH_RE.test(after)) {
      if (map.has(before) && map.get(before) !== after) {
        conflicts.push({ filePath, keyPath, before, existing: map.get(before), next: after })
        return
      }
      map.set(before, after)
    }
    return
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const n = Math.min(before.length, after.length)
    for (let i = 0; i < n; i++) walkPairs(before[i], after[i], filePath, `${keyPath}[${i}]`, map, conflicts)
    return
  }
  if (before && after && typeof before === 'object' && typeof after === 'object') {
    for (const key of Object.keys(before)) {
      if (key in after) walkPairs(before[key], after[key], filePath, keyPath ? `${keyPath}.${key}` : key, map, conflicts)
    }
  }
}

const map = new Map()
const conflicts = []
let filesCompared = 0

for (const filePath of listJsonFiles(AFTER_REF)) {
  const beforeRaw = showFile(BEFORE_REF, filePath)
  const afterRaw = showFile(AFTER_REF, filePath)
  if (!beforeRaw || !afterRaw) continue
  try {
    walkPairs(JSON.parse(beforeRaw), JSON.parse(afterRaw), filePath, '', map, conflicts)
    filesCompared++
  } catch (err) {
    console.error(`Skipping ${filePath}: ${err.message}`)
  }
}

const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
const payload = {
  generatedAt: new Date().toISOString(),
  source: `git diff ${BEFORE_REF}..${AFTER_REF} over ${ROOTS.join(', ')}`,
  filesCompared,
  conflictCount: conflicts.length,
  replacements: Object.fromEntries(entries),
}
fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n')
console.log(`Wrote ${OUT_FILE}`)
console.log(`Files compared: ${filesCompared}`)
console.log(`Exact old->new string pairs: ${entries.length}`)
console.log(`Conflicts (same old, different new): ${conflicts.length}`)
for (const c of conflicts.slice(0, 10)) {
  console.log(`  CONFLICT ${c.filePath} ${c.keyPath}\n    old: ${c.before.slice(0, 120)}`)
}

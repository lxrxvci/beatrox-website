import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const manifestPath = path.join(ROOT, 'manifest-assets.txt')
const outDir = path.join(ROOT, 'site', 'public', 'images', 'portfolio')
const reportDir = path.join(ROOT, 'site', 'reports')
const reportPath = path.join(reportDir, 'media-sync-report.json')
const force = process.argv.includes('--force')

if (!fs.existsSync(manifestPath)) {
  console.error(`Manifest not found: ${manifestPath}`)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })
fs.mkdirSync(reportDir, { recursive: true })

const raw = fs.readFileSync(manifestPath, 'utf-8')
const lines = raw.split(/\r?\n/).map(line => line.trim())
const entries = lines
  .filter(line => line && !line.startsWith('#'))
  .map(line => line.split(/\s+/, 2))
  .filter(parts => parts.length === 2)
  .map(([assetPath, url]) => {
    const normalized = assetPath.replace(/\\/g, '/')
    const relativePortfolioPath = normalized.replace(/^assets\/portfolio\//, '')
    return {
      sourcePath: normalized,
      targetPath: path.join(outDir, relativePortfolioPath),
      url,
    }
  })

const report = {
  timestamp: new Date().toISOString(),
  force,
  totals: { entries: entries.length, downloaded: 0, skipped: 0, failed: 0 },
  downloaded: [],
  skipped: [],
  failed: [],
}

for (const entry of entries) {
  fs.mkdirSync(path.dirname(entry.targetPath), { recursive: true })

  if (!force && fs.existsSync(entry.targetPath)) {
    report.totals.skipped += 1
    report.skipped.push({
      targetPath: path.relative(ROOT, entry.targetPath).replace(/\\/g, '/'),
      reason: 'already_exists',
    })
    continue
  }

  try {
    const res = await fetch(entry.url)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(entry.targetPath, buffer)
    report.totals.downloaded += 1
    report.downloaded.push({
      url: entry.url,
      targetPath: path.relative(ROOT, entry.targetPath).replace(/\\/g, '/'),
      bytes: buffer.length,
    })
    console.log(`Downloaded: ${entry.url}`)
  } catch (error) {
    report.totals.failed += 1
    report.failed.push({
      url: entry.url,
      targetPath: path.relative(ROOT, entry.targetPath).replace(/\\/g, '/'),
      error: String(error instanceof Error ? error.message : error),
    })
    console.warn(`Failed: ${entry.url}`)
  }
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf-8')

console.log(`\nSync complete.`)
console.log(`Downloaded: ${report.totals.downloaded}`)
console.log(`Skipped: ${report.totals.skipped}`)
console.log(`Failed: ${report.totals.failed}`)
console.log(`Report: ${path.relative(ROOT, reportPath).replace(/\\/g, '/')}`)

import fs from 'fs'
import path from 'path'

const CONTENT_ROOT = path.join(process.cwd(), '..', 'content')
const YOUTUBE_OVERRIDES = path.join(CONTENT_ROOT, 'youtube', 'overrides.json')
const REPORT_PATH = path.join(process.cwd(), 'reports', 'seo-audit-report.md')

const YT_LIMITS = {
  title: 100,
  description: 5000,
}

function listJsonFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listJsonFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath)
    }
  }
  return files
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

function relative(filePath) {
  return path.relative(path.join(process.cwd(), '..'), filePath).replace(/\\/g, '/')
}

function run() {
  const seoIssues = []
  const limitIssues = []
  const seoFiles = listJsonFiles(CONTENT_ROOT).filter((filePath) => !filePath.includes(`${path.sep}youtube${path.sep}`))

  for (const filePath of seoFiles) {
    const data = readJson(filePath, null)
    if (!data || typeof data !== 'object') continue
    if (!('seo' in data)) continue

    const title = data?.seo?.title
    const description = data?.seo?.description
    const ogImage = data?.seo?.og?.image

    if (!title || !String(title).trim()) seoIssues.push(`${relative(filePath)}: missing seo.title`)
    if (!description || !String(description).trim()) seoIssues.push(`${relative(filePath)}: missing seo.description`)
    if (!ogImage || !String(ogImage).trim()) seoIssues.push(`${relative(filePath)}: missing seo.og.image`)
  }

  const overrides = readJson(YOUTUBE_OVERRIDES, { overrides: {} })
  for (const [videoId, override] of Object.entries(overrides.overrides || {})) {
    if (override?.title && override.title.length > YT_LIMITS.title) {
      limitIssues.push(`${videoId}: title too long (${override.title.length}/${YT_LIMITS.title})`)
    }
    if (override?.description && override.description.length > YT_LIMITS.description) {
      limitIssues.push(`${videoId}: description too long (${override.description.length}/${YT_LIMITS.description})`)
    }
  }

  const report = []
  report.push('# SEO Audit Report')
  report.push('')
  report.push(`Generated: ${new Date().toISOString()}`)
  report.push('')
  report.push(`- Files with \`seo\` checked: ${seoFiles.length}`)
  report.push(`- SEO field issues: ${seoIssues.length}`)
  report.push(`- YouTube override length issues: ${limitIssues.length}`)
  report.push('')
  report.push('## SEO Field Issues')
  report.push('')
  if (!seoIssues.length) {
    report.push('- None')
  } else {
    for (const issue of seoIssues) report.push(`- ${issue}`)
  }
  report.push('')
  report.push('## YouTube Override Limit Issues')
  report.push('')
  if (!limitIssues.length) {
    report.push('- None')
  } else {
    for (const issue of limitIssues) report.push(`- ${issue}`)
  }
  report.push('')

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true })
  fs.writeFileSync(REPORT_PATH, report.join('\n'), 'utf-8')
  console.log(`Report written: ${path.relative(process.cwd(), REPORT_PATH).replace(/\\/g, '/')}`)
}

run()

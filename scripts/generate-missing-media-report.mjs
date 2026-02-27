import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const PORTFOLIO_DIR = path.join(ROOT, 'content', 'portfolio')
const SITE_PUBLIC_DIR = path.join(ROOT, 'site', 'public')
const REPORT_DIR = path.join(ROOT, 'site', 'reports')
const REPORT_PATH = path.join(REPORT_DIR, 'missing-media-report.md')
const VIDEO_MANIFEST_PATH = path.join(ROOT, 'video-manifest.txt')

fs.mkdirSync(REPORT_DIR, { recursive: true })

const portfolioFiles = fs
  .readdirSync(PORTFOLIO_DIR)
  .filter(file => file.endsWith('.json'))
  .sort()

const missingImages = []
const unresolvedImageUrls = []
const missingOgImages = []
const discoveredVideos = []

function existsInPublic(localWebPath) {
  const normalized = localWebPath.replace(/^\/+/, '')
  return fs.existsSync(path.join(SITE_PUBLIC_DIR, normalized))
}

for (const file of portfolioFiles) {
  const slug = file.replace('.json', '')
  const projectPath = path.join(PORTFOLIO_DIR, file)
  const project = JSON.parse(fs.readFileSync(projectPath, 'utf-8'))

  if (project?.seo?.og?.image?.startsWith('/')) {
    if (!existsInPublic(project.seo.og.image)) {
      missingOgImages.push({
        slug,
        ogImage: project.seo.og.image,
      })
    }
  }

  const images = Array.isArray(project.images) ? project.images : []
  images.forEach((img, idx) => {
    const url = (img?.url ?? '').trim()
    if (!url) {
      missingImages.push({
        slug,
        index: idx,
        filename: img?.filename || '',
        alt: img?.alt || '',
        note: img?.note || '',
      })
      return
    }

    if (url.startsWith('/')) {
      if (!existsInPublic(url)) {
        missingImages.push({
          slug,
          index: idx,
          filename: img?.filename || path.basename(url),
          alt: img?.alt || '',
          note: `local_path_missing:${url}`,
        })
      }
      return
    }

    if (url.includes('images.squarespace-cdn.com')) {
      unresolvedImageUrls.push({
        slug,
        index: idx,
        filename: img?.filename || '',
        url,
      })
    }
  })
}

if (fs.existsSync(VIDEO_MANIFEST_PATH)) {
  const videoManifestLines = fs
    .readFileSync(VIDEO_MANIFEST_PATH, 'utf-8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  for (const line of videoManifestLines) {
    const splitIdx = line.indexOf(':')
    if (splitIdx > -1) {
      const label = line.slice(0, splitIdx).trim()
      const value = line.slice(splitIdx + 1).trim()
      if (value.startsWith('http')) {
        discoveredVideos.push({ label, url: value })
      }
    }
  }
}

const lines = []
lines.push('# Missing Media Report')
lines.push('')
lines.push(`Generated: ${new Date().toISOString()}`)
lines.push('')
lines.push('## Summary')
lines.push('')
lines.push(`- Portfolio files analyzed: ${portfolioFiles.length}`)
lines.push(`- Missing image slots (empty or unresolved local path): ${missingImages.length}`)
lines.push(`- Squarespace CDN image URLs still not localized: ${unresolvedImageUrls.length}`)
lines.push(`- Missing OG image files in public: ${missingOgImages.length}`)
lines.push(`- Video URLs discovered: ${discoveredVideos.length}`)
lines.push('')

lines.push('## Missing OG Images')
lines.push('')
if (missingOgImages.length === 0) {
  lines.push('- None')
} else {
  for (const item of missingOgImages) {
    lines.push(`- \`${item.slug}\` -> \`${item.ogImage}\``)
  }
}
lines.push('')

lines.push('## Missing Project Images')
lines.push('')
if (missingImages.length === 0) {
  lines.push('- None')
} else {
  for (const item of missingImages) {
    const details = [
      `index=${item.index}`,
      item.filename ? `filename=${item.filename}` : null,
      item.note ? `note=${item.note}` : null,
    ]
      .filter(Boolean)
      .join(', ')
    lines.push(`- \`${item.slug}\`: ${details}`)
  }
}
lines.push('')

lines.push('## CDN URLs Not Yet Localized')
lines.push('')
if (unresolvedImageUrls.length === 0) {
  lines.push('- None')
} else {
  for (const item of unresolvedImageUrls) {
    lines.push(`- \`${item.slug}\` [${item.index}] ${item.url}`)
  }
}
lines.push('')

lines.push('## Video URL Inventory')
lines.push('')
if (discoveredVideos.length === 0) {
  lines.push('- None')
} else {
  for (const video of discoveredVideos) {
    lines.push(`- ${video.label}: ${video.url}`)
  }
}
lines.push('')

fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf-8')
console.log(`Report written: ${path.relative(ROOT, REPORT_PATH).replace(/\\/g, '/')}`)

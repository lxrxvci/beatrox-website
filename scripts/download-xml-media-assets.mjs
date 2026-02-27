import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const ROOT = process.cwd()
const mapPath = path.join(ROOT, 'site', 'reports', 'xml-media-map.json')
const outRoot = path.join(ROOT, 'site', 'public', 'images', 'verified')
const reportPath = path.join(ROOT, 'site', 'reports', 'xml-media-download-report.json')
const force = process.argv.includes('--force')

if (!fs.existsSync(mapPath)) {
  console.error(`Missing media map: ${mapPath}`)
  process.exit(1)
}

const mediaMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'))
const urlRecords = []

function pushUrls(urls, bucket) {
  for (const url of urls) {
    if (!url || typeof url !== 'string') continue
    urlRecords.push({ url, bucket })
  }
}

pushUrls(mediaMap.routes.home.images, 'home')
pushUrls(mediaMap.routes.about.images, 'about')
pushUrls(mediaMap.routes.team.images, 'team')
pushUrls(mediaMap.routes.services.images, 'services')
pushUrls(mediaMap.routes.work?.images ?? [], 'work')

for (const [slug, detail] of Object.entries(mediaMap.routes.services.details ?? {})) {
  pushUrls(detail.images ?? [], `services/${slug}`)
}
for (const [slug, detail] of Object.entries(mediaMap.routes.work?.details ?? {})) {
  pushUrls(detail.images ?? [], `work/${slug}`)
  pushUrls(detail.backgrounds ?? [], `work/${slug}`)
}

const uniqueByUrl = new Map()
for (const record of urlRecords) {
  if (!uniqueByUrl.has(record.url)) uniqueByUrl.set(record.url, record)
}

const records = [...uniqueByUrl.values()]
const report = {
  generatedAt: new Date().toISOString(),
  totals: { urls: records.length, downloaded: 0, skipped: 0, failed: 0 },
  urlToLocalPath: {},
  downloaded: [],
  skipped: [],
  failed: [],
}

for (const { url, bucket } of records) {
  let urlObj
  try {
    urlObj = new URL(url)
  } catch {
    report.totals.failed += 1
    report.failed.push({ url, bucket, error: 'invalid_url' })
    continue
  }

  const baseNameRaw = decodeURIComponent(path.basename(urlObj.pathname))
  const safeBaseName = baseNameRaw.replace(/[^\w.\-+ ]/g, '_')
  const ext = path.extname(safeBaseName) || '.jpg'
  const stem = path.basename(safeBaseName, ext) || 'asset'
  const digest = crypto.createHash('sha1').update(url).digest('hex').slice(0, 8)
  const fileName = `${stem}-${digest}${ext}`
  const outPath = path.join(outRoot, bucket, fileName)

  fs.mkdirSync(path.dirname(outPath), { recursive: true })

  if (!force && fs.existsSync(outPath)) {
    report.totals.skipped += 1
    report.urlToLocalPath[url] = `/images/verified/${bucket}/${fileName}`.replace(/\\/g, '/')
    report.skipped.push({ url, outPath: path.relative(ROOT, outPath).replace(/\\/g, '/') })
    continue
  }

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP_${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(outPath, bytes)
    report.totals.downloaded += 1
    report.urlToLocalPath[url] = `/images/verified/${bucket}/${fileName}`.replace(/\\/g, '/')
    report.downloaded.push({
      url,
      outPath: path.relative(ROOT, outPath).replace(/\\/g, '/'),
      bytes: bytes.length,
    })
    console.log(`Downloaded: ${url}`)
  } catch (error) {
    report.totals.failed += 1
    report.failed.push({
      url,
      bucket,
      error: String(error instanceof Error ? error.message : error),
    })
    console.warn(`Failed: ${url}`)
  }
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf-8')
console.log(`Report: ${path.relative(ROOT, reportPath).replace(/\\/g, '/')}`)
console.log(`Downloaded ${report.totals.downloaded}, skipped ${report.totals.skipped}, failed ${report.totals.failed}`)

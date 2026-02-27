import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const mapPath = path.join(ROOT, 'site', 'reports', 'xml-media-map.json')
const downloadReportPath = path.join(ROOT, 'site', 'reports', 'xml-media-download-report.json')
const tracePath = path.join(ROOT, 'site', 'reports', 'xml-media-traceability.json')

if (!fs.existsSync(mapPath) || !fs.existsSync(downloadReportPath)) {
  console.error('Required reports are missing. Run extract and download scripts first.')
  process.exit(1)
}

const mediaMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'))
const downloadReport = JSON.parse(fs.readFileSync(downloadReportPath, 'utf-8'))
const urlToLocalPath = downloadReport.urlToLocalPath ?? {}

const trace = {
  generatedAt: new Date().toISOString(),
  filesUpdated: [],
  unresolved: [],
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  trace.filesUpdated.push(path.relative(ROOT, filePath).replace(/\\/g, '/'))
}

function localize(url) {
  const local = urlToLocalPath[url]
  if (!local) {
    trace.unresolved.push(url)
    return null
  }
  return local
}

const homepagePath = path.join(ROOT, 'content', 'homepage.json')
const aboutPath = path.join(ROOT, 'content', 'about.json')
const teamPath = path.join(ROOT, 'content', 'team.json')
const servicesDir = path.join(ROOT, 'content', 'services')
const portfolioDir = path.join(ROOT, 'content', 'portfolio')

const homepage = readJson(homepagePath)
const about = readJson(aboutPath)
const team = readJson(teamPath)

const homeBackgrounds = mediaMap.routes.home.backgrounds ?? []
const homeImages = mediaMap.routes.home.images ?? []
const aboutBackgrounds = mediaMap.routes.about.backgrounds ?? []
const aboutImages = mediaMap.routes.about.images ?? []
const teamBackgrounds = mediaMap.routes.team.backgrounds ?? []

homepage.media = {
  ...(homepage.media || {}),
  heroImage: localize(homeBackgrounds[0]) || homepage.media?.heroImage || '/og-default.jpg',
  galleryImages: homeImages.slice(0, 6).map((url) => localize(url)).filter(Boolean),
}

about.media = {
  heroImage: localize(aboutBackgrounds[0]) || '/og-default.jpg',
  sectionImages: aboutImages.slice(0, 6).map((url) => localize(url)).filter(Boolean),
}

team.media = {
  heroImage: localize(teamBackgrounds[0]) || '/og-default.jpg',
}

const teamByName = new Map((mediaMap.routes.team.members ?? []).map((m) => [m.name.toLowerCase(), m]))
team.members = team.members.map((member) => {
  const match = teamByName.get(member.name.toLowerCase())
  if (!match) return member
  const localPhoto = localize(match.imageUrl)
  if (!localPhoto) return member
  return {
    ...member,
    photo: {
      url: localPhoto,
      alt: match.heading || member.name,
    },
  }
})

writeJson(homepagePath, homepage)
writeJson(aboutPath, about)
writeJson(teamPath, team)

const serviceFiles = fs.readdirSync(servicesDir).filter((f) => f.endsWith('.json'))
for (const file of serviceFiles) {
  const jsonPath = path.join(servicesDir, file)
  const slug = file.replace('.json', '')
  const data = readJson(jsonPath)
  const detail = mediaMap.routes.services.details?.[slug]

  let heroImage = null
  let gallery = []

  if (detail) {
    const detailBg = (detail.backgrounds ?? [])[0]
    heroImage = localize(detailBg) || localize((detail.images ?? [])[0])
    gallery = (detail.images ?? []).map((url) => localize(url)).filter(Boolean)
  } else {
    heroImage = localize((mediaMap.routes.services.backgrounds ?? [])[0])
    gallery = (mediaMap.routes.services.images ?? []).map((url) => localize(url)).filter(Boolean).slice(0, 4)
  }

  data.media = {
    heroImage: heroImage || '/og-default.jpg',
    galleryImages: gallery.filter((img) => img && img !== heroImage).slice(0, 8),
  }
  writeJson(jsonPath, data)
}

const portfolioFiles = fs.readdirSync(portfolioDir).filter((f) => f.endsWith('.json')).sort()
const workDetails = mediaMap.routes.work?.details ?? {}
const fallbackPreviewUrls = [
  ...(mediaMap.routes.work?.backgrounds ?? []),
  ...(mediaMap.routes.work?.images ?? []),
  ...homeImages,
].filter(Boolean)
const usedPreviewPaths = new Set()

for (const file of portfolioFiles) {
  const jsonPath = path.join(portfolioDir, file)
  const slug = file.replace('.json', '')
  const data = readJson(jsonPath)
  const detail = workDetails[slug]

  const candidateUrls = [
    ...(detail?.backgrounds ?? []),
    ...(detail?.images ?? []),
    ...fallbackPreviewUrls,
  ]

  let selectedPreview = null
  for (const url of candidateUrls) {
    const local = localize(url)
    if (!local) continue
    if (usedPreviewPaths.has(local)) continue
    selectedPreview = local
    break
  }

  const firstImage = (data.images ?? []).find((img) => img?.url)
  if (firstImage?.url) usedPreviewPaths.add(firstImage.url)

  const isOgDefault = data.seo?.og?.image === '/og-default.jpg'
  const hasPreviewImage = Boolean(firstImage?.url && firstImage.url !== '/og-default.jpg')
  const shouldBackfillPreview = !hasPreviewImage || isOgDefault

  if (shouldBackfillPreview && selectedPreview) {
    if (!Array.isArray(data.images)) data.images = []
    if (!hasPreviewImage) {
      data.images.unshift({
        url: selectedPreview,
        alt: `${data.title} preview image`,
      })
    }
    if (isOgDefault) {
      data.seo.og.image = selectedPreview
    }
    usedPreviewPaths.add(selectedPreview)
    writeJson(jsonPath, data)
  }
}

fs.writeFileSync(tracePath, JSON.stringify(trace, null, 2) + '\n', 'utf-8')
console.log(`Updated files: ${trace.filesUpdated.length}`)
console.log(`Trace report: ${path.relative(ROOT, tracePath).replace(/\\/g, '/')}`)

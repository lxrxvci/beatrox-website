import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const xmlPath = path.join(ROOT, 'exports', 'Squarespace-Wordpress-Export-02-25-2026.xml')
const reportDir = path.join(ROOT, 'site', 'reports')
const outputPath = path.join(reportDir, 'xml-media-map.json')

if (!fs.existsSync(xmlPath)) {
  console.error(`XML export not found: ${xmlPath}`)
  process.exit(1)
}

const decodeEntities = (value) =>
  value
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&#8217;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')

const stripTags = (value) =>
  decodeEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const xml = fs.readFileSync(xmlPath, 'utf-8')

const items = []
const itemRegex = /<item>([\s\S]*?)<\/item>/g
let itemMatch = itemRegex.exec(xml)
while (itemMatch) {
  const block = itemMatch[1]
  const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? ''
  const title = decodeEntities(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '')
  const postName = block.match(/<wp:post_name>(.*?)<\/wp:post_name>/)?.[1] ?? ''
  const postType = block.match(/<wp:post_type>(.*?)<\/wp:post_type>/)?.[1] ?? ''
  const content = block.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1] ?? ''
  items.push({ link, title, postName, postType, content })
  itemMatch = itemRegex.exec(xml)
}

const imageRegex = /<img[^>]+src="([^"]+)"/g
const backgroundRegex = /&quot;assetUrl&quot;:\s*&quot;([^"]+?)&quot;/g

function collectImages(content) {
  const urls = []
  let match = imageRegex.exec(content)
  while (match) {
    const src = decodeEntities(match[1]).replace(/\?format=\w+$/, '')
    if (!urls.includes(src)) urls.push(src)
    match = imageRegex.exec(content)
  }
  return urls
}

function collectBackgrounds(content) {
  const urls = []
  let match = backgroundRegex.exec(content)
  while (match) {
    const src = decodeEntities(match[1])
    if (!urls.includes(src)) urls.push(src)
    match = backgroundRegex.exec(content)
  }
  return urls
}

function extractTeamMembers(content) {
  const members = []
  const liRegex = /<li[\s\S]*?<\/li>/g
  let liMatch = liRegex.exec(content)
  while (liMatch) {
    const li = liMatch[0]
    const imgSrc = li.match(/<img[^>]+src="([^"]+)"/)?.[1]
    const headingRaw = li.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1]
    if (imgSrc && headingRaw) {
      const heading = stripTags(headingRaw)
      const name = heading.split('-')[0].trim()
      if (name) {
        members.push({
          name,
          heading,
          imageUrl: decodeEntities(imgSrc).replace(/\?format=\w+$/, ''),
        })
      }
    }
    liMatch = liRegex.exec(content)
  }
  return members
}

const pageByPost = Object.fromEntries(items.filter(i => i.postType === 'page').map(i => [i.postName, i]))

const aboutPage = pageByPost.about
const teamPage = pageByPost.team
const servicesPage = pageByPost.services
const homePage = pageByPost.home || pageByPost.index || aboutPage

const detailPostToLocalServiceSlug = {
  'dj-equipment-rentals': 'dj-equipment-rentals',
  'sound-equipment-rentals': 'sound-equipment-rentals',
  'laser-shows': 'laser-shows',
  'drone-light-shows': 'drone-light-shows',
  'led-video-wall-rentals-portland': 'led-video-wall-rentals',
}
const detailPostToLocalProjectSlug = {
  'projekt-x-stage-design-and-fabrication': 'projekt-x',
  'aku-world-immersive-environment-nft-miami': 'aku-world',
  'myshelter-project-immersive-enviroment': 'myshelter',
  'destination-experiential-event': 'destination',
  'create-our-future-experiential-event': 'create-our-future',
  'buzzfeed-newfronts-event-production': 'buzzfeed',
  'run-for-the-oceans-interactive-media-experience': 'run-for-the-oceans',
  'super-bowl-2020-projection-mapping-interactive-ar': 'super-bowl-2020',
  'flir-history-wall-interactive-media-display': 'flir',
  'infinite-playlist-tour-festival-activation-experiential-event': 'infinite-playlist',
}

const localServiceSlugs = fs
  .readdirSync(path.join(ROOT, 'content', 'services'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''))
  .sort()
const localProjectSlugs = fs
  .readdirSync(path.join(ROOT, 'content', 'portfolio'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''))
  .sort()

const serviceDetails = {}
for (const [postName, localSlug] of Object.entries(detailPostToLocalServiceSlug)) {
  const page = pageByPost[postName]
  if (!page) continue
  serviceDetails[localSlug] = {
    postName,
    link: page.link || `/${postName}`,
    title: page.title,
    images: collectImages(page.content),
    backgrounds: collectBackgrounds(page.content),
  }
}

const unresolvedServiceSlugs = localServiceSlugs.filter((slug) => !serviceDetails[slug])
const workDetails = {}
for (const [postName, localSlug] of Object.entries(detailPostToLocalProjectSlug)) {
  const page = pageByPost[postName]
  if (!page) continue
  workDetails[localSlug] = {
    postName,
    link: page.link || `/${postName}`,
    title: page.title,
    images: collectImages(page.content),
    backgrounds: collectBackgrounds(page.content),
  }
}
const unresolvedProjectSlugs = localProjectSlugs.filter((slug) => !workDetails[slug])
const workPage = pageByPost.work

const out = {
  generatedAt: new Date().toISOString(),
  sourceXml: path.relative(ROOT, xmlPath).replace(/\\/g, '/'),
  routes: {
    home: {
      sourcePostName: homePage?.postName ?? null,
      sourceLink: homePage?.link ?? null,
      images: homePage ? collectImages(homePage.content) : [],
      backgrounds: homePage ? collectBackgrounds(homePage.content) : [],
      notes: homePage?.postName === 'about' ? ['home_fallback_uses_about_export'] : [],
    },
    about: {
      sourcePostName: aboutPage?.postName ?? null,
      sourceLink: aboutPage?.link ?? null,
      images: aboutPage ? collectImages(aboutPage.content) : [],
      backgrounds: aboutPage ? collectBackgrounds(aboutPage.content) : [],
    },
    team: {
      sourcePostName: teamPage?.postName ?? null,
      sourceLink: teamPage?.link ?? null,
      images: teamPage ? collectImages(teamPage.content) : [],
      backgrounds: teamPage ? collectBackgrounds(teamPage.content) : [],
      members: teamPage ? extractTeamMembers(teamPage.content) : [],
    },
    services: {
      sourcePostName: servicesPage?.postName ?? null,
      sourceLink: servicesPage?.link ?? null,
      images: servicesPage ? collectImages(servicesPage.content) : [],
      backgrounds: servicesPage ? collectBackgrounds(servicesPage.content) : [],
      details: serviceDetails,
      unresolvedServiceSlugs,
    },
    work: {
      sourcePostName: workPage?.postName ?? null,
      sourceLink: workPage?.link ?? null,
      images: workPage ? collectImages(workPage.content) : [],
      backgrounds: workPage ? collectBackgrounds(workPage.content) : [],
      details: workDetails,
      unresolvedProjectSlugs,
    },
  },
}

fs.mkdirSync(reportDir, { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(out, null, 2) + '\n', 'utf-8')
console.log(`Wrote ${path.relative(ROOT, outputPath).replace(/\\/g, '/')}`)
console.log(`Team members with matched images: ${out.routes.team.members.length}`)

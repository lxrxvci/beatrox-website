import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const portfolioDir = path.join(ROOT, 'content', 'portfolio')
const publicPortfolioDir = path.join(ROOT, 'site', 'public', 'images', 'portfolio')

const files = fs.readdirSync(portfolioDir).filter(file => file.endsWith('.json'))
let updatedFiles = 0
let localizedImages = 0

for (const file of files) {
  const slug = file.replace('.json', '')
  const jsonPath = path.join(portfolioDir, file)
  const project = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  let changed = false

  if (Array.isArray(project.images)) {
    project.images = project.images.map((img) => {
      const url = (img?.url ?? '').trim()
      if (!url || !url.startsWith('http')) {
        return img
      }

      let filename = img?.filename
      if (!filename) {
        const cleanUrl = url.split('?')[0]
        filename = path.basename(cleanUrl)
      }

      const candidateAbs = path.join(publicPortfolioDir, slug, filename)
      if (!fs.existsSync(candidateAbs)) {
        return img
      }

      localizedImages += 1
      changed = true
      return {
        ...img,
        filename,
        url: `/images/portfolio/${slug}/${filename}`.replace(/\\/g, '/'),
      }
    })
  }

  if (project?.seo?.og?.image?.startsWith('/images/portfolio/')) {
    const ogAbs = path.join(ROOT, 'site', 'public', project.seo.og.image.replace(/^\/+/, ''))
    if (!fs.existsSync(ogAbs)) {
      project.seo.og.image = '/og-default.jpg'
      changed = true
    }
  }

  if (changed) {
    fs.writeFileSync(jsonPath, JSON.stringify(project, null, 2) + '\n', 'utf-8')
    updatedFiles += 1
    console.log(`Updated ${file}`)
  }
}

console.log(`\nLocalization complete.`)
console.log(`Files updated: ${updatedFiles}`)
console.log(`Image URLs localized: ${localizedImages}`)

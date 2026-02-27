import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

const baseLocal = process.env.LOCAL_BASE_URL || 'http://127.0.0.1:3000'
const baseLive = 'https://www.beatrox.com'

const routes = [
  '/',
  '/work',
  '/about',
  '/services',
  '/team',
  '/contact',
]

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

const outDir = path.join(process.cwd(), 'reports', 'visual-diff')
fs.mkdirSync(outDir, { recursive: true })

function routeToFile(route) {
  if (route === '/') return 'home'
  return route.replaceAll('/', '_').replace(/^_/, '')
}

const browser = await chromium.launch({ headless: true })
const reportRows = []

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    colorScheme: 'dark',
  })
  const page = await context.newPage()

  for (const route of routes) {
    const fileBase = `${routeToFile(route)}-${vp.name}`
    const localPngPath = path.join(outDir, `${fileBase}-local.png`)
    const livePngPath = path.join(outDir, `${fileBase}-live.png`)
    const diffPngPath = path.join(outDir, `${fileBase}-diff.png`)

    await page.goto(`${baseLocal}${route}`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(1200)
    await page.screenshot({ path: localPngPath, fullPage: true })

    await page.goto(`${baseLive}${route}`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(1200)
    await page.screenshot({ path: livePngPath, fullPage: true })

    const localImg = PNG.sync.read(fs.readFileSync(localPngPath))
    const liveImg = PNG.sync.read(fs.readFileSync(livePngPath))
    const width = Math.min(localImg.width, liveImg.width)
    const height = Math.min(localImg.height, liveImg.height)

    const localCropped = new PNG({ width, height })
    const liveCropped = new PNG({ width, height })
    PNG.bitblt(localImg, localCropped, 0, 0, width, height, 0, 0)
    PNG.bitblt(liveImg, liveCropped, 0, 0, width, height, 0, 0)

    const diff = new PNG({ width, height })
    const mismatchedPixels = pixelmatch(
      localCropped.data,
      liveCropped.data,
      diff.data,
      width,
      height,
      { threshold: 0.15 }
    )

    fs.writeFileSync(diffPngPath, PNG.sync.write(diff))
    const ratio = ((mismatchedPixels / (width * height)) * 100).toFixed(2)
    reportRows.push({
      route,
      viewport: vp.name,
      mismatchPercent: ratio,
      localPng: path.relative(process.cwd(), localPngPath).replace(/\\/g, '/'),
      livePng: path.relative(process.cwd(), livePngPath).replace(/\\/g, '/'),
      diffPng: path.relative(process.cwd(), diffPngPath).replace(/\\/g, '/'),
    })
    console.log(`${route} (${vp.name}) mismatch: ${ratio}%`)
  }

  await context.close()
}

await browser.close()

const md = []
md.push('# Visual Diff Report')
md.push('')
md.push(`Generated: ${new Date().toISOString()}`)
md.push('')
md.push('| Route | Viewport | Mismatch % | Local | Live | Diff |')
md.push('| --- | --- | ---: | --- | --- | --- |')
for (const row of reportRows) {
  md.push(
    `| \`${row.route}\` | ${row.viewport} | ${row.mismatchPercent}% | [local](${row.localPng}) | [live](${row.livePng}) | [diff](${row.diffPng}) |`
  )
}
md.push('')

const reportMdPath = path.join(outDir, 'report.md')
fs.writeFileSync(reportMdPath, md.join('\n'), 'utf-8')
console.log(`Report written: ${path.relative(process.cwd(), reportMdPath).replace(/\\/g, '/')}`)

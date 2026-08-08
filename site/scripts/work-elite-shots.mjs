// Work-elite verification shots: all 17 /work/<slug> pages at desktop 1440px
// full-page, 3 mobile 390px spot-checks, and 2 reduced-motion spot-checks.
// Usage: node scripts/work-elite-shots.mjs [baseUrl]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] || 'http://localhost:3100'
const outDir = '../.audit-screenshots/work-elite'
mkdirSync(outDir, { recursive: true })

const slugs = [
  'aku-world',
  'buzzfeed',
  'cnn-road-to-270',
  'create-our-future',
  'destination',
  'disenchantment',
  'dubai-360-spherical-projection-theatre',
  'el-camino',
  'flir',
  'g-man-experiential-campaign',
  'infinite-playlist',
  'myshelter',
  'projecting-change-racing-extinction',
  'projekt-x',
  'run-for-the-oceans',
  'super-bowl-2020',
  'the-great-escape',
]
const mobileSlugs = ['projekt-x', 'myshelter', 'run-for-the-oceans']
const reducedSlugs = ['projekt-x', 'myshelter']

const browser = await chromium.launch()
const failures = []

async function scrollBottomAndBack(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 150))
    }
  })
  // Pause at the bottom so native lazy images (next/image, posters) start
  // fetching, then scroll back and let everything settle.
  await page.waitForTimeout(2000)
  await page.evaluate(async () => {
    window.scrollTo(0, 0)
    const settle = Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => new Promise((r) => { img.onload = img.onerror = r })),
    )
    await Promise.race([settle, new Promise((r) => setTimeout(r, 12000))])
  })
  await page.waitForTimeout(800)
}

async function shoot(routes, viewport, suffix, opts = {}) {
  const page = await browser.newPage({ viewport, ...opts })
  for (const slug of routes) {
    const name = `${slug}${suffix}`
    try {
      // 'load', networkidle can hang on video embeds.
      await page.goto(`${base}/work/${slug}`, { waitUntil: 'load', timeout: 60000 })
      await scrollBottomAndBack(page)
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }))
      await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true })
      const ok = overflow.scrollWidth === overflow.innerWidth
      console.log(`${ok ? 'OK ' : 'OVERFLOW'} ${name} scrollWidth=${overflow.scrollWidth} innerWidth=${overflow.innerWidth}`)
      if (!ok) failures.push(name)
    } catch (err) {
      console.log(`FAIL ${name}: ${err.message}`)
      failures.push(name)
    }
  }
  await page.close()
}

await shoot(slugs, { width: 1440, height: 900 }, '')
await shoot(mobileSlugs, { width: 390, height: 844 }, '-mobile')
await shoot(reducedSlugs, { width: 1440, height: 900 }, '-reduced', { reducedMotion: 'reduce' })

await browser.close()
if (failures.length) {
  console.log('FAILURES:', failures.join(', '))
  process.exit(1)
}
console.log('ALL SHOTS OK')

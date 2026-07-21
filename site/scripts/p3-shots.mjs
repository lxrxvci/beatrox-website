// Phase 3 verification shots: mobile 390x844 (full page) + desktop 1440x900 spot-checks.
// Usage: node scripts/p3-shots.mjs [baseUrl]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] || 'http://localhost:3219'
const outDir = '../.audit-screenshots/elevation'
mkdirSync(outDir, { recursive: true })

const mobileRoutes = [
  ['p3-services', '/services'],
  ['p3-service-led', '/services/led-video-wall-rentals'],
  ['p3-service-backline', '/services/backline-stage-rental'],
  ['p3-work-myshelter', '/work/myshelter'],
  ['p3-about', '/about'],
  ['p3-team', '/team'],
  ['p3-contact', '/contact'],
  ['p3-book', '/book'],
  ['p3-work', '/work'],
  ['p3-home-work', '/'],
]
const desktopRoutes = [
  ['p3-d-services', '/services'],
  ['p3-d-about', '/about'],
  ['p3-d-work-myshelter', '/work/myshelter'],
]

const browser = await chromium.launch()
const failures = []

async function shoot(routes, viewport, suffix) {
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' })
  for (const [name, route] of routes) {
    try {
      await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 })
      // Scroll through the page so IntersectionObserver reveals (Reveal, NodeBullet) fire
      await page.evaluate(async () => {
        const step = window.innerHeight * 0.8
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 120))
        }
        window.scrollTo(0, 0)
      })
      await page.waitForTimeout(800)
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }))
      const file = `${outDir}/${name}${suffix}.png`
      await page.screenshot({ path: file, fullPage: true })
      const ok = overflow.scrollWidth === overflow.innerWidth
      console.log(`${ok ? 'OK ' : 'OVERFLOW'} ${name}${suffix} scrollWidth=${overflow.scrollWidth} innerWidth=${overflow.innerWidth}`)
      if (!ok) failures.push(name + suffix)
    } catch (err) {
      console.log(`FAIL ${name}${suffix}: ${err.message}`)
      failures.push(name + suffix)
    }
  }
  await page.close()
}

await shoot(mobileRoutes, { width: 390, height: 844 }, '')
await shoot(desktopRoutes, { width: 1440, height: 900 }, '')
await browser.close()
if (failures.length) {
  console.log('FAILURES:', failures.join(', '))
  process.exit(1)
}
console.log('All shots captured, zero horizontal overflow.')

// Swarm v2 audit: screenshot every scene at its scroll position on mobile
// 390x844 + desktop 1440x900, plus hero at 0 / 0.5 / 1.5 vh, FPS sampling,
// console-error capture, and horizontal-overflow check.
// Usage: node scripts/swarm2-audit.mjs [baseUrl] [--reduced]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] || 'http://localhost:3233'
const reduced = process.argv.includes('--reduced')
const outDir = '../.audit-screenshots/swarm2'
mkdirSync(outDir, { recursive: true })

// Scene anchors: [name, scroll target], element id scrolled to a viewport
// offset, or explicit vh offsets for the hero.
const sceneShots = [
  ['hero-0vh', { vh: 0 }],
  ['hero-0.5vh', { vh: 0.5 }],
  ['hero-1.5vh', { vh: 1.5 }],
  ['about', { id: '#about', block: 'center' }],
  ['services-grid', { id: '#services', block: 'center' }],
  ['work-tunnel-entry', { id: '#work', topFrac: 0.48 }],
  ['work-tunnel', { id: '#work', block: 'center' }],
  ['rentals-portal', { id: '#rentals', block: 'center' }],
  ['team-orbit', { id: '#team', block: 'center' }],
  ['contact-ignition', { id: '#contact', block: 'start' }],
  ['footer-fade', { end: true }],
]

const viewports = reduced
  ? [['reduced-desktop', { width: 1440, height: 900 }]]
  : [
      ['desktop', { width: 1440, height: 900 }],
      ['mobile', { width: 390, height: 844 }],
    ]

const browser = await chromium.launch()
const report = { consoleErrors: [], fps: {}, overflow: {} }

for (const [label, viewport] of viewports) {
  const page = await browser.newPage({
    viewport,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') report.consoleErrors.push(`[${label}] ${msg.text()}`)
  })
  page.on('pageerror', (err) => report.consoleErrors.push(`[${label}] PAGEERROR ${err.message}`))

  await page.goto(base + '/', { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(3500) // swarm hydrate + intro autoplay

  for (const [name, target] of sceneShots) {
    if (reduced && name !== 'hero-0vh' && name !== 'contact-ignition') continue
    await page.evaluate((t) => {
      if (t.vh !== undefined) {
        window.scrollTo({ top: window.innerHeight * t.vh, behavior: 'instant' })
      } else if (t.id) {
        const el = document.querySelector(t.id)
        if (!el) return
        const rect = el.getBoundingClientRect()
        let top
        if (t.topFrac !== undefined) {
          // Section top at the given fraction of the viewport height.
          top = window.scrollY + rect.top - window.innerHeight * t.topFrac
        } else if (t.block === 'start') {
          top = window.scrollY + rect.top
        } else {
          top = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2
        }
        window.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
      } else if (t.end) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })
      }
    }, target)
    await page.waitForTimeout(1600) // let morphs/scrims settle

    if (!reduced) {
      // FPS: rAF delta sampled over 3s at this scroll position.
      const fps = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const deltas = []
            let last = performance.now()
            let frames = 0
            const sample = (now) => {
              deltas.push(now - last)
              last = now
              if (++frames < 180) requestAnimationFrame(sample)
              else {
                deltas.sort((a, b) => a - b)
                const avg = deltas.reduce((s, d) => s + d, 0) / deltas.length
                resolve({
                  avg: Math.round(1000 / avg),
                  p95: Math.round(1000 / deltas[Math.floor(deltas.length * 0.95)]),
                })
              }
            }
            requestAnimationFrame(sample)
          })
      )
      report.fps[`${label}/${name}`] = fps
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth === window.innerWidth
      )
      report.overflow[`${label}/${name}`] = overflow
    }

    await page.screenshot({ path: `${outDir}/${label}-${name}.png` })
    console.log(`shot ${label}-${name}`)
  }
  await page.close()
}

console.log(JSON.stringify(report, null, 2))
await browser.close()

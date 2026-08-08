// Swarm v6 audit: truss logo scenes (mid-assembly + built), work two-phase
// reveal, NDC fit proof for the truss, FPS/console/overflow.
// Usage: node scripts/swarm6-audit.mjs [baseUrl] [--reduced]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] || 'http://localhost:3277'
const reduced = process.argv.includes('--reduced')
const outDir = '../.audit-screenshots/swarm6'
mkdirSync(outDir, { recursive: true })

const shots = [
  ['hero', { vh: 0 }],
  ['about-mid', { id: '#about', topFrac: 1.55 }],
  ['about-built', { id: '#about', block: 'center' }],
  ['services-grid', { id: '#services', block: 'center' }],
  ['work-tunnel', { id: '#work', topFrac: 1.75 }],
  ['work-transition', { id: '.swarm-work-grid', topFrac: 1.88 }],
  ['work-grid-solid', { id: '.swarm-work-grid', block: 'center' }],
  ['rentals-mid', { id: '#rentals', topFrac: 1.6 }],
  ['rentals-built', { id: '#rentals', block: 'center' }],
  ['contact-mid', { id: '#contact', topFrac: 1.55 }],
  ['contact-built', { id: '#contact', block: 'start' }],
]

const viewports = reduced
  ? [['reduced-desktop', { width: 1440, height: 900 }]]
  : [
      ['desktop', { width: 1440, height: 900 }],
      ['mobile', { width: 390, height: 844 }],
    ]

const browser = await chromium.launch()
const report = { consoleErrors: [], fps: {}, overflow: {}, ndc: {} }

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
  await page.waitForTimeout(3500)

  for (const [name, target] of shots) {
    if (reduced && !['about-built', 'work-grid-solid'].includes(name)) continue
    await page.evaluate((t) => {
      if (t.vh !== undefined) {
        window.scrollTo({ top: window.innerHeight * t.vh, behavior: 'instant' })
        return
      }
      const el = document.querySelector(t.id)
      if (!el) return
      const rect = el.getBoundingClientRect()
      let top
      if (t.topFrac !== undefined) {
        top = window.scrollY + rect.top - window.innerHeight * (t.topFrac - 1)
      } else if (t.block === 'start') {
        top = window.scrollY + rect.top
      } else {
        top = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2
      }
      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
    }, target)
    await page.waitForTimeout(1800)

    if (!reduced) {
      // NDC fit proof at built logo scenes.
      if (name === 'about-built' || name === 'rentals-built' || name === 'contact-built') {
        const key = name.split('-')[0]
        report.ndc[`${label}/${key}`] = await page.evaluate(
          (k) => window.__swarmDebug?.ndcBounds(k) ?? 'truss-not-mounted',
          key
        )
      }
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
      report.overflow[`${label}/${name}`] = await page.evaluate(
        () => document.documentElement.scrollWidth === window.innerWidth
      )
    }
    await page.screenshot({ path: `${outDir}/${label}-${name}.png` })
    console.log(`shot ${label}-${name}`)
  }
  await page.close()
}

console.log(JSON.stringify(report, null, 2))
await browser.close()

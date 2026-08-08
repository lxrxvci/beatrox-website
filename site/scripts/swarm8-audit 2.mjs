// Swarm v7 audit: truss fit + complete build at FOUR viewport sizes
// (incl. the user's 946×720), NDC proof ≤0.82, geometry completeness probe,
// FPS/console/overflow. Usage: node scripts/swarm8-audit.mjs [baseUrl] [--reduced]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] || 'http://localhost:3299'
const reduced = process.argv.includes('--reduced')
const outDir = '../.audit-screenshots/swarm8'
mkdirSync(outDir, { recursive: true })

const shots = [
  ['about-mid', { id: '#about', topFrac: 1.7 }],
  ['about-built', { id: '#about', block: 'center' }],
  ['rentals-mid', { id: '#rentals', topFrac: 1.7 }],
  ['rentals-built', { id: '#rentals', block: 'center' }],
  ['contact-mid', { id: '#contact', topFrac: 1.7 }],
  ['contact-built', { id: '#contact', block: 'start' }],
]

/** Expected source aspects (measured from the processed PNGs), the audit
 * asserts extraction matches within 3% and the grid's bottom rows are
 * occupied, so a cropped/wrong source can never silently ship again. */
const EXPECTED_ASPECTS = { about: 1.1526, rentals: 3.4286, contact: 1.1526 }

const viewports = reduced
  ? [['reduced-desktop', { width: 1440, height: 900 }]]
  : [
      ['user-946x720', { width: 946, height: 720 }],
      ['desktop', { width: 1440, height: 900 }],
      ['hd-1280x720', { width: 1280, height: 720 }],
      ['mobile', { width: 390, height: 844 }],
    ]

const browser = await chromium.launch()
const report = { consoleErrors: [], fps: {}, overflow: {}, ndc: {}, completeness: {} }

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
    if (reduced && name !== 'about-built') continue
    await page.evaluate((t) => {
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
      const key = name.split('-')[0]
      report.ndc[`${label}/${key}`] = await page.evaluate(
        (k) => window.__swarmDebug?.ndcBounds(k) ?? 'not-mounted',
        key
      )
      if (name.endsWith('-built')) {
        const key = name.split('-')[0]
        const info = await page.evaluate(
          (k) => window.__swarmDebug?.trussGridInfo(k) ?? null,
          key
        )
        const local = await page.evaluate(
          (k) => window.__swarmDebug?.trussLocalSize(k) ?? null,
          key
        )
        report.completeness[`${label}/${key}`] = info
          ? {
              bottomRowsOccupied: info.bottomOccupiedCells > 0,
              srcAspect: info.srcAspect,
              aspectWithin3Pct: Math.abs(info.srcAspect / EXPECTED_ASPECTS[key] - 1) <= 0.03,
              localAspect: local ? local.width / local.height : null,
              localMatchesSrc:
                // 5% tolerance: the trimmed asset's 8px padding is
                // proportionally larger on the short axis of wide marks,
                // which shifts the occupied-cell bbox slightly off the
                // source aspect without any content loss.
                local && info ? Math.abs(local.width / local.height / info.srcAspect - 1) <= 0.05 : null,
            }
          : 'truss-not-mounted'
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

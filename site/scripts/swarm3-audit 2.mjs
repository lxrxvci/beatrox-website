// Swarm v3 audit: work-section takeover (no DOM grid under swarm), section
// boundary hairline check, FPS/console/overflow. Usage:
//   node scripts/swarm3-audit.mjs [baseUrl] [--reduced]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] || 'http://localhost:3244'
const reduced = process.argv.includes('--reduced')
const outDir = '../.audit-screenshots/swarm3'
mkdirSync(outDir, { recursive: true })

const shots = [
  ['boundary-about-services', { id: '#services', topFrac: 1.5 }],
  ['services-grid', { id: '#services', block: 'center' }],
  ['boundary-services-work', { id: '#work', topFrac: 1.5 }],
  ['work-entry', { id: '#work', topFrac: 1.75 }],
  ['work-mid', { id: '#work', block: 'center' }],
  ['work-late', { id: '#work', bottomFrac: 0.55 }],
  ['boundary-work-rentals', { id: '#rentals', topFrac: 1.5 }],
  ['rentals-portal', { id: '#rentals', block: 'center' }],
  ['boundary-rentals-team', { id: '#team', topFrac: 1.5 }],
  ['boundary-team-contact', { id: '#contact', topFrac: 1.5 }],
  ['contact-ignition', { id: '#contact', block: 'start' }],
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
  await page.waitForTimeout(3500)

  for (const [name, target] of shots) {
    if (reduced && !['work-mid', 'boundary-services-work'].includes(name)) continue
    await page.evaluate((t) => {
      const el = document.querySelector(t.id)
      if (!el) return
      const rect = el.getBoundingClientRect()
      let top
      if (t.topFrac !== undefined) {
        // Section top at the given fraction of viewport height (frac > 1
        // places the section BELOW the fold: boundary sits mid-viewport).
        top = window.scrollY + rect.top - window.innerHeight * (t.topFrac - 1)
      } else if (t.bottomFrac !== undefined) {
        top = window.scrollY + rect.bottom - window.innerHeight * t.bottomFrac
      } else if (t.block === 'start') {
        top = window.scrollY + rect.top
      } else {
        top = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2
      }
      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
    }, target)
    await page.waitForTimeout(1600)

    if (!reduced) {
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

// Swarm v4 audit: logo scenes (about/rentals/contact), triangle sprites,
// hover color emission, FPS/console/overflow. Usage:
//   node scripts/swarm5-audit.mjs [baseUrl] [--reduced]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] || 'http://localhost:3266'
const reduced = process.argv.includes('--reduced')
const outDir = '../.audit-screenshots/swarm5'
mkdirSync(outDir, { recursive: true })

const shots = [
  ['hero', { vh: 0 }],
  ['about-logo', { id: '#about', block: 'center' }],
  ['services-grid', { id: '#services', block: 'center' }],
  ['rentals-logo', { id: '#rentals', block: 'center' }],
  ['team-orbit', { id: '#team', block: 'center' }],
  ['contact-logo', { id: '#contact', block: 'start' }],
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
    if (reduced && name !== 'about-logo') continue
    await page.evaluate((t) => {
      if (t.vh !== undefined) {
        window.scrollTo({ top: window.innerHeight * t.vh, behavior: 'instant' })
        return
      }
      const el = document.querySelector(t.id)
      if (!el) return
      const rect = el.getBoundingClientRect()
      const top =
        t.block === 'start'
          ? window.scrollY + rect.top
          : window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2
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

  // Hover emission: stir the pointer across the canvas, capture the laser
  // palette. Only meaningful on desktop (pointer: fine).
  if (!reduced && label === 'desktop') {
    for (const [name, target] of [
      ['hover-about', { id: '#about', block: 'center' }],
      ['hover-hero', { vh: 0 }],
    ]) {
      await page.evaluate((t) => {
        if (t.vh !== undefined) {
          window.scrollTo({ top: window.innerHeight * t.vh, behavior: 'instant' })
          return
        }
        const el = document.querySelector(t.id)
        const rect = el.getBoundingClientRect()
        window.scrollTo({
          top: Math.max(0, window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2),
          behavior: 'instant',
        })
      }, target)
      await page.waitForTimeout(1500)
      // Sweep the pointer in an arc so strength stays high, then shoot.
      for (let i = 0; i <= 14; i++) {
        await page.mouse.move(420 + i * 45, 430 + Math.sin(i / 2.2) * 140)
        await page.waitForTimeout(70)
      }
      await page.screenshot({ path: `${outDir}/${label}-${name}.png` })
      console.log(`shot ${label}-${name}`)
    }
  }
  await page.close()
}

console.log(JSON.stringify(report, null, 2))
await browser.close()

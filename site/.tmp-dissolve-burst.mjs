/**
 * Dense dissolve-window diagnostic burst.
 * Captures every ~80ms from dissolve-0.3s to dissolve+1.2s into
 * ../.audit-screenshots/intro-overlay/dissolve-*.jpg, plus rAF frame-delta
 * stats through the window (jank detection).
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const OUT = path.resolve(process.cwd(), '../.audit-screenshots/intro-overlay')
mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.addInitScript(() => {
  window.__frameDeltas = []
  let last = 0
  const loop = (t) => {
    if (last) window.__frameDeltas.push(t - last)
    last = t
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
})
await page.goto('http://localhost:3100/', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.intro-counter', { state: 'visible', timeout: 20000 })

// Detect timeline start (counter fade begins at tl 0.05).
let tlZero = null
for (let i = 0; i < 250; i++) {
  const op = await page.evaluate(() => {
    const c = document.querySelector('.intro-counter')
    const wrap = c?.parentElement
    return wrap ? parseFloat(getComputedStyle(wrap).opacity) : null
  })
  if (op === null) break
  if (op < 1) { tlZero = Date.now() - 50; break }
  await sleep(40)
}
if (!tlZero) { console.log('no tlZero'); process.exit(1) }

// dissolve label at tl 9.05s (m0 2.5 + 3×1.25 + 0.2 + 2.6)
const D0 = 9050
await page.evaluate(() => { window.__frameDeltas.length = 0 })
const start = tlZero + D0 - 300
const end = tlZero + D0 + 1200
let seq = 0
console.log('capturing dissolve window…')
while (Date.now() < end) {
  const wait = start + seq * 80 - Date.now()
  if (wait > 0) await sleep(wait)
  const rel = ((Date.now() - (tlZero + D0)) / 1000).toFixed(2)
  seq++
  await page.screenshot({
    type: 'jpeg', quality: 80,
    path: path.join(OUT, `dissolve-${String(seq).padStart(2, '0')}_at${rel}s.jpg`),
  })
}
// frame-delta stats over the window
const stats = await page.evaluate(() => {
  const d = window.__frameDeltas
  const over50 = d.filter((x) => x > 50).length
  const over100 = d.filter((x) => x > 100).length
  const max = Math.max(...d)
  const avg = d.reduce((a, b) => a + b, 0) / d.length
  return { frames: d.length, avg: avg.toFixed(1), max: max.toFixed(0), over50, over100 }
})
console.log('rAF deltas through dissolve:', JSON.stringify(stats))
await browser.close()
console.log('done,', seq, 'frames')

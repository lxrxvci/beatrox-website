/**
 * Card-3 burst capture: frames at tl 4.7 / 4.95 / 5.2 / 5.5 (anchored to
 * the detected timeline start) proving a static field through card 2 and
 * the second particle burst landing with HUMAN CONNECTION.
 * Usage: node .tmp-burst2-capture.mjs <tag>   → burst2-<tag>-<tl>.png
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const tag = process.argv[2] || 'run'
const OUT = path.resolve(process.cwd(), '../.audit-screenshots/intro-overlay')
mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto('http://localhost:3100/', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.intro-counter', { state: 'visible', timeout: 20000 })
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
for (const ms of [4700, 4960, 5060, 5140, 5200, 5500]) {
  const wait = tlZero + ms - Date.now()
  if (wait > 0) await sleep(wait)
  await page.screenshot({ path: path.join(OUT, `burst2-${tag}-${(ms / 1000).toFixed(2)}s.png`) })
  console.log(`captured burst2-${tag}-${(ms / 1000).toFixed(2)}s.png`)
}
await browser.close()

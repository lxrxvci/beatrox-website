/**
 * Playwright end-to-end audit for the first-visit intro overlay.
 * Run from site/:  node .tmp-intro-audit.mjs
 * Requires a prod server on http://localhost:3100.
 * Screenshots land in ../.audit-screenshots/intro-overlay/.
 *
 * NOTE: this dev box serves HTML with 2.5–3s TTFB (iCloud-synced dir), so
 * all beat timings are anchored to the overlay's mount, not to goto().
 */
import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const BASE = 'http://localhost:3100'
const OUT = path.resolve(process.cwd(), '../.audit-screenshots/intro-overlay')
mkdirSync(OUT, { recursive: true })

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `, ${detail}` : ''}`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function watchConsole(page, store) {
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) {
      store.push(msg.text())
    }
  })
  page.on('pageerror', (err) => store.push(String(err)))
  page.on('response', (r) => {
    // @vercel/analytics 404s on any non-Vercel host, pre-existing, ignore.
    if (r.status() >= 400 && !r.url().includes('_vercel/insights')) {
      store.push(`${r.status()} ${r.url()}`)
    }
  })
}

/** Screenshots at offsets (ms) relative to t0, named <prefix>-<s>.png */
const shotAt = async (page, t0, offsets, prefix) => {
  for (const ms of offsets) {
    const wait = t0 + ms - Date.now()
    if (wait > 0) await sleep(wait)
    await page.screenshot({ path: path.join(OUT, `${prefix}-${(ms / 1000).toFixed(1)}s.png`) })
  }
}

const overlayPresent = (page) =>
  page.locator('button.intro-skip').isVisible().catch(() => false)

const waitOverlayMount = (page) =>
  page.waitForSelector('.intro-counter', { state: 'visible', timeout: 20000 })

const waitOverlayGone = (page) =>
  page.waitForSelector('button.intro-skip', { state: 'detached', timeout: 20000 })

const overlayOpacity = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('button.intro-skip')?.closest('div.fixed')
    return el ? parseFloat(getComputedStyle(el).opacity) : null
  })

const diffPngs = (a, b) => {
  const imgA = PNG.sync.read(readFileSync(a))
  const imgB = PNG.sync.read(readFileSync(b))
  if (imgA.width !== imgB.width || imgA.height !== imgB.height) return 1
  const n = pixelmatch(imgA.data, imgB.data, null, imgA.width, imgA.height, { threshold: 0.15 })
  return n / (imgA.width * imgA.height)
}

const browser = await chromium.launch()

// ── A. First visit, desktop 1440px: full intro plays ─────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  watchConsole(page, errors)
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await waitOverlayMount(page)
  const t0 = Date.now() // anchored at overlay mount, not goto (slow local TTFB)

  // Detect the timeline start CONCURRENTLY (counter fade begins at tl 0.05)
  // polling only after the first screenshots can miss the fade entirely
  // when beat 0 is short, skewing every tl-anchored capture.
  const tlZeroPromise = page
    .waitForFunction(
      () => {
        const c = document.querySelector('.intro-counter')
        const wrap = c?.parentElement
        return wrap ? parseFloat(getComputedStyle(wrap).opacity) < 1 : false
      },
      { polling: 20, timeout: 20000 }
    )
    .then(() => Date.now() - 50)
    .catch(() => null)

  // Track the true overlay-unmount time concurrently, cheap RAF polling,
  // immune to the screenshot load below, so A4 measures the intro and not
  // the audit's own capture overhead.
  const goneAtPromise = page
    .waitForSelector('button.intro-skip', { state: 'detached', timeout: 30000 })
    .then(() => Date.now())

  // Seamless handoff: last frame with the overlay (opacity ≈ 0) vs. the real
  // hero right after unmount, must be visually continuous (no jump/flash).
  // The watcher runs concurrently with the beat captures so it can't miss
  // the short fade-out tail.
  let lateShot = false
  const handoffWatcher = (async () => {
    for (let i = 0; i < 400; i++) {
      const op = await overlayOpacity(page)
      if (op === null) break
      if (op <= 0.05) {
        await page.screenshot({ path: path.join(OUT, 'desktop-handoff-late.png') })
        lateShot = true
        return
      }
      await sleep(60)
    }
  })()
  await shotAt(page, t0, [500, 1500], 'desktop-first')
  const tlZero = await tlZeroPromise
  check('A0 timeline start detected', tlZero !== null)

  // Beat-1 assembly burst (event-anchored), the legacy wall-clock frames
  // were dropped to keep the capture schedule light enough for the A7
  // dissolve probes to fire on time.
  const named = []
  // Sync proof: capture the exact frame each streak finishes opening (its
  // clip-path reaches inset(0%)). By design the phrase's last char locks at
  // the same moment. Watchers run CONCURRENTLY with the frame loop (streak
  // 1 opens before the loop's last standard frame) and are event-driven,
  // so screenshot drift can't mistime them.
  const syncShots = [0, 1, 2].map((c) =>
    page
      .waitForFunction(
        (idx) => {
          const root = document.querySelector('button.intro-skip')?.closest('div.fixed')
          if (!root) return false
          const streaks = [...root.querySelectorAll('div')].filter(
            (d) => d.style.clipPath && d.querySelector('img')
          )
          const s = streaks[idx]
          if (!s) return false
          const cp = getComputedStyle(s).clipPath
          return parseFloat(getComputedStyle(s).opacity) === 1 && (cp === 'inset(0%)' || cp === 'none')
        },
        c,
        { polling: 30, timeout: 25000 }
      )
      .then(async () => {
        await page.screenshot({ path: path.join(OUT, `sync-card-${c + 1}.png`) })
        return true
      })
      .catch(() => false)
  )

  if (tlZero) {
    const off = tlZero - t0
    // Static lattice flash (field only, no word) right after counter exit.
    named.push({ ms: off + 500, name: 'flash-0.5s' })
    // Finale assembly burst: every 0.2s through the convergence (4.75s →
    // locked), must show progressive left-to-right letterforms mid-morph.
    for (let ms = 4900; ms <= 6300; ms += 200) {
      named.push({ ms: off + ms, name: `beat1-${(ms / 1000).toFixed(1)}s` })
    }
    // Part + match-frame landing.
    named.push({ ms: off + 7500, name: 'finale-part-7.5s' })
  }
  named.sort((a, b) => a.ms - b.ms)
  for (const s of named) {
    const wait = t0 + s.ms - Date.now()
    if (wait > 0) await sleep(wait)
    await page.screenshot({ path: path.join(OUT, `${s.name}.png`) })
  }

  const syncResults = await Promise.all(syncShots)
  syncResults.forEach((ok, c) => check(`A6 sync: card ${c + 1} phrase+image frame captured at full-open`, ok))

  // A7: mid-dissolve continuity, consecutive frames through the crossfade
  // must be near-identical. A blur snap/defocus pulse or a hard cut would
  // produce a large inter-frame delta; a clean opacity ramp stays small.
  if (tlZero) {
    const d0Wall = tlZero + 9700 // dissolve label at tl 9.7s (h0 7.4 + 2.3 hold)
    const probes = []
    for (let ms = 50; ms <= 650; ms += 120) {
      const wait = d0Wall + ms - Date.now()
      if (wait > 0) await sleep(wait)
      const p = path.join(OUT, `dissolve-probe-${ms}.png`)
      await page.screenshot({ path: p })
      probes.push(p)
    }
    let maxDelta = 0
    for (let i = 1; i < probes.length; i++) {
      maxDelta = Math.max(maxDelta, diffPngs(probes[i - 1], probes[i]))
    }
    check('A7 dissolve: continuous crossfade (max consecutive delta < 15%)', maxDelta < 0.15, `${(maxDelta * 100).toFixed(2)}%`)
  }
  await handoffWatcher
  check('A1 first visit: overlay shown', await page.evaluate(() => sessionStorage.getItem('beatrox-intro-seen') === '1'))

  const goneAt = await goneAtPromise
  const runtimeMs = goneAt - t0
  await sleep(250)
  await page.screenshot({ path: path.join(OUT, 'desktop-handoff-after.png') })
  check('A2 handoff: captured overlay-late frame', lateShot)
  if (lateShot) {
    const diff = diffPngs(path.join(OUT, 'desktop-handoff-late.png'), path.join(OUT, 'desktop-handoff-after.png'))
    check('A3 handoff: seamless (no jump)', diff < 0.12, `${(diff * 100).toFixed(2)}% pixels differ`)
  }
  check('A4 intro runtime ≤ 12.5s from mount (logotype-finale pacing)', runtimeMs <= 12500, `${(runtimeMs / 1000).toFixed(2)}s`)
  check('A5 no console errors during intro', errors.length === 0, errors.join(' | ').slice(0, 300))

  // ── B. Same-context reload: NO intro ──────────────────────────────────
  const threeReqs = []
  page.on('request', (req) => {
    if (/three/i.test(req.url())) threeReqs.push(req.url())
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await sleep(2500)
  check('B1 reload: no intro overlay', !(await overlayPresent(page)))
  await page.screenshot({ path: path.join(OUT, 'desktop-reload.png') })
  await sleep(1500)
  check('B2 reload: three.js chunk NOT downloaded', threeReqs.length === 0, threeReqs[0] ?? '')
  check('B3 reload: no console errors', errors.length === 0, errors.join(' | ').slice(0, 300))

  // ── C1. ?intro=1 forces replay ────────────────────────────────────────
  await page.goto(BASE + '/?intro=1', { waitUntil: 'domcontentloaded' })
  await waitOverlayMount(page)
  check('C1 ?intro=1 replays intro', await overlayPresent(page))

  // ── C2. ?intro=0 kills it (fresh context) ─────────────────────────────
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page2 = await ctx2.newPage()
  const errors2 = []
  watchConsole(page2, errors2)
  await page2.goto(BASE + '/?intro=0', { waitUntil: 'domcontentloaded' })
  await sleep(2000)
  check('C2 ?intro=0 never shows intro', !(await overlayPresent(page2)))
  check('C3 ?intro=0: no console errors', errors2.length === 0, errors2.join(' | ').slice(0, 300))
  await ctx2.close()

  // ── E1. Skip button jumps to dissolve ─────────────────────────────────
  await page.locator('button.intro-skip').click()
  await sleep(500)
  await page.screenshot({ path: path.join(OUT, 'desktop-skip-mid-dissolve.png') })
  await waitOverlayGone(page)
  await page.screenshot({ path: path.join(OUT, 'desktop-skip-after.png') })
  check('E1 skip button: overlay gone after dissolve', !(await overlayPresent(page)))

  // ── E2. Esc key jumps to dissolve (fade, not hard cut) ────────────────
  await page.goto(BASE + '/?intro=1', { waitUntil: 'domcontentloaded' })
  await waitOverlayMount(page)
  await sleep(2400) // well into the montage, timeline is running
  await page.keyboard.press('Escape')
  await sleep(350)
  await page.screenshot({ path: path.join(OUT, 'desktop-esc-mid-dissolve.png') })
  const midOpacity = await overlayOpacity(page)
  await waitOverlayGone(page)
  check('E2 Esc: fade (not hard cut) then gone', midOpacity !== null && midOpacity > 0 && midOpacity < 1 && !(await overlayPresent(page)), `mid-fade opacity ${midOpacity}`)
  check('E3 skips: no console errors', errors.length === 0, errors.join(' | ').slice(0, 300))
  await ctx.close()
}

// ── D. Reduced motion: intro never mounts ────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const errors = []
  watchConsole(page, errors)
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await sleep(2500)
  check('D1 reduced-motion: no intro overlay', !(await overlayPresent(page)))
  await page.screenshot({ path: path.join(OUT, 'desktop-reduced-motion.png') })
  check('D2 reduced-motion: no console errors', errors.length === 0, errors.join(' | ').slice(0, 300))
  await ctx.close()
}

// ── F. Mobile 390px: intro plays, runtime ≤ 9s from mount ────────────────
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  })
  const page = await ctx.newPage()
  const errors = []
  watchConsole(page, errors)
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await waitOverlayMount(page)
  const t0 = Date.now()
  await shotAt(page, t0, [500, 2000, 4000, 6000, 7500], 'mobile-first')
  await waitOverlayGone(page)
  const runtimeMs = Date.now() - t0
  check('F1 mobile: intro completed', !(await overlayPresent(page)))
  check('F2 mobile: runtime ≤ 12.5s from mount (logotype-finale pacing)', runtimeMs <= 12500, `${(runtimeMs / 1000).toFixed(2)}s`)
  check('F3 mobile: no console errors', errors.length === 0, errors.join(' | ').slice(0, 300))
  await ctx.close()
}

await browser.close()

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)

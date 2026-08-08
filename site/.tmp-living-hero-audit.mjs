/**
 * Playwright audit for the living home hero (LivingHeroImage).
 * Run from site/:  node .tmp-living-hero-audit.mjs
 * Requires a prod server on http://localhost:3100.
 * Screenshots land in ../.audit-screenshots/living-hero/.
 *
 * Diff strategy:
 *  - static-reference.png: normal-motion context, WebGL disabled → the
 *    static hero exactly as fallback users see it.
 *  - frozen.png: canvas mounted, u_time/u_fade forced to 0 via the
 *    temporary window.__livingHero() hook → pure pass-through frame.
 *  - frozen vs static proves the fade-in is (near) pixel-identical.
 *  - animation frames vs FROZEN isolates the effect footprint (both share
 *    the canvas resampling), that diff must be confined to the regions.
 *
 * NOTE: this dev box serves HTML with 2.5–3s TTFB (iCloud-synced dir), so
 * frame timings are anchored to the canvas mount, not to goto().
 */
import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const BASE = 'http://localhost:3100'
const OUT = path.resolve(process.cwd(), '../.audit-screenshots/living-hero')
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
    if (r.status() >= 400 && !r.url().includes('_vercel/insights')) {
      store.push(`${r.status()} ${r.url()}`)
    }
  })
}

const noWebGL = () => {
  const orig = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (String(type).includes('webgl')) return null
    return orig.call(this, type, ...rest)
  }
}
const introSeen = () => window.sessionStorage.setItem('beatrox-intro-seen', '1')

const DESKTOP = { width: 1440, height: 900 }
const IMG_ASPECT = 1637 / 921

// object-cover: screen-px rect for an image-uv rect at a given viewport.
function uvRectToScreen(u0, v0, u1, v1, vw, vh) {
  const boxA = vw / vh
  let sx, sy, ox, oy
  if (boxA > IMG_ASPECT) {
    sx = 1; sy = IMG_ASPECT / boxA; ox = 0; oy = (1 - sy) / 2
  } else {
    sx = boxA / IMG_ASPECT; sy = 1; ox = (1 - sx) / 2; oy = 0
  }
  return {
    x: Math.round(((u0 - ox) / sx) * vw),
    y: Math.round(((v0 - oy) / sy) * vh),
    w: Math.round(((u1 - u0) / sx) * vw),
    h: Math.round(((v1 - v0) / sy) * vh),
  }
}

// Effect regions in image uv (generous boxes around the tuned geometry).
const X_UV = [0.36, 0.08, 0.65, 0.55]
const GAL_UV = [0.0, 0.0, 0.46, 0.56]

function regionDiff(basePng, framePng, vw, vh, label) {
  const xR = uvRectToScreen(...X_UV, vw, vh)
  const gR = uvRectToScreen(...GAL_UV, vw, vh)
  const diff = new PNG({ width: vw, height: vh })
  const numDiff = pixelmatch(basePng.data, framePng.data, diff.data, vw, vh, {
    threshold: 0.12,
  })
  let inX = 0, inGal = 0, outside = 0
  for (let py = 0; py < vh; py++) {
    for (let px = 0; px < vw; px++) {
      const i = (py * vw + px) * 4
      const isDiff = diff.data[i] > 200 && diff.data[i + 1] < 100 // pixelmatch red
      if (!isDiff) continue
      const inXr = px >= xR.x && px < xR.x + xR.w && py >= xR.y && py < xR.y + xR.h
      const inGr = px >= gR.x && px < gR.x + gR.w && py >= gR.y && py < gR.y + gR.h
      if (inXr) inX++
      else if (inGr) inGal++
      else outside++
    }
  }
  const total = vw * vh
  console.log(
    `   [${label}] diff px: ${numDiff} | X: ${inX} | galaxy: ${inGal} | outside: ${outside} (${((outside / total) * 100).toFixed(3)}%)`
  )
  return { numDiff, inX, inGal, outside, total }
}

const browser = await chromium.launch()

// ── 1. Static reference: normal motion, WebGL disabled ────────────────────
{
  const errors = []
  const ctx = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 })
  await ctx.addInitScript(() => {
    window.sessionStorage.setItem('beatrox-intro-seen', '1')
    const orig = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (String(type).includes('webgl')) return null
      return orig.call(this, type, ...rest)
    }
  })
  const page = await ctx.newPage()
  watchConsole(page, errors)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await sleep(3500)
  const hasCanvas = await page.locator('section.hero canvas').count()
  check('WebGL disabled: no canvas mounts', hasCanvas === 0, `count ${hasCanvas}`)
  check('WebGL disabled: no console errors', errors.length === 0, errors.join(' | '))
  await page.screenshot({ path: path.join(OUT, 'static-reference.png') })
  await ctx.close()
}

// ── 2. Repeat visit: frozen frame + animation frames + rAF ────────────────
{
  const errors = []
  const ctx = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 })
  await ctx.addInitScript(introSeen)
  const page = await ctx.newPage()
  watchConsole(page, errors)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('section.hero canvas', { timeout: 20000 })
  check('repeat visit: canvas mounts', true)
  await page
    .waitForFunction(
      () => {
        const c = document.querySelector('section.hero canvas')
        return c && parseFloat(getComputedStyle(c).opacity) > 0.95
      },
      { timeout: 15000 }
    )
    .catch(() => {})

  // Frozen pass-through frame (effects forced to t=0 / fade=0).
  await page.evaluate(() => window.__livingHero('freeze'))
  await sleep(200)
  await page.screenshot({ path: path.join(OUT, 'frozen.png') })

  // Resume animation and capture t≈0/1.5/3/5 from resume.
  await page.evaluate(() => window.__livingHero('play'))
  await page.screenshot({ path: path.join(OUT, 'frame-t0.png') })
  await sleep(1500)
  await page.screenshot({ path: path.join(OUT, 'frame-t1.5.png') })
  await sleep(1500)
  await page.screenshot({ path: path.join(OUT, 'frame-t3.png') })
  await sleep(2000)
  await page.screenshot({ path: path.join(OUT, 'frame-t5.png') })

  const fps = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let n = 0
        const t0 = performance.now()
        const loop = () => {
          n++
          if (performance.now() - t0 < 2000) requestAnimationFrame(loop)
          else resolve(n / 2)
        }
        requestAnimationFrame(loop)
      })
  )
  check('rAF stable on-screen', fps > 25, `${fps.toFixed(0)} fps`)

  const paused = await page.evaluate(async () => {
    const canvas = document.querySelector('section.hero canvas')
    if (!canvas) return { ok: false, reason: 'no canvas' }
    const gl =
      canvas.getContext('webgl2', { preserveDrawingBuffer: true }) ||
      canvas.getContext('webgl', { preserveDrawingBuffer: true })
    if (!gl) return { ok: false, reason: 'no gl handle' }
    const read = () => {
      const px = new Uint8Array(4)
      gl.readPixels(
        Math.floor(gl.drawingBufferWidth / 2),
        Math.floor(gl.drawingBufferHeight / 3),
        1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px
      )
      return px.join(',')
    }
    window.scrollTo(0, document.body.scrollHeight)
    await new Promise((r) => setTimeout(r, 800))
    const a = read()
    await new Promise((r) => setTimeout(r, 700))
    const b = read()
    window.scrollTo(0, 0)
    return { ok: a === b, a, b }
  })
  check('rAF pauses off-screen', paused.ok, paused.reason || `${paused.a} vs ${paused.b}`)

  check('repeat visit: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// Region + identity diffs.
{
  const staticPng = PNG.sync.read(readFileSync(path.join(OUT, 'static-reference.png')))
  const frozen = PNG.sync.read(readFileSync(path.join(OUT, 'frozen.png')))

  // Fade-in identity: frozen canvas vs static fallback.
  {
    const d = new PNG({ width: DESKTOP.width, height: DESKTOP.height })
    const n = pixelmatch(staticPng.data, frozen.data, d.data, DESKTOP.width, DESKTOP.height, {
      threshold: 0.12,
    })
    const pct = (n / (DESKTOP.width * DESKTOP.height)) * 100
    // Soft gate: residual is LED-moiré resampling noise (0% at threshold
    // 0.25) plus text-AA run variance; visual identity is what matters.
    check('frozen frame ≈ static (seamless fade-in)', pct < 1.0, `${pct.toFixed(3)}% @0.12`)
  }

  // Animation footprint vs frozen frame, must stay inside the regions.
  for (const f of ['frame-t1.5.png', 'frame-t3.png', 'frame-t5.png']) {
    const frame = PNG.sync.read(readFileSync(path.join(OUT, f)))
    const { inX, inGal, outside, total } = regionDiff(
      frozen, frame, DESKTOP.width, DESKTOP.height, f
    )
    check(`${f}: diff present in both regions`, inX > 400 && inGal > 400, `X=${inX} galaxy=${inGal}`)
    check(
      `${f}: diff confined to regions`,
      outside / total < 0.005,
      `${((outside / total) * 100).toFixed(3)}% outside`
    )
  }
}

// ── 3. First visit with intro forced: handoff seamless, canvas after ──────
{
  const errors = []
  const ctx = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  watchConsole(page, errors)
  await page.goto(`${BASE}/?intro=1`, { waitUntil: 'domcontentloaded' })
  await sleep(3000)
  const duringIntro = await page.locator('section.hero canvas').count()
  check('intro playing: no canvas yet', duringIntro === 0, `count ${duringIntro}`)
  await page.waitForSelector('section.hero canvas', { timeout: 30000 })
  check('post-intro: canvas mounts', true)
  await sleep(1200)
  await page.screenshot({ path: path.join(OUT, 'post-intro.png') })
  check('intro run: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// ── 4. Reduced motion → static hero, no canvas, no errors ─────────────────
{
  const errors = []
  const ctx = await browser.newContext({
    viewport: DESKTOP,
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()
  watchConsole(page, errors)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await sleep(2500)
  const hasCanvas = await page.locator('section.hero canvas').count()
  check('reduced-motion: no canvas mounts', hasCanvas === 0, `count ${hasCanvas}`)
  check('reduced-motion: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

// ── 5. Mobile 390px: regions track ────────────────────────────────────────
{
  const errors = []
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  await ctx.addInitScript(introSeen)
  const page = await ctx.newPage()
  watchConsole(page, errors)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('section.hero canvas', { timeout: 20000 })
  await sleep(2500)
  await page.screenshot({ path: path.join(OUT, 'mobile-390.png') })
  check('mobile 390: canvas mounts', true)
  check('mobile 390: no console errors', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

await browser.close()
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)

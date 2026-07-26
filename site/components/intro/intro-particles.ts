import { gsap } from 'gsap'

/**
 * Particle scene for the first-visit intro (three.js, vanilla — no R3F).
 * Dynamically imported by IntroCanvas so `three` never enters the initial
 * bundle; repeat visitors never download it (plan §4).
 *
 * Lifecycle mirrors the FluidImage precedent: lazy `await import('three')`,
 * a cancelled/live guard in the caller, and full dispose on teardown.
 *
 * Scene: an additive-blended THREE.Points field (~8k desktop / ~3k low
 * tier) that idles as a breathing dot lattice (beat 0), then visibly
 * ASSEMBLES "BEATROX" (beat 1) — per-particle staggered easing with a
 * left-to-right sweep so the word draws itself across, x-sorted target
 * assignment so travel reads as convergence (not a shuffle), a 2.5%
 * acid-lime landing twinkle, and drift that locks once the word forms.
 * Scatter is staggered too (dissolve-out, not blob-out). "BEATROX" is
 * sampled once during init (font race finishes inside beat 0), so
 * morphTo() only starts the clock — a deterministic beat start.
 *
 * Perf: O(COUNT) per frame, all arrays preallocated, no per-frame allocs.
 */

export interface IntroParticlesHandle {
  /** Start the staggered assembly into the pre-sampled text. */
  morphTo(text?: string): void
  /**
   * Staggered dissolve back out into a loose drift. Default flavor blows
   * targets to random wide positions (card 1). `{ radial: true }` projects
   * targets outward from screen center instead — an explosion whose travel
   * lines radiate, used for the card-3 burst (plan: keep whichever flavor
   * reads better in captured frames).
   */
  scatter(options?: { radial?: boolean }): void
  /** Part the field like a curtain for the hero match-frame. */
  part(): void
  /** Stop all motion immediately (user skipped to the dissolve). */
  skip(): void
  /** Kill the render loop and dispose geometry/material/renderer. */
  dispose(): void
}

export interface IntroParticlesOptions {
  /** Reduced particle count for mobile / low-core devices. */
  lowTier: boolean
}

const ICE = { r: 0xdf / 255, g: 0xe8 / 255, b: 0xff / 255 }
const ACCENT = { r: 0xc8 / 255, g: 0xff / 255, b: 0x00 / 255 }
const ACCENT_SHARE = 0.08
const TWINKLE_SHARE = 0.025
const TAU = Math.PI * 2

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3)
const easeInCubic = (p: number) => p * p * p

export async function initIntroParticles(
  canvas: HTMLCanvasElement,
  opts: IntroParticlesOptions
): Promise<IntroParticlesHandle> {
  const THREE = await import('three')

  // WebGL context creation can throw (or return null) on locked-down
  // browsers — let the caller catch and continue DOM-only.
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200)
  camera.position.z = 42

  const COUNT = opts.lowTier ? 3000 : 8000

  const positions = new Float32Array(COUNT * 3)
  const from = new Float32Array(COUNT * 3)
  const to = new Float32Array(COUNT * 3)
  const morphTargets = new Float32Array(COUNT * 3)
  const seeds = new Float32Array(COUNT)
  const delays = new Float32Array(COUNT)
  const durs = new Float32Array(COUNT)
  const colors = new Float32Array(COUNT * 3)
  const baseColors = new Float32Array(COUNT * 3)
  const twinkleAt = new Float32Array(COUNT)

  /** Visible frustum size at the z=0 plane. */
  const visible = () => {
    const h = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360)
    return { w: h * camera.aspect, h }
  }

  // ── Idle lattice: a jittered grid slightly wider than the viewport ────
  const buildIdle = () => {
    const { w, h } = visible()
    const aspect = w / h
    const cols = Math.ceil(Math.sqrt(COUNT * aspect))
    const rows = Math.ceil(COUNT / cols)
    for (let i = 0; i < COUNT; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const i3 = i * 3
      to[i3] = ((col + 0.5) / cols - 0.5) * w * 1.35 + (Math.random() - 0.5) * 0.7
      to[i3 + 1] = (0.5 - (row + 0.5) / rows) * h * 1.35 + (Math.random() - 0.5) * 0.7
      to[i3 + 2] = (Math.random() - 0.5) * 10
    }
  }

  for (let i = 0; i < COUNT; i++) {
    seeds[i] = Math.random()
    const i3 = i * 3
    const c = Math.random() < ACCENT_SHARE ? ACCENT : ICE
    colors[i3] = c.r
    colors[i3 + 1] = c.g
    colors[i3 + 2] = c.b
  }
  baseColors.set(colors)
  twinkleAt.fill(-1)
  buildIdle()
  from.set(to)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const material = new THREE.PointsMaterial({
    size: 0.16,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const points = new THREE.Points(geometry, material)
  scene.add(points)

  // ── Animation state ───────────────────────────────────────────────────
  // 'idle' and 'part' use the global progress scalar; 'morph' and
  // 'scatter' use per-particle staggered progress (delays/durs).
  let mode: 'idle' | 'morph' | 'scatter' | 'part' = 'idle'
  let animStart = 0
  const progress = { v: 1 } // global scalar (idle/part)
  const drift = { amp: 1 } // 1 = full breathing, ~0.36 = locked word
  let partTween: gsap.core.Tween | null = null
  let driftTween: gsap.core.Tween | null = null
  let morphReady = false
  let twinkleActive = false
  let twinkleUntil = 0

  const startTime = performance.now()
  const clock = () => (performance.now() - startTime) / 1000

  // ── Text sampling (runs ONCE at init — deterministic beat start) ──────
  /** Sample text pixels from an offscreen 2D canvas → world-space pairs. */
  const sampleTextPixels = async (text: string): Promise<Float32Array | null> => {
    try {
      await Promise.race([
        document.fonts?.load('700 200px "Space Grotesk"') ?? Promise.resolve(),
        new Promise((r) => setTimeout(r, 600)),
      ])
    } catch {
      /* fall back to a generic sans — shape still reads */
    }
    const cw = 1200
    const ch = 300
    const c = document.createElement('canvas')
    c.width = cw
    c.height = ch
    const ctx = c.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.fillStyle = '#fff'
    ctx.font = '700 190px "Space Grotesk", "Inter", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, cw / 2, ch / 2)
    const data = ctx.getImageData(0, 0, cw, ch).data

    const pts: number[] = []
    const step = 4
    for (let y = 0; y < ch; y += step) {
      for (let x = 0; x < cw; x += step) {
        if (data[(y * cw + x) * 4 + 3] > 128) pts.push(x, y)
      }
    }
    if (pts.length < 200) return null

    // Ink bounding box so the word centers regardless of glyphs.
    let minX = cw
    let maxX = 0
    let minY = ch
    let maxY = 0
    for (let i = 0; i < pts.length; i += 2) {
      if (pts[i] < minX) minX = pts[i]
      if (pts[i] > maxX) maxX = pts[i]
      if (pts[i + 1] < minY) minY = pts[i + 1]
      if (pts[i + 1] > maxY) maxY = pts[i + 1]
    }
    const { h } = visible()
    // Fit portrait viewports: the word's rendered width fraction is
    // 0.66 * min(1, aspect) / aspect — identical to the long-standing
    // desktop geometry (aspect >= 1 → 0.66/aspect), but caps portrait
    // screens at 66% width instead of overflowing (mobile showed "EATRO"
    // clipped at ~143% width).
    const scale = (h * 0.66 * Math.min(1, camera.aspect)) / Math.max(1, maxX - minX)
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2

    const out = new Float32Array(pts.length)
    for (let i = 0; i < pts.length; i += 2) {
      out[i] = (pts[i] - cx) * scale
      out[i + 1] = (cy - pts[i + 1]) * scale
    }
    return out
  }

  /**
   * Precompute morph targets + per-particle stagger.
   * Coherent assignment: sort particles by current x and ink pixels by x,
   * assign rank-to-rank (stratified, tiny jitter) — every particle travels
   * a short readable path. delay_i sweeps left-to-right across the word
   * (~0.45s span) plus seeded jitter; dur_i varies ±0.2s per particle.
   */
  const prepareMorph = async (text: string): Promise<boolean> => {
    const ink = await sampleTextPixels(text)
    if (!ink) return false
    const n = ink.length / 2

    const inkOrder = new Uint32Array(n)
    for (let k = 0; k < n; k++) inkOrder[k] = k
    inkOrder.sort((a, b) => ink[a * 2] - ink[b * 2])

    const pOrder = new Uint32Array(COUNT)
    for (let i = 0; i < COUNT; i++) pOrder[i] = i
    pOrder.sort((a, b) => to[a * 3] - to[b * 3])

    let minTX = Infinity
    let maxTX = -Infinity
    for (let rank = 0; rank < COUNT; rank++) {
      const i = pOrder[rank]
      const jitter = Math.floor((Math.random() - 0.5) * 8)
      const inkRank = Math.min(n - 1, Math.max(0, Math.floor((rank * n) / COUNT) + jitter))
      const k = inkOrder[inkRank]
      const i3 = i * 3
      morphTargets[i3] = ink[k * 2] + (Math.random() - 0.5) * 0.25
      morphTargets[i3 + 1] = ink[k * 2 + 1] + (Math.random() - 0.5) * 0.25
      morphTargets[i3 + 2] = (Math.random() - 0.5) * 2.4
      if (morphTargets[i3] < minTX) minTX = morphTargets[i3]
      if (morphTargets[i3] > maxTX) maxTX = morphTargets[i3]
    }

    const span = Math.max(1e-6, maxTX - minTX)
    for (let i = 0; i < COUNT; i++) {
      delays[i] = ((morphTargets[i * 3] - minTX) / span) * 0.45 + seeds[i] * 0.12
      durs[i] = 0.7 + seeds[(i * 7) % COUNT] * 0.4
    }
    return true
  }

  // Sampled during init — the font race has all of beat 0 to finish, so
  // beat 1 starts deterministically. If sampling fails, morphTo retries.
  // Set the real device aspect FIRST: resize() only runs after this, and
  // visible() feeds the morph-target scale (portrait overflow fix).
  camera.aspect =
    (canvas.clientWidth || window.innerWidth) / (canvas.clientHeight || window.innerHeight)
  camera.updateProjectionMatrix()
  morphReady = await prepareMorph('BEATROX')

  // ── Per-frame position blend ──────────────────────────────────────────
  const computePositions = (t: number) => {
    const dx = 0.22 * drift.amp
    const dy = 0.22 * drift.amp
    const dz = 0.35 * drift.amp
    const staggered = mode === 'morph' || mode === 'scatter'
    const ease = mode === 'scatter' ? easeInCubic : easeOutCubic
    const local = t - animStart
    const p = progress.v
    const twinkling = twinkleActive && mode === 'morph' && t < twinkleUntil
    let colorsDirty = false

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      const pi = staggered ? ease(clamp01((local - delays[i]) / durs[i])) : p
      const s = seeds[i] * TAU
      positions[i3] = from[i3] + (to[i3] - from[i3]) * pi + Math.sin(t * 0.55 + s) * dx
      positions[i3 + 1] = from[i3 + 1] + (to[i3 + 1] - from[i3 + 1]) * pi + Math.cos(t * 0.42 + s * 1.7) * dy
      positions[i3 + 2] = from[i3 + 2] + (to[i3 + 2] - from[i3 + 2]) * pi + Math.sin(t * 0.3 + s * 2.3) * dz

      // Landing twinkle: ~2.5% of particles flash acid-lime as they lock.
      if (twinkling) {
        const tw = twinkleAt[i]
        if (tw >= 0 && t >= tw) {
          const f = Math.exp(-(t - tw) * 4.5)
          colors[i3] = baseColors[i3] + (ACCENT.r * 1.3 - baseColors[i3]) * f
          colors[i3 + 1] = baseColors[i3 + 1] + (ACCENT.g - baseColors[i3 + 1]) * f
          colors[i3 + 2] = baseColors[i3 + 2] + (ACCENT.b - baseColors[i3 + 2]) * f
          colorsDirty = true
        }
      }
    }
    if (twinkleActive && t >= twinkleUntil) {
      // Twinkle window closed — restore exact base colors and stop paying.
      colors.set(baseColors)
      colorsDirty = true
      twinkleActive = false
    }
    geometry.attributes.position.needsUpdate = true
    if (colorsDirty) geometry.attributes.color.needsUpdate = true
  }

  /** Capture the currently rendered positions as the new motion origin. */
  const captureFrom = (t: number) => {
    computePositions(t)
    from.set(positions)
  }

  // ── Render loop + resize ──────────────────────────────────────────────
  let raf = 0
  let dead = false

  const tick = () => {
    if (dead) return
    computePositions(clock())
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)
  tick()

  // ── Public handle ─────────────────────────────────────────────────────
  return {
    morphTo(text = 'BEATROX') {
      if (dead) return
      const begin = () => {
        if (dead) return
        captureFrom(clock())
        to.set(morphTargets)
        const now = clock()
        animStart = now
        mode = 'morph'
        // Landing twinkle schedule: each chosen particle flashes as its own
        // staggered tween completes.
        let maxLand = 0
        for (let i = 0; i < COUNT; i++) {
          if (seeds[i] < TWINKLE_SHARE) {
            const land = now + delays[i] + durs[i]
            twinkleAt[i] = land
            if (land > maxLand) maxLand = land
          } else {
            twinkleAt[i] = -1
          }
        }
        twinkleUntil = maxLand + 0.8
        twinkleActive = maxLand > 0
        // Drift lock: breathing eases to ~36% as the word fully converges.
        driftTween?.kill()
        driftTween = gsap.to(drift, { amp: 0.36, duration: 1.0, ease: 'power2.out', delay: 1.05 })
      }
      if (morphReady) {
        begin()
      } else {
        // Sampling failed at init (font race lost) — one lazy retry.
        void prepareMorph(text).then((ok) => {
          if (ok) {
            morphReady = true
            begin()
          }
        })
      }
    },
    scatter(options) {
      if (dead) return
      captureFrom(clock())
      const { w, h } = visible()
      const radial = options?.radial === true
      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3
        if (radial) {
          // Radial burst: push each particle further out along its own
          // direction from screen center (+ jitter), so travel lines
          // radiate. Near-center particles get a random spoke.
          const x = from[i3]
          const y = from[i3 + 1]
          const len = Math.hypot(x, y)
          if (len > 0.5) {
            const extend = w * (0.22 + seeds[i] * 0.4)
            to[i3] = (x / len) * (len + extend) + (Math.random() - 0.5) * w * 0.18
            to[i3 + 1] = (y / len) * (len + extend) + (Math.random() - 0.5) * h * 0.18
          } else {
            const a = seeds[i] * TAU
            const r = w * (0.4 + seeds[(i * 7) % COUNT] * 0.35)
            to[i3] = Math.cos(a) * r
            to[i3 + 1] = Math.sin(a) * r * (h / w)
          }
          to[i3 + 2] = from[i3 + 2] * 1.8 + (Math.random() - 0.5) * 14
        } else {
          to[i3] = (Math.random() - 0.5) * w * 1.6
          to[i3 + 1] = (Math.random() - 0.5) * h * 1.6
          to[i3 + 2] = (Math.random() - 0.5) * 26
        }
        // Staggered dissolve-out: seeded jitter delays, accelerate away.
        delays[i] = seeds[(i * 13) % COUNT] * 0.3
        durs[i] = 0.55 + seeds[i] * 0.3
      }
      animStart = clock()
      mode = 'scatter'
      driftTween?.kill()
      driftTween = gsap.to(drift, { amp: 1, duration: 0.4, ease: 'power1.out' })
    },
    part() {
      if (dead) return
      captureFrom(clock())
      const { w } = visible()
      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3
        const side = to[i3] >= 0 ? 1 : -1
        to[i3] = side * (Math.abs(to[i3]) + w * (0.75 + seeds[i] * 0.5))
        to[i3 + 1] = to[i3 + 1] * 1.15
      }
      mode = 'part'
      progress.v = 0
      partTween?.kill()
      partTween = gsap.to(progress, { v: 1, duration: 1.0, ease: 'power3.in' })
    },
    skip() {
      partTween?.kill()
      progress.v = 1
      driftTween?.kill()
      drift.amp = 1
      if (mode === 'morph' || mode === 'scatter') {
        animStart = -1000 // every per-particle progress is instantly 1
        mode = 'idle'
      }
      twinkleActive = false
      colors.set(baseColors)
      geometry.attributes.color.needsUpdate = true
    },
    dispose() {
      if (dead) return
      dead = true
      cancelAnimationFrame(raf)
      partTween?.kill()
      driftTween?.kill()
      window.removeEventListener('resize', resize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      // Release the GL context promptly so route changes never leak it.
      renderer.forceContextLoss()
    },
  }
}

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
 * tier) that idles as a breathing dot lattice (beat 0), converges into
 * "BEATROX" sampled from offscreen-canvas text pixels (beat 1), scatters
 * for the montage (beat 2), and parts like a curtain for the hero
 * match-frame (beat 3). ~8% of particles use the acid-lime accent; the
 * rest are ice-white on black.
 */

export interface IntroParticlesHandle {
  /** Converge the field into sampled text pixels (default "BEATROX"). */
  morphTo(text?: string): void
  /** Blow the formation back out into a loose drift. */
  scatter(): void
  /** Part the field like a curtain for the hero match-frame. */
  part(): void
  /** Stop all tweens immediately (user skipped to the dissolve). */
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
const TAU = Math.PI * 2

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
  const seeds = new Float32Array(COUNT)
  const colors = new Float32Array(COUNT * 3)

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

  // ── Morph machinery: lerp from → to on a GSAP-tweened progress ───────
  const progress = { v: 1 }
  let morphTween: gsap.core.Tween | null = null

  /** Capture the currently rendered positions as the new morph origin. */
  const captureFrom = (t: number) => {
    computePositions(t)
    from.set(positions)
  }

  const retarget = (duration: number, ease = 'power3.inOut') => {
    captureFrom(performance.now() / 1000)
    progress.v = 0
    morphTween?.kill()
    morphTween = gsap.to(progress, { v: 1, duration, ease })
  }

  /** Sample text pixels from an offscreen 2D canvas into world targets. */
  const sampleText = async (text: string) => {
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
    if (!ctx) return false
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
    if (pts.length < 200) return false

    // Find the ink bounding box so the word centers regardless of glyphs.
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
    const { w } = visible()
    const scale = (w * 0.66) / Math.max(1, maxX - minX)
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2

    const n = pts.length / 2
    for (let i = 0; i < COUNT; i++) {
      const p = (Math.floor(Math.random() * n)) * 2
      const i3 = i * 3
      to[i3] = (pts[p] - cx) * scale + (Math.random() - 0.5) * 0.25
      to[i3 + 1] = (cy - pts[p + 1]) * scale + (Math.random() - 0.5) * 0.25
      to[i3 + 2] = (Math.random() - 0.5) * 2.4
    }
    return true
  }

  /** Per-frame position blend: from→to plus a breathing sine drift. */
  const computePositions = (t: number) => {
    const p = progress.v
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      const s = seeds[i] * TAU
      const driftX = Math.sin(t * 0.55 + s) * 0.22
      const driftY = Math.cos(t * 0.42 + s * 1.7) * 0.22
      const driftZ = Math.sin(t * 0.3 + s * 2.3) * 0.35
      positions[i3] = from[i3] + (to[i3] - from[i3]) * p + driftX
      positions[i3 + 1] = from[i3 + 1] + (to[i3 + 1] - from[i3 + 1]) * p + driftY
      positions[i3 + 2] = from[i3 + 2] + (to[i3 + 2] - from[i3 + 2]) * p + driftZ
    }
    geometry.attributes.position.needsUpdate = true
  }

  // ── Render loop + resize ──────────────────────────────────────────────
  let raf = 0
  let dead = false
  const startTime = performance.now()

  const tick = () => {
    if (dead) return
    computePositions((performance.now() - startTime) / 1000)
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
      void sampleText(text).then((ok) => {
        if (ok && !dead) retarget(1.05)
      })
    },
    scatter() {
      if (dead) return
      const { w, h } = visible()
      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3
        to[i3] = (Math.random() - 0.5) * w * 1.6
        to[i3 + 1] = (Math.random() - 0.5) * h * 1.6
        to[i3 + 2] = (Math.random() - 0.5) * 26
      }
      retarget(0.7, 'power3.out')
    },
    part() {
      if (dead) return
      const { w } = visible()
      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3
        const side = to[i3] >= 0 ? 1 : -1
        to[i3] = side * (Math.abs(to[i3]) + w * (0.75 + seeds[i] * 0.5))
        to[i3 + 1] = to[i3 + 1] * 1.15
      }
      retarget(1.0, 'power3.in')
    },
    skip() {
      morphTween?.kill()
      progress.v = 1
    },
    dispose() {
      if (dead) return
      dead = true
      cancelAnimationFrame(raf)
      morphTween?.kill()
      window.removeEventListener('resize', resize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      // Release the GL context promptly so route changes never leak it.
      renderer.forceContextLoss()
    },
  }
}

'use client'

import { useEffect, useRef } from 'react'
import { INTRO_COMPLETE_EVENT, shouldRunIntro } from '@/components/intro/intro-storage'

/**
 * LivingHeroImage — a lazy-loaded vanilla-three.js shader layer that sits
 * over the static home hero image and brings it to life:
 *
 *  1. X light-up — emissive ice-blue glow along the X truss's four arm
 *     segments (distance-field to uniform endpoints), with a slow breathing
 *     pulse plus a periodic chase sweep traveling center → tips.
 *  2. Galaxy swirl — vortex UV distortion with radial falloff over the
 *     top-left LED drape, plus a subtle per-pixel twinkle shimmer.
 *
 * Layering contract (see plans/living-hero):
 *  - The static `<Image priority>` in HeroMedia stays untouched (LCP/SEO/
 *    fallback). This component mounts a canvas ABOVE it and re-applies
 *    HeroMedia's two scrim gradients on top of the canvas, so frame 0 is
 *    pixel-identical to the static composite; the canvas fades in ~600ms.
 *  - First visit: animation starts only after `intro:complete`; repeat
 *    visits start on load.
 *  - prefers-reduced-motion or WebGL failure → the canvas never mounts.
 *  - Gated to one exact image URL — any other hero src renders nothing.
 *  - Same object-cover crop math as CSS, IntersectionObserver pause,
 *    DPR cap 2, full dispose on unmount (FluidImage precedent).
 */

/** Only this exact hero image gets the living treatment. */
const GATE_SRC = '/images/verified/home/IMG_3942-Crop-4692a045.jpg'

/** Hard cap on waiting for the intro (mirrors HomeHero). */
const INTRO_FALLBACK_MS = 10_000

const FADE_IN_S = 0.6

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D u_texture;
uniform float u_time;
uniform float u_fade;
uniform float u_imgAspect;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;

// X truss arm segments, aspect-corrected image space (x = u * aspect, y = v).
// Measured from IMG_3942-Crop: center (0.504, 0.320), tips NW (0.421, 0.179),
// NE (0.586, 0.179), SW (0.425, 0.440), SE (0.583, 0.434) — multiplied by
// aspect on x by the caller via u_imgAspect at runtime, so these are y-units.
const vec2 X_C  = vec2(0.504, 0.320);
const vec2 X_NW = vec2(0.421, 0.179);
const vec2 X_NE = vec2(0.586, 0.179);
const vec2 X_SW = vec2(0.425, 0.440);
const vec2 X_SE = vec2(0.583, 0.434);

// Galaxy vortex (normalized image uv, converted like the X points).
const vec2 GALAXY_C = vec2(0.17, 0.12);

// Ice-blue emissive.
const vec3 GLOW_COL = vec3(0.50, 0.78, 1.05);

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Distance to segment a→b; t gets the clamped 0..1 param along it.
float segDist(vec2 p, vec2 a, vec2 b, out float t) {
  vec2 ab = b - a;
  t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
  return length(p - (a + ab * t));
}

// Emissive contribution of one arm: tight core + soft halo, modulated by a
// breathing pulse and a chase band sweeping center (t=0) → tip (t=1).
float armGlow(float d, float t, float phase, float time) {
  float core = exp(-d * d / 0.00016);         // sigma ≈ 0.009 (y-units)
  float halo = 0.10 * exp(-d / 0.035);
  float breath = 0.60 + 0.40 * sin(time * 1.4 + phase);
  float sweep = fract(time / 6.0 + phase * 0.13) * 1.6 - 0.3;
  float chase = 1.4 * exp(-pow((t - sweep) * 6.0, 2.0));
  return (core + halo) * (breath + chase);
}

void main() {
  vec2 tuv = vUv * u_uvScale + u_uvOffset;

  // ── Galaxy swirl (vortex UV distortion, radial falloff) ────────────────
  // p is aspect-corrected image space with y measured TOP-DOWN (GL texture
  // v runs bottom-up, so flip here to match the measured region constants).
  vec2 p = vec2(tuv.x * u_imgAspect, 1.0 - tuv.y);
  vec2 gc = vec2(GALAXY_C.x * u_imgAspect, GALAXY_C.y);
  vec2 dp = p - gc;
  float r = length(dp);
  float fall = 1.0 - smoothstep(0.05, 0.42, r);
  float swirlFall = pow(fall, 1.5);
  // Gentle churn: two oscillating layers (~40s / ~120s periods, ±~18° max)
  // so the drape breathes without ever winding itself up.
  float rot = (0.22 * sin(u_time * 0.157) + 0.10 * sin(u_time * 0.052 + 2.0)) * swirlFall;
  float cs = cos(rot);
  float sn = sin(rot);
  vec2 sw = gc + mat2(cs, -sn, sn, cs) * dp * (1.0 + 0.015 * fall * sin(u_time * 0.3));
  vec2 suv = clamp(vec2(sw.x / u_imgAspect, 1.0 - sw.y), 0.0, 1.0);

  vec3 col = texture2D(u_texture, suv).rgb;

  // Twinkle shimmer, confined to the drape region (two noise octaves).
  float tw = vnoise(p * 26.0 + vec2(u_time * 1.3, -u_time * 0.9));
  tw = 0.65 * tw + 0.35 * vnoise(p * 61.0 - vec2(u_time * 2.1, u_time * 1.2));
  col *= 1.0 + u_fade * fall * 0.09 * (tw - 0.5);

  // ── X light-up ─────────────────────────────────────────────────────────
  vec2 xc = vec2(X_C.x * u_imgAspect, X_C.y);
  float t0; float t1; float t2; float t3;
  float d0 = segDist(p, xc, vec2(X_NW.x * u_imgAspect, X_NW.y), t0);
  float d1 = segDist(p, xc, vec2(X_NE.x * u_imgAspect, X_NE.y), t1);
  float d2 = segDist(p, xc, vec2(X_SW.x * u_imgAspect, X_SW.y), t2);
  float d3 = segDist(p, xc, vec2(X_SE.x * u_imgAspect, X_SE.y), t3);

  float glow = 0.0;
  glow += armGlow(d0, t0, 0.0, u_time);
  glow += armGlow(d1, t1, 1.7, u_time);
  glow += armGlow(d2, t2, 3.1, u_time);
  glow += armGlow(d3, t3, 4.6, u_time);
  // Hub where the arms cross.
  float dc = length(p - xc);
  glow += 0.25 * exp(-dc * dc / 0.001) * (0.6 + 0.4 * sin(u_time * 1.4));
  // Clamp so the hub (where all four arms overlap) never blows out.
  glow = min(glow, 1.2);

  col += GLOW_COL * glow * 0.55 * u_fade;

  gl_FragColor = vec4(col, 1.0);
}
`

export default function LivingHeroImage({ src }: { src: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (src !== GATE_SRC) return
    const wrap = wrapRef.current
    if (!wrap) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let disposed = false
    let disposeScene: (() => void) | null = null

    const start = async () => {
      const THREE = await import('three')
      if (disposed) return

      const width = wrap.clientWidth
      const height = wrap.clientHeight
      if (!width || !height) return

      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      // Pre-check context availability ourselves: constructing
      // THREE.WebGLRenderer without one makes three log a console error
      // before it throws — the static fallback must stay error-free.
      const probe = document.createElement('canvas')
      if (!probe.getContext('webgl2') && !probe.getContext('webgl')) return
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false })
      } catch {
        return // WebGL unavailable — static hero remains.
      }
      const dpr = Math.min(window.devicePixelRatio, 2)
      renderer.setPixelRatio(dpr)
      renderer.setSize(width, height)
      const canvas = renderer.domElement
      canvas.style.position = 'absolute'
      canvas.style.inset = '0'
      canvas.style.opacity = '0'
      canvas.style.transition = `opacity ${FADE_IN_S * 1000}ms ease`
      // Below the duplicated scrims, above the static image.
      wrap.prepend(canvas)

      // Reuse the already-decoded hero <img> from HeroMedia — i.e. the
      // Next-optimized bitmap actually on screen — instead of fetching the
      // raw file. That's what makes frame 0 pixel-identical to the static
      // composite rather than just visually close.
      const heroImg = wrap.closest('section')?.querySelector('img') ?? null
      if (heroImg && !heroImg.complete) {
        await heroImg.decode().catch(() => {})
      }
      if (disposed || !heroImg || !heroImg.naturalWidth) {
        renderer.dispose()
        canvas.remove()
        return
      }
      const natW = heroImg.naturalWidth
      const natH = heroImg.naturalHeight

      // GPU bilinear sampling of the (huge) source bitmap differs visibly
      // from the browser's high-quality object-cover downscale — thin LED
      // lines and speckle shift enough to break the frame-0-identical
      // contract. So pre-resize the bitmap to the cover scale through the
      // 2D canvas high-quality resampler (measured to match the compositor
      // far better than createImageBitmap resize); the shader then samples
      // it ~1:1 and the frozen frame matches the static render.
      const makeSource = async (
        bw: number,
        bh: number
      ): Promise<{ source: HTMLCanvasElement; width: number; height: number }> => {
        const scale = Math.max(bw / natW, bh / natH)
        const rw = Math.max(1, Math.round(natW * scale))
        const rh = Math.max(1, Math.round(natH * scale))
        const c = document.createElement('canvas')
        c.width = rw
        c.height = rh
        const c2d = c.getContext('2d')
        if (c2d) {
          c2d.imageSmoothingEnabled = true
          c2d.imageSmoothingQuality = 'high'
          c2d.drawImage(heroImg, 0, 0, rw, rh)
        }
        return { source: c, width: rw, height: rh }
      }

      const bw0 = Math.round(width * dpr)
      const bh0 = Math.round(height * dpr)
      const initial = await makeSource(bw0, bh0)
      if (disposed) {
        renderer.dispose()
        canvas.remove()
        return
      }
      const texture = new THREE.Texture(initial.source)
      texture.needsUpdate = true
      texture.minFilter = THREE.LinearFilter
      texture.colorSpace = THREE.SRGBColorSpace

      const uniforms = {
        u_texture: { value: texture },
        u_time: { value: 0 },
        u_fade: { value: 0 },
        u_imgAspect: { value: initial.width / initial.height },
        u_uvScale: { value: new THREE.Vector2(1, 1) },
        u_uvOffset: { value: new THREE.Vector2(0, 0) },
      }

      // object-fit: cover mapping (FluidImage precedent), in device pixels.
      const applyCover = (bw: number, bh: number) => {
        const imgAspect = uniforms.u_imgAspect.value
        const boxAspect = bw / bh
        if (boxAspect > imgAspect) {
          uniforms.u_uvScale.value.set(1, imgAspect / boxAspect)
          uniforms.u_uvOffset.value.set(0, (1 - imgAspect / boxAspect) / 2)
        } else {
          uniforms.u_uvScale.value.set(boxAspect / imgAspect, 1)
          uniforms.u_uvOffset.value.set((1 - boxAspect / imgAspect) / 2, 0)
        }
      }
      applyCover(bw0, bh0)

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1)
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms,
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
      scene.add(mesh)

      let raf = 0
      let onScreen = true
      const startTime = performance.now()
      const tick = () => {
        const t = (performance.now() - startTime) / 1000
        uniforms.u_time.value = t
        uniforms.u_fade.value = Math.min(t / FADE_IN_S, 1)
        renderer.render(scene, camera)
        raf = requestAnimationFrame(tick)
      }
      const play = () => {
        if (!raf && onScreen && !disposed) tick()
      }
      const pause = () => {
        cancelAnimationFrame(raf)
        raf = 0
      }

      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting
        if (onScreen) play()
        else pause()
      })
      io.observe(wrap)

      let texGen = 0
      const ro = new ResizeObserver(() => {
        const w = wrap.clientWidth
        const h = wrap.clientHeight
        if (!w || !h) return
        renderer.setSize(w, h)
        const bw = Math.round(w * dpr)
        const bh = Math.round(h * dpr)
        applyCover(bw, bh)
        // Rebuild the pre-resized source for the new size (generation
        // counter guards against out-of-order async completions).
        const gen = ++texGen
        void makeSource(bw, bh).then((next) => {
          if (disposed || gen !== texGen) return
          texture.image = next.source
          texture.needsUpdate = true
          uniforms.u_imgAspect.value = next.width / next.height
          applyCover(bw, bh)
        })
      })
      ro.observe(wrap)

      play()
      // Frame 0 rendered (pixel-identical to the static composite) → fade in.
      requestAnimationFrame(() => {
        canvas.style.opacity = '1'
      })

      disposeScene = () => {
        pause()
        io.disconnect()
        ro.disconnect()
        mesh.geometry.dispose()
        material.dispose()
        texture.dispose()
        renderer.dispose()
        canvas.remove()
      }
    }

    let removeWait: () => void = () => {}
    if (shouldRunIntro()) {
      // First visit: the intro overlay owns the screen until its dissolve
      // begins; start only then so the match-frame handoff stays seamless.
      const onComplete = () => {
        removeWait()
        void start()
      }
      window.addEventListener(INTRO_COMPLETE_EVENT, onComplete)
      const fallback = window.setTimeout(onComplete, INTRO_FALLBACK_MS)
      removeWait = () => {
        window.removeEventListener(INTRO_COMPLETE_EVENT, onComplete)
        window.clearTimeout(fallback)
      }
    } else {
      void start()
    }

    return () => {
      disposed = true
      removeWait()
      disposeScene?.()
    }
  }, [src])

  if (src !== GATE_SRC) return null

  return (
    <div ref={wrapRef} className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Same scrims HeroMedia applies over the static image, re-applied
          above the canvas so the composite (and its frame 0) matches the
          static render exactly. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,0,0,0.05),rgba(0,0,0,0.78)_58%,rgba(0,0,0,0.95)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/90" />
    </div>
  )
}

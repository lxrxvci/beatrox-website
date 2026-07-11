'use client'

import { useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'

const FRAGMENT_SHADER = /* glsl */ `
precision mediump float;
varying vec2 vUv;
uniform sampler2D u_texture;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_intensity;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;

// Ashima simplex noise 2D
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv * u_uvScale + u_uvOffset;

  // 1. Fluid distortion from simplex noise
  float noiseVal = snoise(uv * 3.0 + u_time * 0.3) * 0.008 * u_intensity;
  uv += noiseVal;

  // 2. Mouse-driven ripple
  float dist = distance(vUv, u_mouse);
  float ripple = sin(dist * 25.0 - u_time * 3.0) * 0.015 * u_intensity;
  ripple *= smoothstep(0.5, 0.0, dist);
  uv += ripple;

  // 3. RGB shift (chromatic aberration)
  float shift = 0.008 * u_intensity;
  float r = texture2D(u_texture, uv + vec2(shift, 0.0)).r;
  float g = texture2D(u_texture, uv).g;
  float b = texture2D(u_texture, uv - vec2(shift, 0.0)).b;

  gl_FragColor = vec4(r, g, b, u_intensity);
}
`

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

interface FluidImageProps {
  src: string
  alt: string
  sizes?: string
  className?: string
  priority?: boolean
}

/**
 * Image with a WebGL fluid-distortion hover effect (Three.js shader:
 * simplex-noise warp + cursor ripple + RGB shift). The canvas is created
 * lazily on first hover, overlays the plain image, and is torn down when
 * the effect fades out. Disabled on touch/small screens and for
 * reduced-motion users, who get the CSS fallback (.fluid-fallback).
 */
export default function FluidImage({ src, alt, sizes, className = '', priority }: FluidImageProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const live = useRef<{ dispose: () => void; uniforms: Record<string, { value: unknown }> } | null>(null)

  const handleEnter = useCallback(async () => {
    const wrap = wrapRef.current
    if (!wrap || live.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.innerWidth < 768) return

    const THREE = await import('three')
    if (!wrapRef.current || live.current) return // unmounted / raced

    const width = wrap.clientWidth
    const height = wrap.clientHeight
    if (!width || !height) return

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const canvas = renderer.domElement
    canvas.style.position = 'absolute'
    canvas.style.inset = '0'
    canvas.style.pointerEvents = 'none'
    wrap.appendChild(canvas)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1)

    const texture = await new THREE.TextureLoader().loadAsync(src)
    texture.colorSpace = THREE.SRGBColorSpace

    // object-fit: cover mapping
    const imgAspect = texture.image.width / texture.image.height
    const boxAspect = width / height
    const uvScale = { value: [1, 1] as [number, number] }
    const uvOffset = { value: [0, 0] as [number, number] }
    if (boxAspect > imgAspect) {
      uvScale.value = [1, imgAspect / boxAspect]
      uvOffset.value = [0, (1 - imgAspect / boxAspect) / 2]
    } else {
      uvScale.value = [boxAspect / imgAspect, 1]
      uvOffset.value = [(1 - boxAspect / imgAspect) / 2, 0]
    }

    const uniforms = {
      u_texture: { value: texture },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_time: { value: 0 },
      u_intensity: { value: 0 },
      u_uvScale: { value: new THREE.Vector2(...uvScale.value) },
      u_uvOffset: { value: new THREE.Vector2(...uvOffset.value) },
    }

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 16, 16), material)
    scene.add(mesh)

    let raf = 0
    const startTime = performance.now()
    const tick = () => {
      uniforms.u_time.value = (performance.now() - startTime) / 1000
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    const onMove = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect()
      uniforms.u_mouse.value.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height
      )
    }
    wrap.addEventListener('mousemove', onMove)

    live.current = {
      uniforms,
      dispose: () => {
        cancelAnimationFrame(raf)
        wrap.removeEventListener('mousemove', onMove)
        mesh.geometry.dispose()
        material.dispose()
        texture.dispose()
        renderer.dispose()
        canvas.remove()
      },
    }

    gsap.to(uniforms.u_intensity, { value: 1, duration: 0.6, ease: 'power2.out' })
  }, [src])

  const handleLeave = useCallback(() => {
    const current = live.current
    if (!current) return
    gsap.to(current.uniforms.u_intensity, {
      value: 0,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        current.dispose()
        live.current = null
      },
    })
  }, [])

  // Attach hover listeners to the interactive ancestor (card link/button)
  // so overlays on top of the image don't swallow the events.
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const target = wrap.closest<HTMLElement>('a, button, [data-fluid-target]') ?? wrap
    target.addEventListener('mouseenter', handleEnter)
    target.addEventListener('mouseleave', handleLeave)
    return () => {
      target.removeEventListener('mouseenter', handleEnter)
      target.removeEventListener('mouseleave', handleLeave)
      live.current?.dispose()
      live.current = null
    }
  }, [handleEnter, handleLeave])

  return (
    <div ref={wrapRef} className={`absolute inset-0 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover fluid-fallback"
      />
    </div>
  )
}

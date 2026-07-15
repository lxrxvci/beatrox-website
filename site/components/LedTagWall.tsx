'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './LedTagWall.module.css'

interface LedTag {
  slug: string
  label: string
  count?: number
}

interface LedTagWallProps {
  tags: LedTag[]
}

type Theme = 'festival' | 'cyber' | 'sunset' | 'ice'

const palettes: Record<Theme, string[][]> = {
  festival: [
    ['#c8ff00', '#00f0ff'],
    ['#00f0ff', '#c8ff00'],
    ['#c8ff00', '#ff2d95'],
    ['#ff2d95', '#c8ff00'],
    ['#00f0ff', '#ff2d95'],
    ['#ff2d95', '#00f0ff'],
  ],
  cyber: [
    ['#39ff14', '#00f0ff'],
    ['#00f0ff', '#39ff14'],
    ['#39ff14', '#0080ff'],
    ['#00f0ff', '#0080ff'],
    ['#0080ff', '#39ff14'],
    ['#00ffaa', '#00f0ff'],
  ],
  sunset: [
    ['#ff6b35', '#ff2d95'],
    ['#ff2d95', '#b829dd'],
    ['#ff6b35', '#ffe600'],
    ['#ffe600', '#ff6b35'],
    ['#ff2d95', '#ff6b35'],
    ['#b829dd', '#ff2d95'],
  ],
  ice: [
    ['#00f0ff', '#ffffff'],
    ['#ffffff', '#00f0ff'],
    ['#80e8ff', '#00f0ff'],
    ['#00f0ff', '#80e8ff'],
    ['#ffffff', '#80e8ff'],
    ['#b0f0ff', '#ffffff'],
  ],
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export default function LedTagWall({ tags }: LedTagWallProps) {
  const [theme, setTheme] = useState<Theme>('festival')
  const [entered, setEntered] = useState<Set<number>>(new Set())
  const [reducedMotion, setReducedMotion] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const particlesRef = useRef<Array<{
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    color: string
  }>>([])
  const dimsRef = useRef({ w: 0, h: 0 })
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const visibleRef = useRef(true)
  const glitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const currentPalette = palettes[theme]
  const themePrimary = currentPalette[0][0]
  const themeSecondary = currentPalette[0][1]

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Staggered entrance animation
  useEffect(() => {
    if (reducedMotion) {
      setEntered(new Set(tags.map((_, i) => i)))
      return
    }
    tags.forEach((_, i) => {
      const timer = setTimeout(() => {
        setEntered((prev) => new Set([...prev, i]))
      }, 80 + i * 35)
      return () => clearTimeout(timer)
    })
  }, [tags, reducedMotion])

  // Canvas particle system
  useEffect(() => {
    if (reducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      const w = rect?.width ?? window.innerWidth
      const h = rect?.height ?? window.innerHeight
      canvas.width = w
      canvas.height = h
      dimsRef.current = { w, h }
    }

    const isMobile = window.innerWidth < 768
    const particleCount = isMobile ? 30 : 70

    const initParticles = () => {
      particlesRef.current = []
      for (let i = 0; i < particleCount; i++) {
        const palette = currentPalette
        const colors = palette[Math.floor(Math.random() * palette.length)]
        particlesRef.current.push({
          x: Math.random() * dimsRef.current.w,
          y: Math.random() * dimsRef.current.h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
          color: colors[0],
        })
      }
    }

    resize()
    initParticles()
    window.addEventListener('resize', resize)

    const drawConnections = () => {
      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.hypot(dx, dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = currentPalette[0][0]
            ctx.globalAlpha = (1 - dist / 110) * 0.06
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      if (!visibleRef.current) {
        rafRef.current = requestAnimationFrame(animate)
        return
      }

      ctx.clearRect(0, 0, dimsRef.current.w, dimsRef.current.h)

      particlesRef.current.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > dimsRef.current.w) p.x = (p.x + dimsRef.current.w) % dimsRef.current.w
        if (p.y < 0 || p.y > dimsRef.current.h) p.y = (p.y + dimsRef.current.h) % dimsRef.current.h

        const dx = mouseRef.current.x - p.x
        const dy = mouseRef.current.y - p.y
        const dist = Math.hypot(dx, dy)
        if (dist < 180 && dist > 0) {
          p.x += (dx / dist) * 0.6
          p.y += (dy / dist) * 0.6
          p.opacity = Math.min(p.opacity + 0.015, 0.75)
        } else {
          p.opacity = Math.max(p.opacity - 0.004, 0.1)
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()
      })

      drawConnections()
      ctx.globalAlpha = 1

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [theme, reducedMotion, currentPalette])

  // Intersection observer: pause canvas when off-screen
  useEffect(() => {
    const section = sectionRef.current
    if (!section || reducedMotion) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting
      },
      { threshold: 0.05 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [reducedMotion])

  // Mouse tracking for glow + particle attraction
  useEffect(() => {
    if (reducedMotion) return
    const section = sectionRef.current
    if (!section) return

    const onMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      mouseRef.current = { x, y }
      section.style.setProperty('--mouse-x', `${e.clientX}px`)
      section.style.setProperty('--mouse-y', `${e.clientY}px`)
    }

    const onMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    section.addEventListener('mousemove', onMouseMove)
    section.addEventListener('mouseleave', onMouseLeave)
    return () => {
      section.removeEventListener('mousemove', onMouseMove)
      section.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [reducedMotion])

  // Random glitch + pulse
  useEffect(() => {
    if (reducedMotion) return
    const panels = sectionRef.current?.querySelectorAll(`.${styles.ledPanel}`)
    if (!panels || panels.length === 0) return

    const randomGlitch = () => {
      const panel = panels[Math.floor(Math.random() * panels.length)] as HTMLElement
      panel.classList.add(styles.glitching)
      setTimeout(() => panel.classList.remove(styles.glitching), 280)
      glitchTimeoutRef.current = setTimeout(randomGlitch, Math.random() * 4000 + 2500)
    }

    const randomPulse = () => {
      const panel = panels[Math.floor(Math.random() * panels.length)] as HTMLElement
      panel.classList.add(styles.pulsing)
      setTimeout(() => panel.classList.remove(styles.pulsing), 2000)
      pulseTimeoutRef.current = setTimeout(randomPulse, Math.random() * 700 + 250)
    }

    glitchTimeoutRef.current = setTimeout(randomGlitch, 3000)
    pulseTimeoutRef.current = setTimeout(randomPulse, 2000)

    return () => {
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current)
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
    }
  }, [tags, theme, reducedMotion])

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme)
  }, [])

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>, color: string) => {
    if (reducedMotion) return
    const panel = e.currentTarget
    const rect = panel.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const ripple = document.createElement('span')
    ripple.className = styles.ripple
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    ripple.style.width = ripple.style.height = '44px'
    ripple.style.marginLeft = ripple.style.marginTop = '-22px'
    ripple.style.setProperty('--ripple-color', color)
    panel.appendChild(ripple)
    setTimeout(() => ripple.remove(), 760)
  }, [reducedMotion])

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (reducedMotion) return
    const panel = e.currentTarget
    panel.classList.add(styles.glitching)
    setTimeout(() => panel.classList.remove(styles.glitching), 280)
  }, [reducedMotion])

  if (!tags.length) return null

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      style={{
        '--theme-primary': themePrimary,
        '--theme-secondary': themeSecondary,
      } as React.CSSProperties}
    >
      {!reducedMotion && (
        <>
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
          <div className={styles.gridOverlay} aria-hidden="true" />
          <div className={styles.scanlines} aria-hidden="true" />
          <div className={styles.vignette} aria-hidden="true" />
          <div className={styles.mouseGlow} aria-hidden="true" />
          <div className={`${styles.corner} ${styles.cornerTopLeft}`} aria-hidden="true" />
          <div className={`${styles.corner} ${styles.cornerTopRight}`} aria-hidden="true" />
          <div className={`${styles.corner} ${styles.cornerBottomLeft}`} aria-hidden="true" />
          <div className={`${styles.corner} ${styles.cornerBottomRight}`} aria-hidden="true" />
        </>
      )}

      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.headerLabel}>Interactive LED Wall</p>
          <h2 className={styles.title}>Project Tags</h2>
          <p className={styles.subtitle}>Touch the wall. Explore the work.</p>
          <div className={styles.titleUnderline} />
        </header>

        <div className={styles.modeControls} role="group" aria-label="LED wall color theme">
          {(['festival', 'cyber', 'sunset', 'ice'] as Theme[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleThemeChange(mode)}
              className={`${styles.modeBtn} ${theme === mode ? styles.modeBtnActive : ''}`}
              aria-pressed={theme === mode}
            >
              <span>{mode}</span>
            </button>
          ))}
        </div>

        <div className={styles.ledWall} role="list">
          {tags.map((tag, i) => {
            const colors = currentPalette[i % currentPalette.length]
            const rgb = hexToRgb(colors[0])
            return (
              <Link
                key={tag.slug}
                href={`/work/tag/${tag.slug}`}
                className={`${styles.ledPanel} ${entered.has(i) ? styles.entered : ''}`}
                style={{
                  '--panel-color-1': colors[0],
                  '--panel-color-2': colors[1],
                  '--panel-rgb': rgb,
                  transitionDelay: reducedMotion ? '0ms' : `${i * 30}ms`,
                } as React.CSSProperties}
                onMouseEnter={(e) => handleMouseEnter(e, colors[0])}
                onClick={handleClick}
                role="listitem"
              >
                <div className={styles.matrixDots} aria-hidden="true" />
                <span className={styles.panelText}>
                  {tag.label}
                  {typeof tag.count === 'number' && (
                    <span className={styles.panelCount}>
                      {tag.count} {tag.count === 1 ? 'project' : 'projects'}
                    </span>
                  )}
                </span>
              </Link>
            )
          })}
        </div>

        <footer className={styles.footer}>
          <span className={styles.footerBrand}>BEATROX</span> — Interactive Installation
        </footer>
      </div>
    </section>
  )
}

'use client'

import Link from 'next/link'
import { useRef, useCallback } from 'react'
import { gsap } from 'gsap'

interface MagneticButtonProps {
  href?: string
  type?: 'button' | 'submit'
  variant?: 'default' | 'accent'
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

/**
 * Button with a magnetic pull toward the cursor (within a 50px radius)
 * and a fill that expands from the cursor entry point (via --mx/--my
 * consumed by .btn-magnetic in globals.css).
 */
export default function MagneticButton({
  href,
  type = 'button',
  variant = 'default',
  className = '',
  children,
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement | null>(null)
  const quickTo = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null)

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rect = el.getBoundingClientRect()
    // Feed the fill origin
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)

    if (!quickTo.current) {
      quickTo.current = {
        x: gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' }),
      }
    }
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    quickTo.current.x(dx * 0.3)
    quickTo.current.y(dy * 0.3)
  }, [])

  const handleLeave = useCallback(() => {
    const el = ref.current
    if (!el || !quickTo.current) return
    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' })
  }, [])

  const classes = `btn-magnetic${variant === 'accent' ? ' btn-magnetic--accent' : ''}${className ? ` ${className}` : ''}`

  if (href) {
    return (
      <Link
        href={href}
        ref={ref as React.RefObject<HTMLAnchorElement>}
        className={classes}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      ref={ref as React.RefObject<HTMLButtonElement>}
      className={classes}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { NavigationLink } from '@/lib/fallbacks'
import MagneticButton from '@/components/MagneticButton'

interface Props {
  links: NavigationLink[]
}

function RollingLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`rolling-link text-xs font-semibold tracking-[0.18em] uppercase ${
        active ? 'text-white' : 'text-white/75'
      }`}
    >
      <span className="rolling-link__inner">
        <span className="rolling-link__layer">{label}</span>
        <span className="rolling-link__layer rolling-link__layer--bottom" aria-hidden="true">
          {label}
        </span>
      </span>
      {active && (
        <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[var(--accent)]" aria-hidden="true" />
      )}
    </Link>
  )
}

export default function NavClient({ links }: Props) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      // Hide on scroll down past 100px, reveal on scroll up
      if (y > 100 && y > lastY.current) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      lastY.current = y
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[transform,background-color,border-color] duration-[400ms] ease-[var(--ease-expo-out)] ${
        hidden && !open ? '-translate-y-full' : 'translate-y-0'
      } ${
        scrolled || open
          ? 'bg-[rgba(10,10,10,0.8)] backdrop-blur-[12px] border-b border-[var(--border)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white font-bold tracking-[0.22em] text-base uppercase hover:opacity-70 transition-opacity"
          aria-label="BEATROX — Home"
        >
          <Image
            src="/brand/beatrox-symbol.png"
            alt=""
            width={1870}
            height={1595}
            className="h-7 w-auto"
            priority
          />
          BEATROX
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return <RollingLink key={href} href={href} label={label} active={active} />
          })}
          <MagneticButton
            href="/book"
            variant="accent"
            className="!text-xs !tracking-[0.15em] !py-2.5 !px-5"
          >
            Book Now
          </MagneticButton>
        </nav>

        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <span className={`block w-6 h-px bg-white transition-transform duration-200 ${open ? 'translate-y-2.5 rotate-45' : ''}`} />
          <span className={`block w-6 h-px bg-white transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-px bg-white transition-transform duration-200 ${open ? '-translate-y-2.5 -rotate-45' : ''}`} />
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`md:hidden overflow-hidden border-t border-[var(--border)] transition-[max-height,opacity] duration-300 ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 border-transparent'
        }`}
      >
        <div className="bg-[rgba(10,10,10,0.95)] px-6 py-6 flex flex-col gap-5">
          {links.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-xs font-semibold tracking-[0.18em] uppercase text-white/80 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/book"
            className="btn-primary text-center text-xs tracking-[0.15em] uppercase py-2.5 px-5 mt-2"
          >
            Book Now
          </Link>
        </div>
      </div>
    </header>
  )
}

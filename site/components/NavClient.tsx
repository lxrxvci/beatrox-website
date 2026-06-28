'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { NavigationLink } from '@/lib/fallbacks'

interface Props {
  links: NavigationLink[]
}

export default function NavClient({ links }: Props) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || open ? 'bg-black/85 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
        <Link
          href="/"
          className="text-white font-bold tracking-[0.25em] text-sm uppercase hover:opacity-70 transition-opacity"
        >
          BEATROX
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`text-[0.7rem] font-semibold tracking-[0.2em] uppercase transition-colors ${
                  active ? 'text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-px bg-white transition-transform duration-200 ${open ? 'translate-y-2.5 rotate-45' : ''}`} />
          <span className={`block w-6 h-px bg-white transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-px bg-white transition-transform duration-200 ${open ? '-translate-y-2.5 -rotate-45' : ''}`} />
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden border-t border-white/10 transition-[max-height,opacity] duration-300 ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 border-transparent'
        }`}
      >
        <div className="bg-black/95 px-6 py-6 flex flex-col gap-5">
          {links.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-[0.7rem] font-semibold tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}

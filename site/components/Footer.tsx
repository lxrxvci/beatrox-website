import Link from 'next/link'
import Image from 'next/image'
import { getContact } from '@/lib/json-content'

export default function Footer() {
  const data = getContact()

  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Image
              src="/brand/beatrox-logo-white.png"
              alt="BEATROX"
              width={2412}
              height={2102}
              className="h-24 w-auto mb-5"
            />
            <p className="text-sm text-white/70 leading-relaxed">
              {data.address.street}<br />
              {data.address.city}, {data.address.state} {data.address.zip}
            </p>
            <a
              href={`mailto:${data.contact.email}`}
              className="text-sm text-[var(--accent)] hover:text-white transition-colors block mt-3"
            >
              {data.contact.email}
            </a>
            <a
              href={`tel:${data.contact.phone}`}
              className="text-sm text-white/70 hover:text-white transition-colors block mt-1"
            >
              {data.contact.phoneFormatted}
            </a>
          </div>

          {/* Nav */}
          <div className="flex flex-col gap-3">
            {[
              ['About', '/about'],
              ['Work', '/work'],
              ['Services', '/services'],
              ['Team', '/team'],
              ['Book', '/book'],
              ['Contact', '/contact'],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-semibold tracking-[0.14em] uppercase text-white/65 hover:text-[var(--accent)] transition-colors w-fit"
              >
                {label}
              </Link>
            ))}
            {/* Rentals lives on a separate SPA deployment — plain external anchor, no Next prefetch. */}
            <a
              href="https://app-ruby-pi-32.vercel.app/"
              className="text-sm font-semibold tracking-[0.14em] uppercase text-white/65 hover:text-[var(--accent)] transition-colors w-fit"
            >
              Rentals
            </a>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <a
              href={data.social.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold tracking-[0.14em] uppercase text-white/65 hover:text-[var(--accent)] transition-colors w-fit"
            >
              YouTube
            </a>
            <a
              href={data.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold tracking-[0.14em] uppercase text-white/65 hover:text-[var(--accent)] transition-colors w-fit"
            >
              Instagram
            </a>
          </div>
        </div>

        <div className="divider mb-6" />

        <p className="text-xs text-white/55 tracking-[0.16em] uppercase">
          © {new Date().getFullYear()} Beatrox LLC. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { getContact } from '@/lib/json-content'
import TrackedPhoneLink from '@/components/TrackedPhoneLink'
import TrackedRentalsLink from '@/components/TrackedRentalsLink'

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
            {/* Exact-case business name as plain text for NAP parity (name/address/phone).
                The logo above renders stylized; crawlers need the literal string. */}
            <p className="text-sm font-semibold text-white mb-2">Beatrox</p>
            {/* NAP must concatenate to the GBP address char-for-char:
                "1313 SE 3rd Ave, Portland, OR 97214" (OP-61). */}
            <p className="text-sm text-white leading-relaxed">
              {data.address.street},<br />
              {data.address.city}, {data.address.state} {data.address.zip}
            </p>
            <a
              href={`mailto:${data.contact.email}`}
              className="text-sm text-[var(--accent)] hover:text-white transition-colors block mt-3"
            >
              {data.contact.email}
            </a>
            <TrackedPhoneLink
              href={`tel:${data.contact.phone}`}
              linkLocation="footer"
              className="text-sm text-white hover:text-white transition-colors block mt-1"
            >
              {data.contact.phoneFormatted}
            </TrackedPhoneLink>
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
                className="text-sm font-semibold tracking-[0.14em] uppercase text-white hover:text-[var(--accent)] transition-colors w-fit"
              >
                {label}
              </Link>
            ))}
            {/* Rentals lives on a separate SPA deployment: plain external anchor, no Next prefetch. */}
            <TrackedRentalsLink
              href="https://rentals.beatrox.com/"
              linkLocation="footer"
              className="text-sm font-semibold tracking-[0.14em] uppercase text-white hover:text-[var(--accent)] transition-colors w-fit"
            >
              Rentals
            </TrackedRentalsLink>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <a
              href={data.social.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold tracking-[0.14em] uppercase text-white hover:text-[var(--accent)] transition-colors w-fit"
            >
              YouTube
            </a>
            <a
              href={data.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold tracking-[0.14em] uppercase text-white hover:text-[var(--accent)] transition-colors w-fit"
            >
              Instagram
            </a>
          </div>
        </div>

        <div className="divider mb-6" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-white tracking-[0.16em] uppercase">
            © {new Date().getFullYear()} Beatrox LLC. All rights reserved.
          </p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              ['Terms of Service', '/terms-and-conditions'],
              ['Privacy Policy', '/privacy'],
              ['SMS Terms', '/sms-terms'],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-xs tracking-[0.16em] uppercase text-white hover:text-[var(--accent)] transition-colors w-fit"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}

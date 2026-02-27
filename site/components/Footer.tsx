import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-white mb-3">BEATROX LLC</p>
            <p className="text-xs text-white/40 leading-relaxed">
              8625 NE Halsey St<br />
              Portland, OR 97220
            </p>
          </div>

          {/* Nav */}
          <div className="flex flex-col gap-3">
            {[
              ['About', '/about'],
              ['Work', '/work'],
              ['Services', '/services'],
              ['Team', '/team'],
              ['Contact', '/contact'],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40 hover:text-white transition-colors w-fit"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <a
              href="https://www.youtube.com/@beatrox"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40 hover:text-white transition-colors w-fit"
            >
              YouTube
            </a>
            <a
              href="https://www.instagram.com/beatrox/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40 hover:text-white transition-colors w-fit"
            >
              Instagram
            </a>
          </div>
        </div>

        <div className="divider mb-6" />

        <p className="text-[0.65rem] text-white/20 tracking-widest uppercase">
          © {new Date().getFullYear()} Beatrox LLC. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

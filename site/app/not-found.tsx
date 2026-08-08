import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Page Not Found',
}

// Root not-found: rendered for URLs that match no route. The (site) group
// layout (nav/footer) does not apply here, so this is a standalone page.
export default function RootNotFound() {
  return (
    <main className="min-h-screen flex items-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="hero w-full">
        <div className="max-w-[1120px] mx-auto">
          <p className="overline mb-4">404: Page Not Found</p>
          <h1 className="heading-xl max-w-3xl mb-6">This stage is dark.</h1>
          <p className="text-base text-white max-w-xl leading-relaxed mb-10">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="btn-primary">Back to Home</Link>
            <Link href="/work" className="btn-ghost">View Our Work</Link>
          </div>
        </div>
      </section>
    </main>
  )
}

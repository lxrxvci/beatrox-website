import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found',
}

export default function NotFound() {
  return (
    <section className="hero min-h-[70vh] flex items-center border-b border-white/10">
      <div className="max-w-[1120px] mx-auto w-full">
        <p className="overline mb-4">404 — Page Not Found</p>
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
  )
}

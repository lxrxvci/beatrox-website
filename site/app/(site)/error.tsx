'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="hero min-h-[70vh] flex items-center border-b border-white/10">
      <div className="max-w-[1120px] mx-auto w-full">
        <p className="overline mb-4">Something went wrong</p>
        <h1 className="heading-xl max-w-3xl mb-6">Technical difficulties.</h1>
        <p className="text-base text-white max-w-xl leading-relaxed mb-10">
          An unexpected error occurred while loading this page. Please try again.
        </p>
        <div className="flex flex-wrap gap-4">
          <button type="button" onClick={reset} className="btn-primary">Try Again</button>
          <Link href="/" className="btn-ghost">Back to Home</Link>
        </div>
      </div>
    </section>
  )
}

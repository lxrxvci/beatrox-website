import type { Metadata } from 'next'
import Link from 'next/link'
import { readManifest } from '@/lib/youtube/storage'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Videos',
    description: 'Video library sourced from the BEATROX YouTube channel manifest.',
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: 'Videos — BEATROX',
      description: 'Video library sourced from the BEATROX YouTube channel manifest.',
      images: ['/og-default.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Videos — BEATROX',
      description: 'Video library sourced from the BEATROX YouTube channel manifest.',
      images: ['/og-default.jpg'],
    },
    alternates: {
      canonical: '/videos',
    },
  }
}

export default function VideosPage() {
  const manifest = readManifest()

  return (
    <section className="section">
      <div className="max-w-[1100px] mx-auto">
        <header className="mb-12">
          <p className="heading-sm text-white/35 mb-3">Media</p>
          <h1 className="heading-lg mb-3">Videos</h1>
          <p className="text-sm text-white/55 max-w-2xl">
            Local manifest-backed video index with SEO-friendly pages and optional push-back metadata edits.
          </p>
        </header>

        {manifest.count === 0 ? (
          <p className="text-sm text-white/55">No videos in manifest yet. Run sync in the local admin.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {manifest.videos.map((video) => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="block border border-white/10 p-4 hover:bg-white/5 transition-colors"
              >
                <p className="heading-sm text-white/85 mb-1">{video.title}</p>
                <p className="text-xs text-white/45 mb-2">{video.privacyStatus}</p>
                <p className="text-xs text-white/60 line-clamp-3">{video.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-4">Want to see more?</h2>
          <p className="text-sm text-white/50 mb-8 leading-relaxed">
            Explore our full portfolio of experiential events, installations, and productions.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/work" className="btn-primary">View Our Work</Link>
            <Link href="/contact" className="btn-ghost">Get a Quote</Link>
          </div>
        </div>
      </section>
    </section>
  )
}

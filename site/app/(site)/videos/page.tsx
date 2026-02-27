import type { Metadata } from 'next'
import Link from 'next/link'
import { readManifest } from '@/lib/youtube/storage'

export const metadata: Metadata = {
  title: 'Videos',
  description: 'Video library sourced from the BEATROX YouTube channel manifest.',
  openGraph: {
    title: 'Videos — BEATROX',
    description: 'Video library sourced from the BEATROX YouTube channel manifest.',
    images: ['/og-default.jpg'],
  },
}

export default function VideosPage() {
  const manifest = readManifest()

  return (
    <section className="pt-28 pb-20 px-6 lg:px-10">
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
    </section>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { readManifest } from '@/lib/youtube/storage'

interface Props {
  params: Promise<{ videoId: string }>
}

function getVideo(videoId: string) {
  const manifest = readManifest()
  return manifest.videos.find((video) => video.id === videoId) || null
}

export async function generateStaticParams() {
  const manifest = readManifest()
  return manifest.videos.map((video) => ({ videoId: video.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { videoId } = await params
  const video = getVideo(videoId)
  if (!video) return {}

  return {
    title: video.seo.title,
    description: video.seo.description,
    alternates: {
      canonical: `/videos/${video.id}`,
    },
    robots: {
      index: !video.noindex,
      follow: true,
    },
    openGraph: {
      title: video.seo.title,
      description: video.seo.description,
      type: 'video.other',
      url: `/videos/${video.id}`,
      images: video.seo.ogImage ? [video.seo.ogImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: video.seo.title,
      description: video.seo.description,
      images: video.seo.ogImage ? [video.seo.ogImage] : [],
    },
  }
}

export default async function VideoDetailPage({ params }: Props) {
  const { videoId } = await params
  const video = getVideo(videoId)
  if (!video) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: Object.values(video.thumbnails)
      .map((item) => item.url)
      .filter(Boolean),
    uploadDate: video.publishedAt,
    duration: video.duration,
    embedUrl: video.embedUrl,
    contentUrl: video.url,
    potentialAction: {
      '@type': 'WatchAction',
      target: video.url,
    },
  }

  return (
    <section className="pt-28 pb-20 px-6 lg:px-10">
      <div className="max-w-[1000px] mx-auto space-y-6">
        <header>
          <p className="text-xs text-white/45 uppercase tracking-[0.14em] mb-2">{video.privacyStatus}</p>
          <h1 className="heading-lg mb-3">{video.title}</h1>
          <p className="text-sm text-white/60 whitespace-pre-line">{video.description}</p>
        </header>

        <div className="aspect-video border border-white/10 bg-black">
          <iframe
            src={video.embedUrl}
            title={video.title}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        <div className="text-xs text-white/45">
          <p>Published: {video.publishedAt || 'Unknown'}</p>
          <p>Duration: {video.duration || 'Unknown'}</p>
          <p>
            Source:{' '}
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white">
              Watch on YouTube
            </a>
          </p>
          {video.noindex && <p className="text-amber-300/80 mt-2">This page is marked noindex in your local override.</p>}
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  )
}

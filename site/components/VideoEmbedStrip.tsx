import type { VideoEmbed } from '@/lib/json-content'
import VideoPlayer from '@/components/VideoPlayer'
import VideoPosterCard from '@/components/VideoPosterCard'

interface VideoEmbedStripProps {
  title: string
  videos: VideoEmbed[]
}

/** Direct playable file (mp4/webm/mov) vs. external embed (YouTube etc.). */
function directFile(video: VideoEmbed): string | null {
  const url = video.url || ''
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) ? url : null
}

/** YouTube video ID from an embed URL (/embed/<id>) or watch/share URL. */
function youtubeId(video: VideoEmbed): string | null {
  for (const src of [video.embedUrl ?? '', video.url ?? '']) {
    const match = /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{6,})/.exec(src)
    if (match) return match[1]
  }
  return null
}

export default function VideoEmbedStrip({ title, videos }: VideoEmbedStripProps) {
  if (!videos.length) return null

  // Seeded data often reuses one title (e.g. "Projekt X Deck Link") for
  // several distinct embeds — suffix duplicates with an index so each card
  // gets a distinguishable label; missing titles fall back to "Video N".
  const titleCounts = new Map<string, number>()
  videos.forEach((video) => {
    const key = video.title?.trim() || ''
    titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1)
  })
  const seenCounts = new Map<string, number>()
  const labelFor = (video: VideoEmbed, index: number): string => {
    const base = video.title?.trim()
    if (!base) return `Video ${index + 1}`
    if ((titleCounts.get(base) ?? 0) > 1) {
      const n = (seenCounts.get(base) ?? 0) + 1
      seenCounts.set(base, n)
      return `${base} ${n}`
    }
    return base
  }

  return (
    <section className="section border-t border-white/10">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="heading-sm text-white/75 mb-8">{title}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {videos.map((video, index) => {
            const file = directFile(video)
            const label = labelFor(video, index)
            const ytId = file ? null : youtubeId(video)
            return (
              <article key={`${video.provider}-${video.url || index}`}>
                {file ? (
                  <VideoPlayer src={file} title={label} />
                ) : (
                  <div className="corner-ticks border border-white/10 bg-black/70 backdrop-blur-sm">
                    {ytId && video.embedUrl ? (
                      <VideoPosterCard embedUrl={video.embedUrl} videoId={ytId} label={label} />
                    ) : (
                      <div className="aspect-video w-full bg-black">
                        {video.embedUrl ? (
                          <iframe
                            src={video.embedUrl}
                            title={label}
                            className="h-full w-full"
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-center px-6">
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm uppercase tracking-[0.16em] text-white/80 hover:text-white transition-colors"
                            >
                              Open video source
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-5 sm:p-6">
                      <p className="heading-sm text-white mb-2">{label}</p>
                      <p className="mono text-white/60">{video.provider.toUpperCase()}</p>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

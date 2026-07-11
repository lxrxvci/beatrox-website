import type { VideoEmbed } from '@/lib/json-content'

interface VideoEmbedStripProps {
  title: string
  videos: VideoEmbed[]
}

export default function VideoEmbedStrip({ title, videos }: VideoEmbedStripProps) {
  if (!videos.length) return null

  return (
    <section className="section border-t border-white/10">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="heading-sm text-white/75 mb-8">{title}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {videos.map((video) => (
            <article key={`${video.provider}-${video.title}`} className="border border-white/10 bg-black/70 backdrop-blur-sm">
              <div className="aspect-video w-full bg-black">
                {video.embedUrl ? (
                  <iframe
                    src={video.embedUrl}
                    title={video.title}
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
              <div className="p-5 sm:p-6">
                <p className="heading-sm text-white mb-2">{video.title}</p>
                <p className="text-sm text-white/60">{video.provider.toUpperCase()}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

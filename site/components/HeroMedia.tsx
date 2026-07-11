import Image from 'next/image'

interface VideoSource {
  src: string
  type: string
}

interface HeroMediaProps {
  imageSrc: string
  imageAlt: string
  videoSrc?: string
  /** Multi-format sources, e.g. AV1 webm + HEVC mp4 + H.264 fallback. */
  videoSources?: VideoSource[]
}

export default function HeroMedia({ imageSrc, imageAlt, videoSrc, videoSources }: HeroMediaProps) {
  const sources = videoSources ?? (videoSrc ? [{ src: videoSrc, type: 'video/mp4' }] : [])

  return (
    <div className="absolute inset-0">
      {sources.length > 0 ? (
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={imageSrc}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      ) : (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,0,0,0.05),rgba(0,0,0,0.78)_58%,rgba(0,0,0,0.95)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/90" />
    </div>
  )
}

import Image from 'next/image'

interface HeroMediaProps {
  imageSrc: string
  imageAlt: string
  videoSrc?: string
}

export default function HeroMedia({ imageSrc, imageAlt, videoSrc }: HeroMediaProps) {
  return (
    <div className="absolute inset-0">
      {videoSrc ? (
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={imageSrc}
        >
          <source src={videoSrc} type="video/mp4" />
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

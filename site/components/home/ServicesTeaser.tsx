import Image from 'next/image'
import Link from 'next/link'
import { getAllServicesResolved } from '@/lib/content'
import { truncateAtWord } from '@/lib/text'
import ScrollPanel from './ScrollPanel'

const PREFERRED_SLUGS = [
  '/services/event-production',
  '/services/drone-light-shows',
  '/services/led-video-wall-rentals',
  '/services/custom-fabrication',
]

export default async function ServicesTeaser() {
  const services = await getAllServicesResolved()

  const preferred = PREFERRED_SLUGS.map((slug) => services.find((s) => s.slug === slug)).filter(
    (s): s is (typeof services)[number] => Boolean(s && s.media?.heroImage),
  )
  const rest = services.filter((s) => s.media?.heroImage && !preferred.includes(s))
  const featured = [...preferred, ...rest].slice(0, 4)

  return (
    <ScrollPanel id="services" variant="rise" className="border-t border-white/10 bg-[var(--bg-primary)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="overline mb-4">Services</p>
          <h2 className="heading-lg">Full-spectrum production</h2>
        </div>
        <Link
          href="/services"
          className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white"
        >
          All Services →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {featured.map((service) => (
          <Link
            key={service.slug}
            href={service.slug}
            className="group relative block overflow-hidden border border-white/10 bg-neutral-950"
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={service.media!.heroImage!}
                alt={service.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/25" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
              <h3 className="heading-md mb-2 text-white">{service.title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-white/70">
                {truncateAtWord(service.hero.subheadline)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </ScrollPanel>
  )
}

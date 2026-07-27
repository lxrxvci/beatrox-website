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
          className="text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:text-white"
        >
          All Services →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {featured.map((service) => (
          <Link
            key={service.slug}
            href={service.slug}
            className="group block border border-white/10 bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-[rgba(var(--accent-rgb),0.65)] hover:shadow-[0_0_18px_rgba(var(--accent-rgb),0.3)]"
          >
            <div className="relative aspect-[16/10] bg-black overflow-hidden">
              <span className="hud-corners" aria-hidden="true" />
              <Image
                src={service.media!.heroImage!}
                alt={service.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-110"
              />
            </div>
            <div className="p-5 md:p-6">
              <h3 className="heading-md mb-2 text-white">{service.title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-white">
                {truncateAtWord(service.hero.subheadline)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </ScrollPanel>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'

export interface Capability {
  label: string
  href: string
  image: string
}

const DEFAULT_CAPABILITIES: Capability[] = [
  {
    label: 'Custom Fabrication',
    href: '/work/projekt-x',
    image: '/images/capabilities/custom-fabrication.jpg',
  },
  {
    label: 'LED Video Wall',
    href: '/services/led-video-wall-rentals',
    image: '/images/capabilities/led-video-wall.jpg',
  },
  {
    label: 'Drone Light Shows',
    href: '/services/drone-light-shows',
    image: '/images/capabilities/drone-light-shows.png',
  },
  {
    label: 'Stage Design',
    href: '/work/create-our-future',
    image: '/images/capabilities/stage-design.jpg',
  },
  {
    label: 'Experiential Events',
    href: '/work/aku-world',
    image: '/images/capabilities/experiential-events.jpg',
  },
  {
    label: 'Event Production',
    href: '/work/run-for-the-oceans',
    image: '/images/capabilities/event-production.jpg',
  },
  {
    label: 'Immersive Environments',
    href: '/work/myshelter',
    image: '/images/capabilities/immersive-environments.jpeg',
  },
  {
    label: 'Laser Light Shows',
    href: '/services/laser-shows',
    image: '/images/capabilities/laser-light-shows.jpg',
  },
  {
    label: 'Multimedia Displays',
    href: '/work/flir',
    image: '/images/capabilities/multimedia-displays.jpg',
  },
  {
    label: 'DJ Equipment Rentals',
    href: '/services/dj-equipment-rentals',
    image: '/images/capabilities/dj-equipment-rentals.jpg',
  },
  {
    label: 'Audio Production',
    href: '/services/sound-equipment-rentals',
    image: '/images/capabilities/audio-production.jpg',
  },
  {
    label: 'Projection Mapping',
    href: '/work/super-bowl-2020',
    image: '/images/capabilities/projection-mapping.jpg',
  },
]

const CAPABILITY_BY_LABEL = new Map(DEFAULT_CAPABILITIES.map((c) => [c.label, c]))

interface CapabilitiesGridProps {
  /** Optional capability labels to render. Each label is mapped to the old site's image + link. */
  items?: Array<{ label: string }>
}

export default function CapabilitiesGrid({ items }: CapabilitiesGridProps) {
  const capabilities = items
    ? items.map((item) => CAPABILITY_BY_LABEL.get(item.label)).filter(Boolean) as Capability[]
    : DEFAULT_CAPABILITIES

  if (capabilities.length === 0) return null

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-[1.3vw]"
      style={{ width: 'auto' }}
    >
      {capabilities.map((cap) => (
        <Link
          key={cap.label}
          href={cap.href}
          className="group relative block aspect-video overflow-hidden bg-neutral-900"
          aria-label={cap.label}
        >
          <Image
            src={cap.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-center text-white transition-colors duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:bg-black/50"
            aria-hidden="true"
          >
            <span className="text-[clamp(1.25rem,2vw,1.75rem)] font-semibold leading-tight">
              {cap.label}
            </span>
          </span>
        </Link>
      ))}
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { getServicesIndex } from '@/lib/json-content'
import { getAllServicesResolved, getCapabilityTiles, getMediaLibrary } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import ParallaxHero from '@/components/ParallaxHero'
import CapabilitiesGrid from '@/components/CapabilitiesGrid'
import RevealOnScroll from '@/components/RevealOnScroll'
import { EditableGalleryGrid } from '@/components/admin'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return seoToMetadata(getServicesIndex().seo, '/services')
}

// Full text-link catalog of the 15 service pages — the 12 capability-tile
// services plus the three rental pages (backline, lighting, sound) that the
// tile grid doesn't link. Each blurb carries the service's core keyword.
const SERVICE_LINK_GROUPS: Array<{
  label: string
  items: Array<{ label: string; slug: string; blurb: string }>
}> = [
  {
    label: 'Production & Experiences',
    items: [
      {
        label: 'Full-Service Event Production',
        slug: 'event-production',
        blurb: 'Full-service event production from a Portland event production company — concept to final strike under one roof.',
      },
      {
        label: 'Experiential Events',
        slug: 'experiential-events',
        blurb: 'Experiential marketing agency services — immersive brand activations people line up to share.',
      },
      {
        label: 'Stage Design',
        slug: 'stage-design',
        blurb: 'Stage design company for concerts, conferences, and brand events — designed, engineered, and built in-house.',
      },
      {
        label: 'Immersive Environments',
        slug: 'immersive-environments',
        blurb: 'Immersive environments that transform rooms into living worlds with projection, audio, LED, and interaction.',
      },
    ],
  },
  {
    label: 'Visual & Media',
    items: [
      {
        label: 'LED Video Wall Rentals',
        slug: 'led-video-wall-rentals',
        blurb: 'LED video wall rental in Portland — fine-pitch to festival-scale panels with on-site technician support.',
      },
      {
        label: 'Projection Mapping',
        slug: 'projection-mapping',
        blurb: 'Projection mapping in Portland and beyond — architecture turned into cinema, calibrated to the millimeter.',
      },
      {
        label: 'Multimedia Displays',
        slug: 'multimedia-displays',
        blurb: 'Multimedia displays — LED walls, kiosks, and interactive screens designed and integrated as systems.',
      },
      {
        label: 'Custom Fabrication',
        slug: 'custom-fabrication',
        blurb: 'Custom fabrication in Portland — one-of-a-kind structures and scenic elements built in our own shop.',
      },
    ],
  },
  {
    label: 'Audio & Rentals',
    items: [
      {
        label: 'Audio Production',
        slug: 'audio-production',
        blurb: 'Audio production services — FOH and monitor engineering, RF coordination, and system tuning by touring-grade engineers.',
      },
      {
        label: 'Sound Equipment Rentals',
        slug: 'sound-equipment-rentals',
        blurb: 'Sound equipment rentals in Portland — PA systems, consoles, and monitoring with experienced engineers.',
      },
      {
        label: 'DJ Equipment Rentals',
        slug: 'dj-equipment-rentals',
        blurb: 'DJ equipment rental in Portland — Pioneer CDJs, mixers, and full booth packages with on-site support.',
      },
      {
        label: 'Backline & Stage Rental',
        slug: 'backline-stage-rental',
        blurb: 'Backline and stage rental in Portland — drum kits, amplifiers, and full stage packages backed by touring crew.',
      },
    ],
  },
  {
    label: 'Specialty & Lighting',
    items: [
      {
        label: 'Drone Light Shows',
        slug: 'drone-light-shows',
        blurb: 'Drone light shows — custom choreographed formations with full FAA compliance and operational support.',
      },
      {
        label: 'Laser Light Shows',
        slug: 'laser-shows',
        blurb: 'Laser light shows — professional beam choreography, sky scanning, and laser mapping for any scale.',
      },
      {
        label: 'Lighting Services',
        slug: 'lighting-services',
        blurb: 'Event lighting services in Portland — design, integration, programming, and live operation from one team.',
      },
    ],
  },
]

export default async function ServicesPage() {
  const services = await getAllServicesResolved()
  const servicesHero = services[0]?.media?.heroImage || '/og-default.jpg'

  // Tiles come from the capability-tiles global — inline-editable right on
  // this page (image, link, text placement, order). Empty global → curated
  // defaults from lib/capabilities.
  const [tiles, mediaLibrary] = await Promise.all([getCapabilityTiles(), getMediaLibrary()])
  const tileItems = tiles.length > 0 ? tiles : undefined

  // ItemList schema for the 15 service detail pages (matches the link catalog below)
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Beatrox Services',
    itemListElement: SERVICE_LINK_GROUPS.flatMap((group) => group.items).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      url: `https://www.beatrox.com/services/${item.slug}`,
    })),
  }

  return (
    <>
      <ParallaxHero
        imageSrc={servicesHero}
        imageAlt="Services hero media"
        eyebrow="What We Offer"
        title="What We Do"
        description="Full-spectrum experiential production. From the first sketch to the final strike."
        minHeightClass="min-h-[94svh]"
      />

      {/* Intro — crawlable positioning copy: who we are, what the services
          cover, who we serve, and where we work */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-3xl">
            <h2 className="heading-lg mb-8">
              A Full-Service Event Production Company in <span className="text-[var(--accent)]">Portland, Oregon</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 text-base text-white leading-relaxed">
            <div className="space-y-6">
              <p>
                Beatrox is a full-service event production company headquartered in Portland, Oregon, and
                deployed nationwide. Our designers, engineers, fabricators, and technical directors bring
                over 20 years of combined experience turning ambitious ideas into physical experiences —
                for agencies, brands, and venues that need one partner accountable from the first sketch
                to the final strike. What makes the model work is range: the creative studio, the
                fabrication shop, the AV inventory, and the production office all sit under one roof.
                From intimate brand activations to festival main stages and permanent installations, the
                through-line is the same — experiences engineered to be unforgettable and built to run
                flawlessly.
              </p>
              <p>
                Our services span the entire life of an event. Full-service event production and
                experiential events cover strategy, planning, and execution end to end. Stage design and
                custom fabrication turn concepts into structures. Immersive environments, projection
                mapping, and multimedia displays put the story on every surface. LED video wall rentals,
                audio production, DJ equipment rentals, drone light shows, and laser light shows deliver
                the spectacle — engineered, permitted, and operated by the same team that designed it.
                Specialty services round out the roster: event lighting services, sound equipment
                rentals, and backline and stage rental for touring productions.
              </p>
            </div>
            <div className="space-y-6">
              <p>
                As an experiential marketing agency, we build the moments brands can't buy with media:
                activations people line up for, launch environments that become the story, festival
                footprints fans choose over the main stage. Agencies bring us in when the idea outruns
                their in-house resources. Brands come directly when they want one accountable partner
                instead of five vendors. Venues trust us with the permitting, engineering, and safety
                documentation that ambitious public work demands. Our productions have carried global
                brands through product launches, world tours, Comic-Con exhibitions, and landmark
                projections — work where there is no second take.
              </p>
              <p>
                Every service is delivered from our Portland headquarters and travels — from Oregon
                Convention Center ballrooms to the Empire State Building. Every engagement starts with a
                conversation, not a quote sheet: we scope the idea, flag the risks, and price the
                reality. Explore the services below, or book a discovery call and tell us what you're
                trying to build.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities image grid (swapped from the About page — title stays here) */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="heading-lg mb-10">Our Services</h2>
          <RevealOnScroll>
          <EditableGalleryGrid
            globalSlug="capability-tiles"
            fieldPath="items"
            items={tileItems ?? []}
            mediaLibrary={mediaLibrary}
          >
            <CapabilitiesGrid items={tileItems} />
          </EditableGalleryGrid>
          </RevealOnScroll>
        </div>
      </section>

      {/* Full service catalog — every service page as a text link, including
          the rental pages the tile grid doesn't surface */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="heading-lg mb-10">Every Service, A to Z</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {SERVICE_LINK_GROUPS.map((group, groupIndex) => (
              <RevealOnScroll key={group.label} delayMs={groupIndex * 80}>
              <div>
                <h3 className="overline mb-6 pb-4 border-b border-white/10">{group.label}</h3>
                <ul className="space-y-5">
                  {group.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/services/${item.slug}`}
                        className="group flex items-baseline gap-2.5 text-sm text-white leading-relaxed hover:text-white transition-colors"
                      >
                        <span
                          aria-hidden="true"
                          className="hud-index opacity-40 md:opacity-0 md:-translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
                        >
                          ›
                        </span>
                        <span>{item.label}</span>
                      </Link>
                      <p className="mt-1 text-xs text-white leading-relaxed">{item.blurb}</p>
                    </li>
                  ))}
                </ul>
              </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      {/* Consultation CTA */}
      <section className="section text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="heading-lg mb-5">Book a <span className="text-[var(--accent)]">Consultation</span></h2>
          <p className="text-base text-white leading-relaxed mb-10">
            Our team of technical and creative directors can help you with your project.
            We specialize in bringing unique and bespoke ideas to life. We know that every project
            is different and we can tailor a custom solution that works for you and your budget.
            Book a discovery call and get professional advice today.
          </p>
          <Link href="/book" className="btn-primary btn-primary--accent">Book a Discovery Call</Link>
        </div>
      </section>
    </>
  )
}

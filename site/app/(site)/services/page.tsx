import type { Metadata } from 'next'
import Link from 'next/link'
import { getServicesIndex } from '@/lib/json-content'
import { getAllServicesResolved, getCapabilityTiles, getFeaturedProjectsResolved } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import { buildFaqSchema, type FaqItem } from '@/lib/schema'
import ParallaxHero from '@/components/ParallaxHero'
import CapabilitiesGrid from '@/components/CapabilitiesGrid'
import BentoWorkGrid from '@/components/BentoWorkGrid'
import JsonLd from '@/components/JsonLd'
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

// Audience strip — the "who we serve" claims, atomized so no paragraph
// on the page runs long (GPJ/4Wall separator pattern).
const AUDIENCES: Array<{ label: string; body: string }> = [
  {
    label: 'Agencies',
    body: 'Agencies bring us in when the idea outruns their in-house resources — white-label or side by side, we make the pitch buildable.',
  },
  {
    label: 'Brands',
    body: 'Brands come directly for one accountable partner instead of five vendors — product launches, world tours, Comic-Con exhibitions, landmark projections.',
  },
  {
    label: 'Venues',
    body: 'Venues trust us with the permitting, engineering, and safety documentation that ambitious public work demands.',
  },
]

// Same featured projects as the homepage teaser — proof break between the
// service listings.
const FEATURED_SLUGS = ['run-for-the-oceans', 'aku-world', 'projekt-x', 'myshelter']

// FAQ — question-form keywords live here instead of in intro paragraphs
// (Gradient pattern). Visible text + FAQPage JSON-LD below.
const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What does a full-service event production company do?',
    answer:
      'Everything between the idea and the applause: strategy, creative design, engineering, custom fabrication, AV and lighting, permitting, on-site operation, and strike. At Beatrox those disciplines sit under one roof in Portland — one accountable team instead of five vendors.',
  },
  {
    question: 'What is the difference between an experiential marketing agency and an event production company?',
    answer:
      'An experiential marketing agency designs the moment — the activation, launch environment, or installation people line up for. An event production company makes it physically real and keeps it running. Beatrox is both: the studio that conceives the experience and the shop that builds, permits, and operates it.',
  },
  {
    question: 'Do you work outside Portland, Oregon?',
    answer:
      'Yes. Every service is delivered from our Portland headquarters and travels nationwide — from Oregon Convention Center ballrooms to the Empire State Building. Our crew, inventory, and fabrication ship wherever the production demands.',
  },
  {
    question: 'Can I rent equipment without booking full production?',
    answer:
      'Yes. LED video wall rentals, sound equipment rentals, DJ equipment rentals, and backline and stage rental are all available standalone, with experienced technicians — the same touring-grade inventory that powers our full productions.',
  },
  {
    question: 'How far in advance should we start the conversation?',
    answer:
      'Earlier than you think. Ambitious public work needs permitting, engineering, and safety documentation, and those lead times are real. Bring us the idea while it is still a sketch — we will scope it, flag the risks, and price the reality.',
  },
]

export default async function ServicesPage({ preview = false }: { preview?: boolean }) {
  const services = await getAllServicesResolved(preview)
  const servicesHero = services[0]?.media?.heroImage || '/og-default.jpg'

  // Tiles come from the capability-tiles global — inline-editable right on
  // this page (image, link, text placement, order). Empty global → curated
  // defaults from lib/capabilities.
  const tiles = await getCapabilityTiles()
  const tileItems = tiles.length > 0 ? tiles : undefined

  // Featured work teaser (same source as the homepage WorkTeaser)
  const featuredProjects = await getFeaturedProjectsResolved(FEATURED_SLUGS)
  const projectsBySlug = new Map(featuredProjects.map((project) => [project.canonicalSlug, project]))
  const workProjects = FEATURED_SLUGS.map((slug) => projectsBySlug.get(slug))
    .filter((project): project is (typeof featuredProjects)[number] => Boolean(project))
    .map((project) => {
      const firstImage = project.images?.find((img) => img.url && img.url !== '')
      return {
        slug: project.canonicalSlug,
        title: project.title,
        client: project.metadata?.client,
        tags: project.hero?.tags,
        image: firstImage?.url || project.seo?.og?.image || '/og-default.jpg',
        alt: firstImage?.alt || project.title,
      }
    })

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

      {/* Intro — one compact keyword paragraph (GES/4Wall pattern); the rest
          of the SEO copy is distributed through the page: per-service blurbs
          in the A-to-Z catalog, the audience strip, and the FAQ below. */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-3xl">
            <h2 className="heading-lg mb-8">
              A Full-Service Event Production Company in <span className="text-[var(--accent)]">Portland, Oregon</span>
            </h2>
            <p className="text-base text-white leading-relaxed">
              Beatrox is a full-service event production company and experiential marketing agency —
              designers, engineers, fabricators, and technical directors under one roof, deployed
              nationwide from our Portland headquarters. For agencies, brands, and venues that need
              one accountable partner from the first sketch to the final strike.
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities image grid (swapped from the About page — title stays here) */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="heading-lg mb-4">Our Services</h2>
          <p className="text-base text-white/60 max-w-xl mb-10">
            Every capability under one roof. Tap any service to explore it in detail.
          </p>
          <RevealOnScroll>
          <EditableGalleryGrid
            globalSlug="capability-tiles"
            fieldPath="items"
            items={tileItems ?? []}
          >
            <CapabilitiesGrid items={tileItems} />
          </EditableGalleryGrid>
          </RevealOnScroll>
        </div>
      </section>

      {/* Audience strip — who we serve, atomized (replaces the old intro
          paragraphs; keeps the claims on-page in scannable form) */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <p className="overline mb-10">Who We Build For</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
            {AUDIENCES.map((audience, index) => (
              <RevealOnScroll key={audience.label} delayMs={index * 120}>
                <p className="font-mono text-xs text-[var(--accent)] mb-3">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="heading-sm text-white mb-4">{audience.label}</h3>
                <p className="text-base text-white leading-relaxed">{audience.body}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Selected work — proof break between the service listings */}
      {workProjects.length > 0 && (
        <section className="section border-b border-white/10">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
              <h2 className="heading-lg">Selected Work</h2>
              <Link
                href="/work"
                className="text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:text-[var(--accent)]"
              >
                View All Work →
              </Link>
            </div>
            <BentoWorkGrid projects={workProjects} textBelow />
          </div>
        </section>
      )}

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
                          className="hud-index text-[var(--accent)] opacity-70 md:opacity-0 md:-translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
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
      <JsonLd data={buildFaqSchema(FAQ_ITEMS)} />

      {/* FAQ — question-form keyword copy, visible text (Gradient pattern) */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="heading-lg mb-10">Questions, <span className="text-[var(--accent)]">Answered</span></h2>
          <div className="max-w-3xl divide-y divide-white/10">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="py-6 first:pt-0 last:pb-0">
                <h3 className="text-base font-semibold text-white mb-2 flex items-start gap-3">
                  <span aria-hidden="true" className="text-[var(--accent)] shrink-0">+</span>
                  {item.question}
                </h3>
                <p className="text-base text-white leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation CTA */}
      <section className="section text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="heading-lg mb-5">Book a <span className="text-[var(--accent)]">Consultation</span></h2>
          <p className="text-base text-white leading-relaxed mb-10">
            Portland-based, deployed nationwide — from Oregon Convention Center ballrooms to the
            Empire State Building. Tell us what you&apos;re trying to build and we&apos;ll scope the
            idea, flag the risks, and price the reality.
          </p>
          <Link href="/book" className="btn-primary btn-primary--accent">Book a Discovery Call</Link>
        </div>
      </section>
    </>
  )
}

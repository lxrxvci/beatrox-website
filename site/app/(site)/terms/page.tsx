import type { Metadata } from 'next'
import { seoToMetadata } from '@/lib/metadata'
import { buildBreadcrumbSchema } from '@/lib/schema'
import JsonLd from '@/components/JsonLd'
import KineticHeading from '@/components/KineticHeading'
import { termsSections } from './terms-content'

export function generateMetadata(): Metadata {
  return seoToMetadata(
    {
      title: 'Terms of Service | BEATROX',
      description:
        'The terms and conditions governing use of beatrox.com, rentals.beatrox.com, and Beatrox LLC online services, bookings, and rentals.',
      og: {
        title: 'Terms of Service | BEATROX',
        description:
          'The terms and conditions governing use of beatrox.com, rentals.beatrox.com, and Beatrox LLC online services, bookings, and rentals.',
        image: '/og-default.jpg',
      },
    },
    '/terms',
  )
}

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Terms of Service',
            url: 'https://www.beatrox.com/terms',
          },
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Terms of Service', path: '/terms' },
          ]),
        ]}
      />
      <section className="hero border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <p className="overline mb-4">Legal</p>
          <KineticHeading text="Terms of Service" className="heading-xl" />
          <p className="text-base text-white mt-6 max-w-xl leading-relaxed">
            Website Terms of Service &amp; Terms and Conditions
          </p>
          <p className="text-sm text-white/60 mt-3 tracking-[0.08em] uppercase">
            Effective Date: September 12, 2026 &middot; Last Updated: September 12, 2026
          </p>
        </div>
      </section>

      <section className="section">
        <div className="max-w-[980px] mx-auto">
          <div className="prose">
            {termsSections.map((section, i) => (
              <div key={section.heading ?? 'intro'}>
                {section.heading && <h2>{section.heading}</h2>}
                {section.paragraphs.map((paragraph, j) => (
                  <p key={`${i}-${j}`}>{paragraph}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

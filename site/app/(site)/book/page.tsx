import type { Metadata } from 'next'
import { getPayload } from 'payload'
import payloadConfig from '@/payload.config'
import { buildBreadcrumbSchema } from '@/lib/schema'
import JsonLd from '@/components/JsonLd'
import BookingForm from './BookingForm'
import KineticHeading from '@/components/KineticHeading'

export async function generateMetadata(): Promise<Metadata> {
  return {
    // Absolute: carries the brand, so bypass the layout's "| BEATROX" template.
    title: { absolute: 'Book a Consultation | BEATROX' },
    description: 'Schedule a free discovery call or site visit with the BEATROX team.',
    alternates: { canonical: '/book' },
  }
}

export default async function BookPage() {
  const payload = await getPayload({ config: payloadConfig })

  const typesRes = await payload.find({
    collection: 'consultation-types',
    where: { isEnabled: { equals: true } },
    sort: 'listOrder',
    limit: 100,
  })

  const types = typesRes.docs.map((doc) => ({
    id: String(doc.id),
    name: String(doc.name),
    slug: String(doc.slug),
    duration: typeof doc.duration === 'number' ? doc.duration : 30,
    description: typeof doc.description === 'string' ? doc.description : '',
    color: typeof doc.color === 'string' ? doc.color : '',
  }))

  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Book a Consultation',
            url: 'https://www.beatrox.com/book',
          },
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Book a Consultation', path: '/book' },
          ]),
        ]}
      />
      <section className="hero border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <p className="overline mb-4">Schedule</p>
          <KineticHeading text="Book a Consultation" className="heading-xl" />
          <p className="text-base text-white mt-6 max-w-xl leading-relaxed">
            Pick a time that works for you and our team will confirm it and send you a meeting link by email.
          </p>
        </div>
      </section>

      <section className="section border-b border-white/10 py-12 lg:py-20">
        <div className="max-w-[980px] mx-auto">
          <BookingForm types={types} />
        </div>
      </section>

      <section className="section border-t border-white/10 text-center py-12 lg:py-20">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-5">Prefer to send a message?</h2>
          <p className="text-base text-white mb-8 leading-relaxed">
            Use our contact form and a member of the team will get back to you within 1–2 business days.
          </p>
          <a href="/contact" className="btn-primary">Contact Us</a>
        </div>
      </section>
    </>
  )
}

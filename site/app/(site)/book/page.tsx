import type { Metadata } from 'next'
import { getPayload } from 'payload'
import payloadConfig from '@/payload.config'
import BookingForm from './BookingForm'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Book a Consultation — BEATROX',
    description: 'Schedule a free discovery call or site visit with the BEATROX team.',
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
      <section className="hero border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <p className="heading-sm text-white/80 mb-4">Schedule</p>
          <h1 className="heading-xl max-w-3xl">Book a Consultation</h1>
          <p className="text-base text-white/70 mt-6 max-w-xl leading-relaxed">
            Pick a time that works for you and we'll send a calendar invite with a Google Meet link.
          </p>
        </div>
      </section>

      <section className="section border-b border-white/10">
        <div className="max-w-[980px] mx-auto">
          <BookingForm types={types} />
        </div>
      </section>

      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-5">Prefer to send a message?</h2>
          <p className="text-base text-white/70 mb-8 leading-relaxed">
            Use our contact form and a member of the team will get back to you within 1–2 business days.
          </p>
          <a href="/contact" className="btn-primary">Contact Us</a>
        </div>
      </section>
    </>
  )
}

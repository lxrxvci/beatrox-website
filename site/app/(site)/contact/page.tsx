import type { Metadata } from 'next'
import { getContact } from '@/lib/json-content'
import { seoToMetadata } from '@/lib/metadata'
import JsonLd from '@/components/JsonLd'
import { buildLocalBusinessSchema } from '@/lib/schema'
import ContactForm from './ContactForm'

export async function generateMetadata(): Promise<Metadata> {
  const data = getContact()
  return seoToMetadata(data.seo)
}

export default function ContactPage() {
  const data = getContact()

  return (
    <>
      {/* Header */}
      <section className="hero border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <p className="heading-sm text-white/30 mb-4">Get in Touch</p>
          <h1 className="heading-xl max-w-3xl">{data.hero.headline}</h1>
          <p className="text-sm text-white/50 mt-6 max-w-xl leading-relaxed">{data.hero.subheadline}</p>
        </div>
      </section>

      {/* Contact info + form */}
      <section className="section border-b border-white/10">
        <div className="max-w-[980px] mx-auto">
          <div>
            <h2 className="heading-sm text-white/40 mb-6">{data.consultationForm.heading}</h2>
            <p className="text-[0.88rem] md:text-sm text-white/50 mb-7 md:mb-8 leading-relaxed">{data.consultationForm.description}</p>
            <ContactForm
              fields={data.consultationForm.fields}
              submitLabel={data.consultationForm.submitLabel}
              successMessage={data.consultationForm.successMessage}
            />

            <div className="mt-10 md:mt-12 pt-7 md:pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-white/45">{data.address.formatted}</p>
              <div className="flex items-center gap-4">
                <a
                  href={data.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.65rem] font-semibold tracking-[0.15em] uppercase text-white/40 hover:text-white transition-colors"
                >
                  YouTube
                </a>
                <a
                  href={data.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.65rem] font-semibold tracking-[0.15em] uppercase text-white/40 hover:text-white transition-colors"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Contact CTAs */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-4">Prefer to reach out directly?</h2>
          <p className="text-sm text-white/50 mb-8 leading-relaxed">
            Our team is available Monday–Friday, 9am–6pm PST. We typically respond within 1–2 business days.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href={`mailto:${data.contact.email}`} className="btn-primary">Email Us</a>
            <a href={`tel:${data.contact.phone}`} className="btn-ghost">Call Us</a>
          </div>
        </div>
      </section>
      <JsonLd data={buildLocalBusinessSchema()} />
    </>
  )
}

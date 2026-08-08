import type { Metadata } from 'next'
import { getContactResolved, getCMSPageBySlug } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import ContactForm from './ContactForm'
import KineticHeading from '@/components/KineticHeading'
import CMSBlockRenderer from '@/components/CMSBlockRenderer'
import { EditableText } from '@/components/admin'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const data = await getContactResolved()
  return seoToMetadata(data.seo, '/contact')
}

export default async function ContactPage({ preview = false }: { preview?: boolean }) {
  const data = await getContactResolved(preview)
  const cmsPage = await getCMSPageBySlug('contact', preview)

  return (
    <>
      {/* Header */}
      <section className="hero border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <p className="overline mb-4">Get in Touch</p>
          <KineticHeading text={data.hero.headline} className="heading-xl max-w-3xl" />
          <p className="text-base text-white mt-6 max-w-xl leading-relaxed">
            <EditableText collection="pages" documentId={cmsPage?.id} fieldPath="hero.subheadline" value={data.hero.subheadline}>
              {data.hero.subheadline}
            </EditableText>
          </p>
        </div>
      </section>

      {cmsPage?.blocks && cmsPage.blocks.length > 0 && (
        <CMSBlockRenderer blocks={cmsPage.blocks} collection="pages" documentId={cmsPage.id} />
      )}

      {/* Contact info + form */}
      <section className="section border-b border-white/10">
        <div className="max-w-[980px] mx-auto">
          <div>
            <h2 className="heading-sm text-white mb-6">
              <EditableText collection="pages" documentId={cmsPage?.id} fieldPath="consultationForm.heading" value={data.consultationForm.heading}>
                {data.consultationForm.heading}
              </EditableText>
            </h2>
            <p className="text-base text-white mb-8 md:mb-10 leading-relaxed">
              <EditableText collection="pages" documentId={cmsPage?.id} fieldPath="consultationForm.description" value={data.consultationForm.description} multiline>
                {data.consultationForm.description}
              </EditableText>
            </p>
            <ContactForm
              fields={data.consultationForm.fields}
              submitLabel={data.consultationForm.submitLabel}
              successMessage={data.consultationForm.successMessage}
            />

            <div className="mt-12 md:mt-14 pt-8 md:pt-10 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <p className="text-sm text-white">
                <EditableText collection="pages" documentId={cmsPage?.id} fieldPath="address.formatted" value={data.address.formatted} multiline>
                  {data.address.formatted}
                </EditableText>
              </p>
              <div className="flex items-center gap-5">
                <a
                  href={data.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold tracking-[0.14em] uppercase text-white hover:text-white transition-colors"
                >
                  YouTube
                </a>
                <a
                  href={data.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold tracking-[0.14em] uppercase text-white hover:text-white transition-colors"
                >
                  Instagram
                </a>
              </div>
            </div>

            {/* Embedded Google Map of the studio (OP-50); keyless embed,
                lazy-loaded, reinforces the geo signal for GBP parity. */}
            <div className="mt-10 md:mt-12 border border-white/10">
              <iframe
                title="Beatrox location map: 1313 SE 3rd Ave, Portland, OR 97214"
                src="https://maps.google.com/maps?q=1313%20SE%203rd%20Ave%2C%20Portland%2C%20OR%2097214&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-[320px] md:h-[400px] block"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Contact CTAs */}
      <section className="section border-t border-white/10 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="heading-md mb-5">Prefer to reach out directly?</h2>
          <p className="text-base text-white mb-8 leading-relaxed">
            Our team is available Monday–Friday, 9am–6pm PT. We typically respond within 1–2 business days.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href={`mailto:${data.contact.email}`} className="btn-primary">Email Us</a>
            <a href={`tel:${data.contact.phone}`} className="btn-ghost">Call Us</a>
          </div>
        </div>
      </section>
    </>
  )
}

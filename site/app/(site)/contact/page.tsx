import type { Metadata } from 'next'
import { getContact } from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  const data = getContact()
  return {
    title: data.seo.title,
    description: data.seo.description,
    openGraph: {
      title: data.seo.og.title,
      description: data.seo.og.description,
      images: [data.seo.og.image],
    },
  }
}

export default function ContactPage() {
  const data = getContact()

  return (
    <>
      {/* Header */}
      <section className="pt-28 md:pt-32 pb-12 md:pb-16 px-5 md:px-6 lg:px-10 border-b border-white/10">
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
            <form
              action="https://formspree.io/f/placeholder"
              method="POST"
              className="space-y-5 md:space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                {data.consultationForm.fields.slice(0, 4).map(field => {
                  if (field.type === 'text' || field.type === 'email' || field.type === 'tel') {
                    return (
                      <div key={field.id}>
                        <label className="heading-sm text-white/30 block mb-1.5" htmlFor={field.id}>
                          {field.label}{field.required && ' *'}
                        </label>
                        <input
                          id={field.id}
                          name={field.id}
                          type={field.type}
                          required={field.required}
                          className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white transition-colors"
                          placeholder={field.label}
                        />
                      </div>
                    )
                  }
                  return null
                })}
              </div>

              {data.consultationForm.fields.slice(4).map(field => {
                if (field.type === 'select' && field.options) {
                  return (
                    <div key={field.id}>
                      <label className="heading-sm text-white/30 block mb-1.5" htmlFor={field.id}>
                        {field.label}{field.required && ' *'}
                      </label>
                      <select
                        id={field.id}
                        name={field.id}
                        required={field.required}
                        className="w-full bg-black border border-white/20 px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors"
                      >
                        <option value="">Select…</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )
                }
                if (field.type === 'textarea') {
                  return (
                    <div key={field.id}>
                      <label className="heading-sm text-white/30 block mb-1.5" htmlFor={field.id}>
                        {field.label}{field.required && ' *'}
                      </label>
                      <textarea
                        id={field.id}
                        name={field.id}
                        required={field.required}
                        rows={5}
                        className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white transition-colors resize-none"
                        placeholder={field.label}
                      />
                    </div>
                  )
                }
                if (field.type === 'text' || field.type === 'email' || field.type === 'tel') {
                  return (
                    <div key={field.id}>
                      <label className="heading-sm text-white/30 block mb-1.5" htmlFor={field.id}>
                        {field.label}{field.required && ' *'}
                      </label>
                      <input
                        id={field.id}
                        name={field.id}
                        type={field.type}
                        required={field.required}
                        className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white transition-colors"
                        placeholder={field.label}
                      />
                    </div>
                  )
                }
                return null
              })}

              <button
                type="submit"
                className="btn-primary"
              >
                {data.consultationForm.submitLabel}
              </button>
            </form>

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
    </>
  )
}

import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getMediaLibrary, getTeamResolved } from '@/lib/content'
import { seoToMetadata } from '@/lib/metadata'
import KineticHeading from '@/components/KineticHeading'
import { EditableImage } from '@/components/admin'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const data = await getTeamResolved()
  return seoToMetadata(data.seo, '/team')
}

export default async function TeamPage() {
  const data = await getTeamResolved()
  const mediaLibrary = await getMediaLibrary()
  const sorted = [...data.members].sort((a, b) => a.order - b.order)
  const heroImage = data.media?.heroImage || '/og-default.jpg'

  return (
    <>
      {/* Header */}
      <section className="relative hero border-b border-white/10 overflow-hidden">
        <Image
          src={heroImage}
          alt="Team hero media"
          fill
          priority
          sizes="100vw"
          className="hidden md:block object-cover opacity-[0.18]"
        />
        <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/88" />
        <div className="relative max-w-[1120px] mx-auto">
          <p className="overline mb-4">The Team</p>
          <KineticHeading text={data.hero.headline} className="heading-lg md:heading-xl max-w-3xl" />
          <p className="text-base text-white mt-6 max-w-4xl leading-relaxed">{data.hero.subheadline}</p>
          <span aria-hidden="true" className="block h-px w-16 bg-[var(--accent)] mt-8" />
        </div>
      </section>

      {/* Team members */}
      <section className="section border-b border-white/10">
        <div className="max-w-[1120px] mx-auto">
          <div className="space-y-8 md:space-y-10">
            {sorted.map((member) => (
              <article key={member.name} className="border-b border-white/10 pb-7 md:pb-9">
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-5 md:gap-8 items-start">
                  {member.photo?.url && (
                    <div className="relative w-full max-w-[110px] md:max-w-[140px] aspect-square overflow-hidden bg-neutral-950 border border-white/10">
                      <EditableImage
                        collection="team"
                        documentId={member.id}
                        fieldPath="photo"
                        value={member.photo.url}
                        alt={member.photo.alt}
                        mediaLibrary={mediaLibrary}
                      >
                        <Image
                          src={member.photo.url}
                          alt={member.photo.alt || member.name}
                          fill
                          sizes="(max-width: 768px) 110px, 140px"
                          className="object-cover"
                        />
                      </EditableImage>
                    </div>
                  )}
                  <div>
                    <h2 className="text-sm md:text-base tracking-[0.11em] uppercase text-white mb-2">
                      {member.name} <span aria-hidden="true" className="text-white">—</span> <span className="text-[var(--accent)]">{member.title}</span>
                    </h2>
                    <p className="text-base text-white leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {data.cta && (
        <section className="section border-t border-white/10 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="heading-md mb-5">{data.cta.heading}</h2>
            <p className="text-base text-white mb-8 leading-relaxed">{data.cta.body}</p>
            <Link href={data.cta.url} className="btn-primary btn-primary--accent">{data.cta.label}</Link>
          </div>
        </section>
      )}
    </>
  )
}

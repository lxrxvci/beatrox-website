import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTeam } from '@/lib/json-content'
import { seoToMetadata } from '@/lib/metadata'

export async function generateMetadata(): Promise<Metadata> {
  const data = getTeam()
  return seoToMetadata(data.seo)
}

export default function TeamPage() {
  const data = getTeam()
  const sorted = [...data.members].sort((a, b) => a.order - b.order)
  const heroImage = data.media?.heroImage || '/og-default.jpg'

  return (
    <>
      {/* Header */}
      <section className="relative pt-24 pb-12 md:pb-16 px-6 lg:px-10 border-b border-white/10 overflow-hidden">
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
          <p className="heading-sm text-white/30 mb-4">The Team</p>
          <h1 className="heading-lg md:heading-xl max-w-3xl">{data.hero.headline}</h1>
          <p className="text-sm text-white/60 mt-6 max-w-4xl leading-relaxed">{data.hero.subheadline}</p>
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
                      <Image
                        src={member.photo.url}
                        alt={member.photo.alt || member.name}
                        fill
                        sizes="(max-width: 768px) 110px, 140px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-[0.78rem] md:text-base tracking-[0.11em] uppercase text-white mb-2">
                      {member.name} - {member.title}
                    </h2>
                    <p className="text-[0.86rem] md:text-sm text-white/65 leading-relaxed">
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
            <h2 className="heading-md mb-4">{data.cta.heading}</h2>
            <p className="text-sm text-white/50 mb-8 leading-relaxed">{data.cta.body}</p>
            <Link href={data.cta.url} className="btn-primary">{data.cta.label}</Link>
          </div>
        </section>
      )}
    </>
  )
}

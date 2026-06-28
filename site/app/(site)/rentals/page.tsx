import type { Metadata } from 'next'
import Link from 'next/link'
import { seoToMetadata } from '@/lib/metadata'
import ParallaxHero from '@/components/ParallaxHero'
import rentalsData from '@/content/rentals.json'

export async function generateMetadata(): Promise<Metadata> {
  return seoToMetadata(rentalsData.seo)
}

export default function RentalsPage() {
  const { hero, categories, cta } = rentalsData

  return (
    <>
      <ParallaxHero
        imageSrc="/images/verified/home/Beatrox+Professional+sound+and+lighting+services+-+sound+equipment+rental+packages+-+RCF+-+QSC+-+Rentals-1d18c704.jpg"
        imageAlt="Equipment rentals hero"
        eyebrow="What We Rent"
        title={hero.headline}
        description={hero.subheadline}
        minHeightClass="min-h-[94svh]"
      />

      {/* Equipment Categories */}
      {categories.map((category) => (
        <section
          key={category.name}
          className="border-b border-white/10 px-6 lg:px-10 py-16 lg:py-24"
        >
          <div className="max-w-[1120px] mx-auto">
            <div className="mb-10">
              <h2 className="heading-lg mb-3">{category.name}</h2>
              <p className="text-sm text-white/50 leading-relaxed max-w-2xl">
                {category.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
              {category.items.map((item) => (
                <div
                  key={item.name}
                  className="relative bg-black p-7 md:p-8 group hover:bg-white/5 transition-colors min-h-[16rem] flex flex-col"
                >
                  {/* Availability badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[0.6rem] font-semibold tracking-[0.15em] uppercase px-2.5 py-1 ${
                        item.available
                          ? 'bg-white/10 text-white/70'
                          : 'bg-white/5 text-white/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.available ? 'bg-emerald-400' : 'bg-white/20'
                        }`}
                      />
                      {item.available ? 'Available' : 'On Request'}
                    </span>
                  </div>

                  <h3 className="heading-sm text-white mb-3 group-hover:text-white transition-colors">
                    {item.name}
                  </h3>

                  <p className="text-xs text-white/50 leading-relaxed mb-5 flex-grow">
                    {item.description}
                  </p>

                  {/* Specs */}
                  <ul className="space-y-1.5">
                    {item.specs.map((spec) => (
                      <li
                        key={spec}
                        className="text-[0.65rem] text-white/30 leading-relaxed flex items-start gap-2"
                      >
                        <span className="text-white/20 mt-0.5 shrink-0">—</span>
                        {spec}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="section text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="heading-lg mb-4">{cta.heading}</h2>
          <p className="text-sm text-white/50 leading-relaxed mb-10">
            {cta.subheading}
          </p>
          <Link href={cta.url} className="btn-primary">
            {cta.label}
          </Link>
        </div>
      </section>
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { seoToMetadata } from '@/lib/metadata'
import ParallaxHero from '@/components/ParallaxHero'
import NodeBullet from '@/components/NodeBullet'
import { getRentals } from '@/lib/json-content'

export async function generateMetadata(): Promise<Metadata> {
  const rentalsData = getRentals()
  return seoToMetadata(rentalsData.seo, '/rentals')
}

export default function RentalsPage() {
  const rentalsData = getRentals()
  const { hero, categories, cta } = rentalsData

  return (
    <>
      <ParallaxHero
        imageSrc="/images/verified/home/Beatrox+Professional+sound+and+lighting+services+-+sound+equipment+rental+packages+-+RCF+-+QSC+-+Rentals-1d18c704.jpg"
        imageAlt="Equipment rentals hero"
        eyebrow="What We Rent"
        title="Gear That Delivers"
        description={hero.subheadline}
        minHeightClass="min-h-[94svh]"
      />

      {/* Equipment Categories */}
      {categories.map((category) => (
        <section
          key={category.name}
          className="border-b border-white/10 section"
        >
          <div className="max-w-[1120px] mx-auto">
            <div className="mb-10">
              <h2 className="heading-lg mb-3">{category.name}</h2>
              <p className="text-base text-white/70 leading-relaxed max-w-2xl">
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
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] uppercase px-3 py-1.5 ${
                        item.available
                          ? 'bg-white/10 text-white/80'
                          : 'bg-white/5 text-white/55'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.available ? 'bg-emerald-400' : 'bg-white/25'
                        }`}
                      />
                      {item.available ? 'Available' : 'On Request'}
                    </span>
                  </div>

                  <h3 className="heading-sm text-white mb-3 group-hover:text-white transition-colors">
                    {item.name}
                  </h3>

                  <p className="text-base text-white/75 leading-relaxed mb-5 flex-grow">
                    {item.description}
                  </p>

                  {/* Specs */}
                  <ul className="space-y-2">
                    {item.specs.map((spec, i) => (
                      <li
                        key={spec}
                        className="text-sm text-white/65 leading-relaxed flex items-start gap-2.5"
                      >
                        <NodeBullet index={i} />
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
          <h2 className="heading-lg mb-5">{cta.heading}</h2>
          <p className="text-base text-white/70 leading-relaxed mb-10">
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

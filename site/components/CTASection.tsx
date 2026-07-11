import Link from 'next/link'

interface CTASectionProps {
  heading?: string
  subheading?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export default function CTASection({
  heading = 'Ready to build something extraordinary?',
  subheading = "Tell us about your project and we'll help you create an unforgettable experience.",
  primaryLabel = 'Book a Consultation',
  primaryHref = '/contact',
  secondaryLabel,
  secondaryHref,
}: CTASectionProps) {
  return (
    <section className="section border-t border-white/10 text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="heading-lg mb-5">{heading}</h2>
        <p className="text-base text-white/70 mb-10 leading-relaxed max-w-xl mx-auto">
          {subheading}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href={primaryHref} className="btn-primary">
            {primaryLabel}
          </Link>
          {secondaryLabel && secondaryHref && (
            <Link href={secondaryHref} className="btn-ghost">
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

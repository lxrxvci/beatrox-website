import Link from 'next/link'

interface CTASectionProps {
  heading?: string
  subheading?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  /** Word in `heading` rendered in the accent color (first case-insensitive match). */
  accentWord?: string
}

function renderHeading(heading: string, accentWord?: string) {
  if (!accentWord) return heading
  const idx = heading.toLowerCase().indexOf(accentWord.toLowerCase())
  if (idx === -1) return heading
  return (
    <>
      {heading.slice(0, idx)}
      <span className="text-[var(--accent)]">{heading.slice(idx, idx + accentWord.length)}</span>
      {heading.slice(idx + accentWord.length)}
    </>
  )
}

export default function CTASection({
  heading = 'Ready to build something extraordinary?',
  subheading = "Tell us about your project and we'll help you create an unforgettable experience.",
  primaryLabel = 'Book a Consultation',
  primaryHref = '/book',
  secondaryLabel,
  secondaryHref,
  accentWord = 'extraordinary',
}: CTASectionProps) {
  return (
    <section className="section border-t border-white/10 text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="heading-lg mb-5">{renderHeading(heading, accentWord)}</h2>
        <p className="text-base text-white/70 mb-10 leading-relaxed max-w-xl mx-auto">
          {subheading}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href={primaryHref} className="btn-primary btn-primary--accent">
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

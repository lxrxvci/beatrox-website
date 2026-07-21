import Link from 'next/link'
import { getContactResolved, getHomepageResolved } from '@/lib/content'
import KineticHeading from '@/components/KineticHeading'
import MagneticButton from '@/components/MagneticButton'
import ScrollPanel from './ScrollPanel'

export default async function ContactSection() {
  const [data, home] = await Promise.all([getContactResolved(), getHomepageResolved()])
  const { email, phone, phoneFormatted } = data.contact

  // Closing title card: the most spectacular frame from the homepage gallery
  // (red X-truss over the crowd), falling back to the hero image.
  const gallery = home.media.galleryImages || []
  const bgImage = gallery.find((src) => src.includes('IMG_3944')) ?? home.media.heroImage

  return (
    <ScrollPanel
      id="contact"
      variant="media"
      bgSrc={bgImage}
      bgAlt="BEATROX suspended truss sculpture over a live crowd"
      className="border-t border-white/10"
    >
      <div className="text-center">
        <p className="overline mb-4">Contact</p>
        <KineticHeading
          text="Let's Build Something Extraordinary"
          className="heading-lg md:heading-xl mx-auto max-w-4xl"
        />
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70">
          Every great experience starts with a conversation.
        </p>
        <p className="mt-6 flex flex-col items-center justify-center gap-2 text-base md:flex-row md:gap-8">
          <a href={`mailto:${email}`} className="text-white/85 underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline">
            {email}
          </a>
          <a href={`tel:${phone}`} className="text-white/85 underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline">
            {phoneFormatted || phone}
          </a>
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
        <MagneticButton href="/book" variant="accent">
          Start a Project
        </MagneticButton>
        <Link href="/contact" className="btn-ghost">
          Contact Us
        </Link>
      </div>
    </ScrollPanel>
  )
}

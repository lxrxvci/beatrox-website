import type { Metadata } from 'next'
import Link from 'next/link'
import { seoToMetadata } from '@/lib/metadata'
import { buildBreadcrumbSchema } from '@/lib/schema'
import JsonLd from '@/components/JsonLd'
import KineticHeading from '@/components/KineticHeading'

export function generateMetadata(): Metadata {
  return seoToMetadata(
    {
      title: 'SMS Terms & Conditions | BEATROX',
      description:
        'Terms for the Beatrox Production SMS program: operational production text messages, opt-in and opt-out instructions, message rates, frequency, and privacy disclosures.',
      og: {
        title: 'SMS Terms & Conditions | BEATROX',
        description:
          'Terms for the Beatrox Production SMS program: operational production text messages, opt-in and opt-out instructions, message rates, frequency, and privacy disclosures.',
        image: '/og-default.jpg',
      },
    },
    '/sms-terms',
  )
}

export default function SmsTermsPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'SMS Terms & Conditions',
            url: 'https://www.beatrox.com/sms-terms',
          },
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'SMS Terms & Conditions', path: '/sms-terms' },
          ]),
        ]}
      />
      <section className="hero border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <p className="overline mb-4">Legal</p>
          <KineticHeading text="SMS Terms & Conditions" className="heading-xl" />
          <p className="text-base text-white mt-6 max-w-xl leading-relaxed">
            Terms governing the Beatrox Production SMS text messaging program.
          </p>
          <p className="text-sm text-white/60 mt-3 tracking-[0.08em] uppercase">
            Effective Date: September 13, 2026 &middot; Last Updated: September 13, 2026
          </p>
        </div>
      </section>

      <section className="section">
        <div className="max-w-[980px] mx-auto">
          <div className="prose">
            <p>
              These SMS Terms &amp; Conditions (&ldquo;SMS Terms&rdquo;) govern the text messaging program
              operated by Beatrox LLC (&ldquo;Beatrox,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;). By opting in to receive text messages from Beatrox, you agree to these SMS
              Terms.
            </p>
            <p>
              The Beatrox SMS program is used for <strong>operational production communications only</strong>
              . It is not a marketing or promotional messaging program.
            </p>

            <h2>1. Program Name</h2>
            <p>
              <strong>Beatrox Production SMS</strong>
            </p>

            <h2>2. Program Description</h2>
            <p>
              Beatrox Production SMS provides operational production communications related to Beatrox
              projects, rentals, and events. Messages may include crew availability requests, booking
              confirmations, call times, schedule changes, venue and load-in logistics, and vendor
              coordination. The program exists to keep productions running on time; it is not used for
              marketing or promotional campaigns.
            </p>

            <h2>3. Message and Data Rates</h2>
            <p>
              <strong>Message and data rates may apply.</strong> Any charges imposed by your mobile carrier
              for text messages are your responsibility.
            </p>

            <h2>4. Message Frequency</h2>
            <p>
              Message frequency varies. Messages are sent on an operational, as-needed basis in connection
              with active productions, bookings, and rentals — for example, when call times change or
              availability confirmations are needed. There is no fixed recurring message schedule.
            </p>

            <h2>5. How to Opt In</h2>
            <p>You may opt in to Beatrox Production SMS by:</p>
            <ul>
              <li>Giving verbal or written consent to receive production-related text messages;</li>
              <li>
                Completing onboarding paperwork (such as crew, vendor, or contractor onboarding) that
                includes SMS consent; or
              </li>
              <li>
                Providing your mobile number to Beatrox for production coordination and agreeing to receive
                operational text messages.
              </li>
            </ul>
            <p>
              Consent to receive text messages is <strong>not a condition of purchase</strong> of any goods
              or services from Beatrox.
            </p>

            <h2>6. Opt-Out and Help</h2>
            <p>
              <strong>Reply STOP to any message to opt out. Reply HELP for help or contact admin@beatrox.com.</strong>
            </p>
            <p>
              After you reply STOP, we will send one confirmation message to confirm your opt-out, and you
              will receive no further messages from the program unless you re-subscribe.
            </p>

            <h2>7. Privacy</h2>
            <p>
              Your use of Beatrox Production SMS is also governed by our{' '}
              <Link href="/privacy">Privacy Policy</Link>. As stated there:{' '}
              <strong>
                No mobile information will be shared with third parties or affiliates for marketing or
                promotional purposes. All the above categories exclude text messaging originator opt-in data
                and consent; this information will not be shared with any third parties.
              </strong>
            </p>

            <h2>8. Carrier Non-Liability</h2>
            <p>
              <strong>Carriers are not liable for delayed or undelivered messages.</strong>
            </p>

            <h2>9. Supported Carriers</h2>
            <p>
              The program is supported by major U.S. wireless carriers. Carrier support is subject to change
              without notice, and the program may not be available on all carriers, plans, or in all areas.
            </p>

            <h2>10. Contact</h2>
            <p>Questions regarding these SMS Terms may be directed to:</p>
            <p>
              <strong>Beatrox LLC</strong>
              <br />
              1313 SE 3rd Ave
              <br />
              Portland, Oregon 97214
              <br />
              United States
            </p>
            <p>
              <strong>Email:</strong> <a href="mailto:admin@beatrox.com">admin@beatrox.com</a>
              <br />
              <strong>Website:</strong> beatrox.com
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

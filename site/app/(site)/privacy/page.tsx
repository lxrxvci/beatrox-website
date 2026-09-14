import type { Metadata } from 'next'
import Link from 'next/link'
import { seoToMetadata } from '@/lib/metadata'
import { buildBreadcrumbSchema } from '@/lib/schema'
import JsonLd from '@/components/JsonLd'
import KineticHeading from '@/components/KineticHeading'

export function generateMetadata(): Metadata {
  return seoToMetadata(
    {
      title: 'Privacy Policy | BEATROX',
      description:
        'How Beatrox LLC collects, uses, and protects personal information on beatrox.com and rentals.beatrox.com, including analytics, email, SMS, and payment processing disclosures.',
      og: {
        title: 'Privacy Policy | BEATROX',
        description:
          'How Beatrox LLC collects, uses, and protects personal information on beatrox.com and rentals.beatrox.com, including analytics, email, SMS, and payment processing disclosures.',
        image: '/og-default.jpg',
      },
    },
    '/privacy',
  )
}

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Privacy Policy',
            url: 'https://www.beatrox.com/privacy',
          },
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Privacy Policy', path: '/privacy' },
          ]),
        ]}
      />
      <section className="hero border-b border-white/10">
        <div className="max-w-[1400px] mx-auto">
          <p className="overline mb-4">Legal</p>
          <KineticHeading text="Privacy Policy" className="heading-xl" />
          <p className="text-base text-white mt-6 max-w-xl leading-relaxed">
            How Beatrox LLC collects, uses, and protects your information.
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
              This Privacy Policy describes how Beatrox LLC (&ldquo;Beatrox,&rdquo; &ldquo;we,&rdquo;
              &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, discloses, and protects personal
              information obtained through our websites, online platforms, forms, booking systems, rental
              systems, and other online services, including <strong>beatrox.com</strong>,{' '}
              <strong>rentals.beatrox.com</strong>, and any Beatrox-owned website or subdomain that links to
              this Privacy Policy (collectively, the &ldquo;Site&rdquo;).
            </p>
            <p>Please read this Privacy Policy carefully.</p>
            <p>
              By accessing or using the Site, submitting an inquiry, booking a consultation, creating an
              account, requesting a quote, initiating a rental, or otherwise using an interactive feature of
              the Site, you acknowledge the practices described in this Privacy Policy. If you do not agree
              with this Privacy Policy, do not use the Site.
            </p>

            <h2>1. Scope</h2>
            <p>
              This Privacy Policy applies to personal information collected through beatrox.com,
              rentals.beatrox.com, and any Beatrox-owned website or subdomain that links to this Privacy
              Policy, as well as to information provided to us through related communications channels
              operated by Beatrox, including email and text messaging.
            </p>
            <p>
              This Privacy Policy does not apply to third-party websites, platforms, or services that we do
              not control, even if they are linked from or integrated with the Site. Those services are
              governed by their own privacy policies.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>Contact, Booking, and Consultation Forms</h3>
            <p>
              When you submit a contact form, request a quote, or book a consultation through the Site, we
              collect the information you provide, which may include your name, email address, phone number,
              company or organization, event or project details, dates, locations, budgets, technical
              requirements, and any files, drawings, images, or other materials you choose to upload or
              attach.
            </p>
            <h3>Rental Inquiries, Bookings, and Transactions</h3>
            <p>
              When you inquire about, reserve, or rent equipment through Beatrox, we collect information
              needed to evaluate and fulfill the transaction, which may include your name, contact
              information, company, identification and verification details, insurance documentation, rental
              history with us, delivery and pickup details, and records of rental agreements — including
              electronic signature records associated with rental contracts.
            </p>
            <h3>Account Information</h3>
            <p>
              If the Site allows you to create an account, we collect the credentials and profile information
              you provide, such as your name, email address, and password or other authentication
              identifiers. You are responsible for maintaining the confidentiality of your credentials as
              described in our <Link href="/terms-and-conditions">Terms of Service</Link>.
            </p>
            <h3>Payment Information</h3>
            <p>
              Payments for rentals and other transactions are processed by Stripe. When you make a payment,
              your payment card details are transmitted directly to Stripe. Beatrox does not store full
              payment card numbers. We may retain limited transaction information — such as the last four
              digits of a card, card brand, billing name, and transaction identifiers — as needed for
              records, receipts, refunds, and dispute handling.
            </p>
            <h3>Technical and Usage Information</h3>
            <p>
              When you visit the Site, we and our analytics providers automatically collect certain technical
              and usage information through cookies and similar technologies, including your IP address,
              device and browser type, operating system, referring URLs, pages viewed, links clicked,
              approximate geographic location derived from your IP address, and the dates and times of your
              visits.
            </p>

            <h2>3. Analytics</h2>
            <p>
              We use Google Analytics 4 (GA4) and Vercel Analytics to understand how visitors use the Site
              and to improve its performance and content.
            </p>
            <p>
              These services collect information such as your IP address, device and browser characteristics,
              pages visited, time spent on pages, and approximate geographic location. Google Analytics is
              provided by Google and is governed by Google&rsquo;s own privacy policy. You can opt out of
              Google Analytics by installing the{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Analytics Opt-out Browser Add-on
              </a>
              .
            </p>

            <h2>4. Communications</h2>
            <h3>Email</h3>
            <p>
              We send transactional email — such as inquiry responses, booking confirmations, meeting links,
              quotes, contracts, invoices, and rental documentation — using Resend as our email delivery
              provider. Transactional email is sent in connection with your requests and transactions and is
              distinct from marketing communications.
            </p>
            <h3>SMS / Text Messaging</h3>
            <p>
              Beatrox operates an operational text messaging program, &ldquo;Beatrox Production SMS,&rdquo;
              used for production-related communications such as crew availability requests, booking
              confirmations, call times, schedule changes, venue and load-in logistics, and vendor
              coordination. The program is described in, and governed by, our{' '}
              <Link href="/sms-terms">SMS Terms &amp; Conditions</Link>, which include opt-in, opt-out, and
              help instructions.
            </p>
            <h3>Mobile Information and Text Messaging Data</h3>
            <p>
              <strong>
                No mobile information will be shared with third parties or affiliates for marketing or
                promotional purposes. All the above categories exclude text messaging originator opt-in data
                and consent; this information will not be shared with any third parties.
              </strong>
            </p>

            <h2>5. How We Use Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Respond to inquiries, requests, and messages you send us;</li>
              <li>Evaluate projects, develop pricing, and prepare quotes and proposals;</li>
              <li>Book, schedule, and confirm consultations, projects, and rentals;</li>
              <li>Fulfill rental transactions, including delivery, pickup, and returns;</li>
              <li>Prepare, execute, and administer contracts, including electronic signatures;</li>
              <li>Process payments, deposits, refunds, and related transaction records;</li>
              <li>Coordinate production logistics, scheduling, and crew communications;</li>
              <li>Detect, prevent, and respond to fraud, abuse, and security incidents;</li>
              <li>Comply with legal, tax, accounting, insurance, and regulatory obligations; and</li>
              <li>Operate, maintain, and improve the Site and our services.</li>
            </ul>
            <p>
              <strong>We do not sell your personal information.</strong>
            </p>

            <h2>6. Third-Party Service Providers</h2>
            <p>
              We share personal information with third-party service providers that process it on our behalf
              to operate the Site and deliver our services. These providers include:
            </p>
            <ul>
              <li>
                <strong>Vercel</strong> — website hosting, delivery, and analytics;
              </li>
              <li>
                <strong>Google</strong> — analytics (GA4) and Google Calendar for booking availability and
                scheduling;
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery;
              </li>
              <li>
                <strong>Stripe</strong> — payment processing for rentals and other transactions; and
              </li>
              <li>
                <strong>Twilio</strong> — SMS and text message delivery.
              </li>
            </ul>
            <p>
              Each of these providers processes personal information in accordance with its own privacy
              policy and terms. We may also disclose information when required by law, subpoena, court order,
              or governmental authority, or when reasonably necessary to protect our rights, safety, or
              property, or in connection with a merger, acquisition, or sale of substantially all relevant
              assets.
            </p>

            <h2>7. Data Retention</h2>
            <p>
              We retain personal information for as long as reasonably necessary to fulfill the purposes
              described in this Privacy Policy, including to maintain business, transaction, tax, accounting,
              insurance, and legal records, to resolve disputes, and to enforce our agreements. Rental
              agreements, contracts, invoices, and related records may be retained for the periods required
              by applicable law and our legitimate business needs. When information is no longer needed, we
              delete or de-identify it where practicable.
            </p>

            <h2>8. Security</h2>
            <p>
              We use reasonable administrative, technical, and physical safeguards designed to protect
              personal information against unauthorized access, loss, misuse, or alteration, including
              encrypted transmission (HTTPS), access controls, and the use of reputable service providers
              with their own security programs. No method of transmission or storage is completely secure,
              and we cannot guarantee absolute security.
            </p>

            <h2>9. Your Rights and Choices</h2>
            <p>
              You may request access to, correction of, or deletion of personal information we hold about you
              by contacting us at <a href="mailto:admin@beatrox.com">admin@beatrox.com</a>. We will respond
              to verified requests within a reasonable timeframe and as required by applicable law. We may
              retain certain information where required or permitted by law, including for transaction,
              legal, tax, and accounting purposes.
            </p>
            <p>
              You may opt out of text messages at any time as described in our{' '}
              <Link href="/sms-terms">SMS Terms &amp; Conditions</Link>, and you may opt out of Google
              Analytics using the browser add-on described in the Analytics section above.
            </p>

            <h2>10. Children&rsquo;s Privacy</h2>
            <p>
              The Site is not directed to children, and you must be at least 18 years old to enter into a
              transaction through the Site, as provided in our <Link href="/terms-and-conditions">Terms of Service</Link>.
              We do not knowingly collect personal information from children under 18. If you believe a child
              has provided us personal information, contact us and we will delete it.
            </p>

            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy to reflect changes in the Site, our services, our business
              practices, or applicable law. Revised versions will be posted on this page with an updated
              &ldquo;Last Updated&rdquo; date. Changes apply prospectively unless otherwise required by law.
              Your continued use of the Site after an updated Privacy Policy is posted constitutes
              acknowledgment of the revised policy.
            </p>

            <h2>12. Contact</h2>
            <p>Questions regarding this Privacy Policy may be directed to:</p>
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

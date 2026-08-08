import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import payloadConfig from '@/payload.config'
import type { Client, Deal } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Proposal | BEATROX',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ token: string }>
}

function money(value: number | null | undefined): string {
  return `$${(value || 0).toLocaleString()}`
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function ProposalPage({ params }: PageProps) {
  const { token } = await params
  const payload = await getPayload({ config: payloadConfig })

  // Public, token-gated read: the unguessable UUID is the access control.
  const result = await payload.find({
    collection: 'deals',
    where: { proposalToken: { equals: token } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })

  const deal = result.docs[0] as Deal | undefined
  if (!deal) {
    notFound()
  }

  // Stamp first view (best-effort; never blocks rendering).
  if (!deal.viewedAt) {
    try {
      await payload.update({
        collection: 'deals',
        id: deal.id,
        data: { viewedAt: new Date().toISOString() },
        overrideAccess: true,
      })
    } catch {
      // View tracking must not break the proposal page.
    }
  }

  const client = typeof deal.client === 'object' && deal.client !== null ? (deal.client as Client) : null
  const scopeItems = deal.proposal?.scopeItems || []
  const computedTotal = scopeItems.reduce((sum, item) => sum + (item.price || 0), 0)
  const total = computedTotal > 0 ? computedTotal : deal.value || 0
  const validUntil = formatDate(deal.proposal?.validUntil)
  const issuedDate = formatDate(deal.sentAt) || formatDate(deal.createdAt)

  return (
    <main id="main-content" className="pt-32 pb-24 px-6 lg:px-10">
      <div className="max-w-[860px] mx-auto space-y-12">
        <header className="space-y-6 border-b border-white/10 pb-10">
          <p className="heading-sm text-white">BEATROX | Proposal</p>
          <h1 className="heading-lg">{deal.title}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-white">
            {client && (
              <div>
                <p className="text-white text-xs uppercase tracking-wider mb-1">Prepared for</p>
                <p className="text-white">{client.name}</p>
                {client.company && <p>{client.company}</p>}
              </div>
            )}
            {issuedDate && (
              <div>
                <p className="text-white text-xs uppercase tracking-wider mb-1">Issued</p>
                <p className="text-white">{issuedDate}</p>
              </div>
            )}
            {validUntil && (
              <div>
                <p className="text-white text-xs uppercase tracking-wider mb-1">Valid until</p>
                <p className="text-white">{validUntil}</p>
              </div>
            )}
          </div>
        </header>

        {scopeItems.length > 0 && (
          <section className="space-y-6">
            <h2 className="heading-sm text-white">Scope of Work</h2>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {scopeItems.map((item, index) => (
                <div key={item.id || index} className="py-5 flex items-start justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-white">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-white leading-relaxed whitespace-pre-line">{item.description}</p>
                    )}
                  </div>
                  {typeof item.price === 'number' && item.price > 0 && (
                    <p className="text-base text-white font-mono whitespace-nowrap">{money(item.price)}</p>
                  )}
                </div>
              ))}
            </div>
            {total > 0 && (
              <div className="flex items-center justify-between pt-2">
                <p className="heading-sm text-white">Total Investment</p>
                <p className="text-2xl font-semibold font-mono">{money(total)}</p>
              </div>
            )}
          </section>
        )}

        {deal.proposal?.timeline && (
          <section className="space-y-3">
            <h2 className="heading-sm text-white">Timeline</h2>
            <p className="text-base text-white leading-relaxed whitespace-pre-line">{deal.proposal.timeline}</p>
          </section>
        )}

        {deal.proposal?.terms && (
          <section className="space-y-3">
            <h2 className="heading-sm text-white">Terms</h2>
            <p className="text-base text-white leading-relaxed whitespace-pre-line">{deal.proposal.terms}</p>
          </section>
        )}

        <footer className="border-t border-white/10 pt-8 space-y-3">
          <h2 className="heading-sm text-white">Next Steps</h2>
          <p className="text-base text-white leading-relaxed">
            To accept this proposal or ask questions, reply to your proposal email or contact us at{' '}
            <a href="mailto:admin@beatrox.com" className="text-white underline underline-offset-4">
              admin@beatrox.com
            </a>
            .
          </p>
          <p className="text-xs text-white">You can print or save this page as a PDF from your browser.</p>
        </footer>
      </div>
    </main>
  )
}

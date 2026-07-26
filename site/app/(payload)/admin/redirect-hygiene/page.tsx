import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import payloadConfig from '@/payload.config'
import { runRedirectHygiene } from '@/lib/redirects/hygiene'

async function getAdminUser() {
  const payload = await getPayload({ config: payloadConfig })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  return user
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = 'force-dynamic'

function compact(input?: string | string[] | null) {
  if (Array.isArray(input)) return input[0] || ''
  return (input || '').trim()
}

async function applyFixesAction() {
  'use server'
  const user = await getAdminUser()
  if (!user) {
    redirect('/admin/login')
  }
  const report = await runRedirectHygiene(true)
  redirect(`/admin/redirect-hygiene?notice=Applied+redirect+hygiene.+deleted=${report.deleted},+updated=${report.updated}`)
}

export default async function RedirectHygieneAdminPage({ searchParams }: PageProps) {
  const user = await getAdminUser()
  if (!user) {
    redirect('/admin/login')
  }
  const params = await searchParams
  const notice = compact(params.notice)
  const report = await runRedirectHygiene(false)

  return (
    <section className="pt-28 pb-20 px-6 lg:px-10">
      <div className="max-w-[1100px] mx-auto space-y-6">
        <header className="space-y-2">
          <p className="heading-sm text-white">Payload Admin Tool</p>
          <h1 className="heading-lg">Redirect Hygiene</h1>
          <p className="text-sm text-white max-w-3xl">
            Detects self-redirects, chain flatten opportunities, and loop risks. Safe auto-fixes apply to self redirects
            and chain flatten updates. Loop risks are flagged for manual review.
          </p>
          <p className="text-xs text-white">
            Tip: predeploy script equivalent is <code>npm run redirects:hygiene</code> and <code>npm run redirects:hygiene:apply</code>.
          </p>
        </header>

        {notice && <p className="text-xs border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">{notice}</p>}

        <div className="border border-white/10 p-5 space-y-4">
          <h2 className="heading-sm text-white">Current Scan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="border border-white/10 p-3">Scanned: {report.scanned}</div>
            <div className="border border-white/10 p-3">Self: {report.issues.filter((i) => i.kind === 'self_redirect').length}</div>
            <div className="border border-white/10 p-3">Chains: {report.issues.filter((i) => i.kind === 'chain_flatten').length}</div>
            <div className="border border-white/10 p-3">Loops: {report.issues.filter((i) => i.kind === 'loop_risk').length}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/redirect-hygiene" className="btn-ghost">
              Re-run Scan
            </Link>
            <form action={applyFixesAction}>
              <button type="submit" className="btn-primary">
                Apply Safe Fixes
              </button>
            </form>
          </div>
        </div>

        <div className="border border-white/10 p-5 space-y-3">
          <h2 className="heading-sm text-white">Issues</h2>
          {report.issues.length === 0 ? (
            <p className="text-xs text-white">No issues detected.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {report.issues.map((issue, idx) => (
                <li key={`${issue.kind}-${issue.from}-${idx}`} className="border border-white/10 p-3">
                  <p className="text-white">
                    [{issue.kind}] {issue.from} -&gt; {issue.to}
                  </p>
                  {issue.suggestedTo && <p className="text-white">Suggested destination: {issue.suggestedTo}</p>}
                  {issue.path && <p className="text-white">Path: {issue.path.join(' -> ')}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

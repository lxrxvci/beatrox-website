import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'
import { addDays, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { getGa4Dashboard, type Ga4TrendPoint } from '@/lib/analytics/ga4'
import { getKpiSummary } from '@/lib/kpi'

const TZ = 'America/Los_Angeles'

const cardStyle: React.CSSProperties = {
  background: 'var(--theme-elevation-50, #1a1a1a)',
  border: '1px solid var(--theme-elevation-150, #333)',
  borderRadius: '6px',
  padding: '20px',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.55,
  marginBottom: '4px',
}

const bigNumberStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  lineHeight: 1.1,
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={cardStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={bigNumberStyle}>{value}</div>
      {sub ? <div style={{ fontSize: '12px', opacity: 0.55, marginTop: '4px' }}>{sub}</div> : null}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: '15px', margin: '0 0 12px 0' }}>{children}</h2>
}

function Sparkline({ points }: { points: Ga4TrendPoint[] }) {
  if (points.length < 2) return null
  const width = 560
  const height = 64
  const max = Math.max(...points.map((p) => p.sessions), 1)
  const step = width / (points.length - 1)
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - (p.sessions / max) * (height - 6) - 3).toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '64px', display: 'block' }}>
      <path d={path} fill="none" stroke="var(--theme-success-500, #059669)" strokeWidth="2" />
    </svg>
  )
}

function money(value: number): string {
  return `$${value.toLocaleString()}`
}

export async function DashboardView({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult
  const { payload } = req

  const now = new Date()
  const weekAhead = addDays(now, 7)

  const [kpi, ga4, upcomingRes, openDealsRes, activitiesRes, submissionsRes, clientsRes] = await Promise.all([
    getKpiSummary(payload),
    getGa4Dashboard(30),
    payload.find({
      collection: 'consultations',
      where: {
        status: { in: ['new', 'confirmed'] },
        startTime: {
          greater_than_equal: now.toISOString(),
          less_than_equal: weekAhead.toISOString(),
        },
      },
      sort: 'startTime',
      limit: 8,
      depth: 1,
      overrideAccess: true,
      req,
    }),
    payload.find({
      collection: 'deals',
      where: { stage: { in: ['lead', 'proposal-sent', 'negotiating'] } },
      limit: 500,
      depth: 1,
      overrideAccess: true,
      req,
    }),
    payload.find({
      collection: 'activities',
      sort: '-createdAt',
      limit: 5,
      depth: 1,
      overrideAccess: true,
      req,
    }),
    payload.find({
      collection: 'contact-submissions',
      sort: '-createdAt',
      limit: 5,
      depth: 0,
      overrideAccess: true,
      req,
    }),
    payload.find({
      collection: 'clients',
      limit: 500,
      depth: 0,
      overrideAccess: true,
      req,
    }),
  ])

  // First-touch lead attribution, counted from client records.
  const sourceCounts = new Map<string, number>()
  for (const client of clientsRes.docs) {
    const source = client.acquisitionSource || 'direct/unknown'
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1)
  }
  const leadSources = [...sourceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Pipeline buckets: count + value per open stage.
  const stages = [
    { key: 'lead', label: 'Lead' },
    { key: 'proposal-sent', label: 'Proposal Sent' },
    { key: 'negotiating', label: 'Negotiating' },
  ] as const
  const pipeline = stages.map((stage) => {
    const deals = openDealsRes.docs.filter((deal) => deal.stage === stage.key)
    return {
      ...stage,
      count: deals.length,
      value: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
    }
  })

  // Merged activity feed: CRM activities + new inquiries, latest first.
  const feed = [
    ...activitiesRes.docs.map((activity) => ({
      id: `activity-${activity.id}`,
      href: `/admin/collections/activities/${activity.id}`,
      when: new Date(activity.createdAt),
      text: `${activity.type}: ${activity.subject}`,
    })),
    ...submissionsRes.docs.map((submission) => ({
      id: `submission-${submission.id}`,
      href: `/admin/collections/contact-submissions/${submission.id}`,
      when: new Date(submission.createdAt),
      text: `New inquiry from ${submission.name}`,
    })),
  ]
    .sort((a, b) => b.when.getTime() - a.when.getTime())
    .slice(0, 10)

  const quickActions = [
    { label: '+ New Client', href: '/admin/collections/clients/create' },
    { label: '+ New Deal', href: '/admin/collections/deals/create' },
    { label: '+ New Task', href: '/admin/collections/activities/create' },
    { label: 'Calendar', href: '/admin/calendar' },
    { label: 'Booking Page', href: '/book' },
  ]

  return (
    <div style={{ padding: 'var(--gutter-h, 24px)', color: 'var(--theme-text)', maxWidth: '1400px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>Dashboard</h1>
        <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                border: '1px solid var(--theme-elevation-150, #333)',
                borderRadius: '4px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              {action.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* KPI row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <KpiCard label="Leads WTD" value={String(kpi.leadsThisWeek)} sub={`${kpi.qualifiedLeadsThisWeek} qualified`} />
        <KpiCard label="Consults WTD" value={String(kpi.consultationsThisWeek)} />
        <KpiCard label="Proposals Out" value={String(kpi.openProposals)} />
        <KpiCard label="Won MTD" value={String(kpi.dealsWonThisMonth)} sub={money(kpi.revenueBookedThisMonth)} />
        <KpiCard label="Pipeline" value={money(kpi.pipelineValue)} sub={`${kpi.openDeals} open deals`} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* Traffic */}
        <div style={cardStyle}>
          <SectionTitle>Traffic: last 30 days</SectionTitle>
          {ga4 ? (
            <>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '8px' }}>
                <div>
                  <div style={labelStyle}>Sessions</div>
                  <div style={{ fontSize: '20px', fontWeight: 600 }}>{ga4.sessions.toLocaleString()}</div>
                </div>
                <div>
                  <div style={labelStyle}>Users</div>
                  <div style={{ fontSize: '20px', fontWeight: 600 }}>{ga4.users.toLocaleString()}</div>
                </div>
                <div>
                  <div style={labelStyle}>Pageviews</div>
                  <div style={{ fontSize: '20px', fontWeight: 600 }}>{ga4.pageviews.toLocaleString()}</div>
                </div>
                <div>
                  <div style={labelStyle}>Avg. Session</div>
                  <div style={{ fontSize: '20px', fontWeight: 600 }}>
                    {Math.round(ga4.avgSessionDurationSec)}s
                  </div>
                </div>
              </div>
              <Sparkline points={ga4.trend} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                <div>
                  <div style={labelStyle}>Top pages</div>
                  {ga4.topPages.slice(0, 5).map((page) => (
                    <div key={page.path} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.path}</span>
                      <span style={{ opacity: 0.6 }}>{page.pageviews}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={labelStyle}>Top sources</div>
                  {ga4.topSources.slice(0, 5).map((source) => (
                    <div key={source.source} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span>{source.source}</span>
                      <span style={{ opacity: 0.6 }}>{source.sessions}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '13px', opacity: 0.6, margin: 0 }}>
              GA4 is not connected yet. Set <code>GA4_PROPERTY_ID</code>, <code>GA4_CLIENT_EMAIL</code>, and{' '}
              <code>GA4_PRIVATE_KEY</code>, then see <code>site/docs/GA4_SETUP.md</code>.
            </p>
          )}

          {/* CRM first-touch attribution, independent of GA4. */}
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--theme-elevation-150, #333)', paddingTop: '12px' }}>
            <div style={labelStyle}>Lead sources (CRM, first-touch)</div>
            {leadSources.length === 0 ? (
              <p style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>No clients yet.</p>
            ) : (
              leadSources.map(([source, count]) => (
                <div key={source} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span>{source}</span>
                  <span style={{ opacity: 0.6 }}>{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming consultations */}
        <div style={cardStyle}>
          <SectionTitle>Upcoming consultations: next 7 days</SectionTitle>
          {upcomingRes.docs.length === 0 ? (
            <p style={{ fontSize: '13px', opacity: 0.6, margin: 0 }}>Nothing booked this week.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingRes.docs.map((booking) => {
                const start = toZonedTime(new Date(booking.startTime), booking.timezone || TZ)
                const typeName =
                  typeof booking.type === 'object' && booking.type !== null ? booking.type.name : 'Consultation'
                return (
                  <Link
                    key={booking.id}
                    href={`/admin/collections/consultations/${booking.id}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      fontSize: '13px',
                      textDecoration: 'none',
                      color: 'inherit',
                      borderBottom: '1px solid var(--theme-elevation-150, #333)',
                      paddingBottom: '8px',
                    }}
                  >
                    <span>
                      <strong>{booking.clientName}</strong> · {typeName}
                      {booking.googleMeetLink ? (
                        <span style={{ opacity: 0.55 }}> · Meet</span>
                      ) : null}
                    </span>
                    <span style={{ opacity: 0.7, whiteSpace: 'nowrap' }}>{format(start, 'EEE MMM d, h:mm a')}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Pipeline */}
        <div style={cardStyle}>
          <SectionTitle>Pipeline</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pipeline.map((stage) => (
              <div key={stage.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>{stage.label}</span>
                  <span style={{ opacity: 0.7 }}>
                    {stage.count} · {money(stage.value)}
                  </span>
                </div>
                <div
                  style={{
                    height: '6px',
                    borderRadius: '3px',
                    background: 'var(--theme-elevation-150, #333)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${kpi.pipelineValue > 0 ? Math.max((stage.value / kpi.pipelineValue) * 100, stage.count > 0 ? 4 : 0) : 0}%`,
                      background: 'var(--theme-success-500, #059669)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/collections/deals" style={{ fontSize: '12px', display: 'inline-block', marginTop: '12px' }}>
            View all deals →
          </Link>
        </div>

        {/* Activity feed */}
        <div style={cardStyle}>
          <SectionTitle>Recent activity</SectionTitle>
          {feed.length === 0 ? (
            <p style={{ fontSize: '13px', opacity: 0.6, margin: 0 }}>No activity yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {feed.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    fontSize: '13px',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderBottom: '1px solid var(--theme-elevation-150, #333)',
                    paddingBottom: '8px',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</span>
                  <span style={{ opacity: 0.55, whiteSpace: 'nowrap' }}>{format(item.when, 'MMM d')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardView

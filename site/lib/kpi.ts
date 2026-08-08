import { startOfMonth, startOfWeek } from 'date-fns'
import type { Payload } from 'payload'

export interface KpiSummary {
  /** New contact-form leads since Monday. */
  leadsThisWeek: number
  /** Leads moved to "qualified" since Monday. */
  qualifiedLeadsThisWeek: number
  /** Consultations booked since Monday. */
  consultationsThisWeek: number
  /** Deals currently at "proposal-sent". */
  openProposals: number
  /** Deals won since the 1st of the month. */
  dealsWonThisMonth: number
  /** Sum of won deal values since the 1st of the month (USD). */
  revenueBookedThisMonth: number
  /** Sum of open deal values (lead / proposal-sent / negotiating). */
  pipelineValue: number
  /** Open deal count. */
  openDeals: number
}

/**
 * Weekly/monthly sales KPIs, the metric set from
 * strategy/operating-system/05_KPI_DASHBOARD.md. Shared by the admin
 * dashboard and the weekly digest job. Counts/sums run over small tables,
 * so plain find()+reduce is fine (no SQL aggregation needed).
 */
export async function getKpiSummary(payload: Payload): Promise<KpiSummary> {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)

  const [leadsThisWeek, qualifiedLeadsThisWeek, consultationsThisWeek, openProposals, openDealsRes, wonDealsRes] =
    await Promise.all([
      payload.count({
        collection: 'contact-submissions',
        where: { createdAt: { greater_than_equal: weekStart.toISOString() } },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'contact-submissions',
        where: {
          status: { equals: 'qualified' },
          updatedAt: { greater_than_equal: weekStart.toISOString() },
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'consultations',
        where: { createdAt: { greater_than_equal: weekStart.toISOString() } },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'deals',
        where: { stage: { equals: 'proposal-sent' } },
        overrideAccess: true,
      }),
      payload.find({
        collection: 'deals',
        where: { stage: { in: ['lead', 'proposal-sent', 'negotiating'] } },
        limit: 500,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'deals',
        where: {
          stage: { equals: 'won' },
          closedAt: { greater_than_equal: monthStart.toISOString() },
        },
        limit: 500,
        depth: 0,
        overrideAccess: true,
      }),
    ])

  return {
    leadsThisWeek: leadsThisWeek.totalDocs,
    qualifiedLeadsThisWeek: qualifiedLeadsThisWeek.totalDocs,
    consultationsThisWeek: consultationsThisWeek.totalDocs,
    openProposals: openProposals.totalDocs,
    dealsWonThisMonth: wonDealsRes.totalDocs,
    revenueBookedThisMonth: wonDealsRes.docs.reduce((sum, deal) => sum + (deal.value || 0), 0),
    pipelineValue: openDealsRes.docs.reduce((sum, deal) => sum + (deal.value || 0), 0),
    openDeals: openDealsRes.totalDocs,
  }
}

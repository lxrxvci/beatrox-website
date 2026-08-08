import { format, startOfWeek } from 'date-fns'
import type { TaskConfig } from 'payload'
import { sendWeeklyKpiDigest } from '../../lib/email'
import { getKpiSummary } from '../../lib/kpi'

/**
 * Monday ~8am PT (15:00 UTC): email the weekly KPI digest, the metric set
 * from strategy/operating-system/05_KPI_DASHBOARD.md.
 */
export const weeklyKpiDigestTask: TaskConfig = {
  slug: 'weekly-kpi-digest',
  schedule: [{ cron: '17 15 * * 1', queue: 'default' }],
  handler: async ({ req }) => {
    const kpi = await getKpiSummary(req.payload)
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

    await sendWeeklyKpiDigest({
      weekLabel: `Week of ${format(weekStart, 'MMMM d, yyyy')}`,
      leadsThisWeek: kpi.leadsThisWeek,
      qualifiedLeadsThisWeek: kpi.qualifiedLeadsThisWeek,
      consultationsThisWeek: kpi.consultationsThisWeek,
      openProposals: kpi.openProposals,
      dealsWonThisMonth: kpi.dealsWonThisMonth,
      revenueBookedThisMonth: kpi.revenueBookedThisMonth,
      pipelineValue: kpi.pipelineValue,
      adminUrl: `${siteUrl}/admin`,
    })

    return { output: { ...kpi } }
  },
}

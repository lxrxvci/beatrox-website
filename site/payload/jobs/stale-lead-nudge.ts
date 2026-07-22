import { subDays } from 'date-fns'
import type { TaskConfig } from 'payload'
import { sendStaleLeadDigest } from '../../lib/email'

/**
 * Daily (~8am PT / 15:00 UTC): one digest email listing inquiries still at
 * "new" and deals still at "lead" after 3+ days.
 */
export const staleLeadNudgeTask: TaskConfig = {
  slug: 'stale-lead-nudge',
  schedule: [{ cron: '12 15 * * *', queue: 'default' }],
  handler: async ({ req }) => {
    const cutoff = subDays(new Date(), 3).toISOString()

    const [submissions, deals] = await Promise.all([
      req.payload.find({
        collection: 'contact-submissions',
        where: {
          status: { equals: 'new' },
          createdAt: { less_than: cutoff },
        },
        limit: 100,
        depth: 0,
        overrideAccess: true,
        req,
      }),
      req.payload.find({
        collection: 'deals',
        where: {
          stage: { equals: 'lead' },
          createdAt: { less_than: cutoff },
        },
        limit: 100,
        depth: 0,
        overrideAccess: true,
        req,
      }),
    ])

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

    await sendStaleLeadDigest({
      staleSubmissions: submissions.docs.map((doc) => ({
        id: doc.id,
        name: doc.name,
        email: doc.email,
        createdAt: doc.createdAt,
      })),
      staleDeals: deals.docs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        value: doc.value,
        createdAt: doc.createdAt,
      })),
      adminUrl: `${siteUrl}/admin`,
    })

    return {
      output: {
        staleSubmissions: submissions.totalDocs,
        staleDeals: deals.totalDocs,
      },
    }
  },
}

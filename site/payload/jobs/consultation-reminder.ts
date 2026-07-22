import { addHours } from 'date-fns'
import type { TaskConfig } from 'payload'
import { sendConsultationReminder } from '../../lib/email'

/**
 * Hourly: email a 24h reminder for every confirmed consultation starting in
 * the next 24 hours that hasn't been reminded yet.
 */
export const consultationReminderTask: TaskConfig = {
  slug: 'consultation-reminder',
  schedule: [{ cron: '7 * * * *', queue: 'default' }],
  handler: async ({ req }) => {
    const now = new Date()
    const horizon = addHours(now, 24)

    const due = await req.payload.find({
      collection: 'consultations',
      where: {
        status: { equals: 'confirmed' },
        startTime: {
          greater_than: now.toISOString(),
          less_than_equal: horizon.toISOString(),
        },
        reminderSentAt: { exists: false },
      },
      depth: 1,
      limit: 100,
      overrideAccess: true,
      req,
    })

    let sent = 0
    for (const doc of due.docs) {
      const typeName =
        typeof doc.type === 'object' && doc.type !== null && 'name' in doc.type
          ? String(doc.type.name)
          : 'consultation'

      await sendConsultationReminder({
        to: doc.clientEmail,
        name: doc.clientName,
        consultationType: typeName,
        startTime: new Date(doc.startTime),
        endTime: new Date(doc.endTime),
        timezone: doc.timezone || 'America/Los_Angeles',
        meetLink: doc.googleMeetLink || undefined,
      })

      await req.payload.update({
        collection: 'consultations',
        id: doc.id,
        data: { reminderSentAt: now.toISOString() },
        overrideAccess: true,
        req,
      })
      sent += 1
    }

    return { output: { remindersSent: sent } }
  },
}

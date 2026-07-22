import type { CollectionConfig } from 'payload'
import { linkOrCreateClient } from '../../lib/crm/link-client'
import { deleteCalendarEvent, updateCalendarEvent } from '../../lib/scheduling/google-calendar'

export const Consultations: CollectionConfig = {
  slug: 'consultations',
  admin: {
    useAsTitle: 'clientName',
    defaultColumns: ['clientName', 'clientEmail', 'type', 'startTime', 'status'],
    group: 'Scheduling',
    description: 'Booked consultations and discovery calls.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    // Public bookings are written by the trusted server action
    // (app/(site)/book/actions.ts) via the local API with overrideAccess.
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc

        // Link the booking to a client record (create the client on first touch).
        if (!doc.client) {
          const clientId = await linkOrCreateClient(req, {
            name: doc.clientName,
            email: doc.clientEmail,
            company: doc.clientCompany,
            phone: doc.phone,
            source: 'booking',
            attribution: doc.utm,
          })
          if (clientId) {
            try {
              await req.payload.update({
                collection: 'consultations',
                id: doc.id,
                data: { client: clientId },
                overrideAccess: true,
                req,
              })
            } catch {
              // Client linking must not fail the booking flow.
            }
          }
        }

        return doc
      },
      // Two-way Google Calendar sync: cancel → delete event, reschedule → patch
      // event. Only reacts to real diffs so the booking action's own follow-up
      // update (stamping event ID / Meet link) does not re-trigger a patch.
      async ({ doc, previousDoc, operation }) => {
        if (operation !== 'update' || !previousDoc) return doc

        const eventId = doc.googleCalendarEventId || previousDoc.googleCalendarEventId
        if (!eventId) return doc

        const becameCancelled = doc.status === 'cancelled' && previousDoc.status !== 'cancelled'
        if (becameCancelled) {
          await deleteCalendarEvent(eventId)
          return doc
        }

        const timesChanged =
          doc.status === 'confirmed' &&
          (doc.startTime !== previousDoc.startTime || doc.endTime !== previousDoc.endTime)
        if (timesChanged) {
          await updateCalendarEvent({
            eventId,
            startTime: new Date(doc.startTime),
            endTime: new Date(doc.endTime),
            timezone: doc.timezone || 'America/Los_Angeles',
          })
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'type',
      type: 'relationship',
      relationTo: 'consultation-types',
      required: true,
    },
    {
      name: 'startTime',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'endTime',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'timezone',
      type: 'text',
      required: true,
      defaultValue: 'America/Los_Angeles',
    },
    {
      name: 'clientName',
      type: 'text',
      required: true,
    },
    {
      name: 'clientEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'clientCompany',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'projectSummary',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Completed', value: 'completed' },
      ],
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: 'source',
      type: 'text',
      defaultValue: 'website',
    },
    {
      name: 'utm',
      type: 'group',
      admin: {
        description: 'Marketing attribution captured from the landing URL (first touch).',
      },
      fields: [
        { name: 'source', type: 'text' },
        { name: 'medium', type: 'text' },
        { name: 'campaign', type: 'text' },
        { name: 'gclid', type: 'text' },
      ],
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        readOnly: true,
        description: 'Auto-linked client record.',
      },
    },
    {
      name: 'reminderSentAt',
      type: 'date',
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        readOnly: true,
        description: 'Auto-set when the 24h reminder email is sent.',
      },
    },
    {
      name: 'googleCalendarEventId',
      type: 'text',
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        readOnly: true,
        description: 'Auto-populated when synced to Google Calendar.',
      },
    },
    {
      name: 'googleMeetLink',
      type: 'text',
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        readOnly: true,
        description: 'Auto-populated when a Google Meet conference is created.',
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        description: 'Private admin notes.',
      },
    },
  ],
}

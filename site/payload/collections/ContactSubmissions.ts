import type { CollectionConfig } from 'payload'
import { linkOrCreateClient } from '../../lib/crm/link-client'
import { sendContactNotification } from '../../lib/email'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'eventType', 'status', 'createdAt'],
    group: 'CRM',
    description: 'Contact form submissions from the website.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    // Public submissions are written by the trusted server action
    // (app/(site)/contact/actions.ts) via the local API with overrideAccess.
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc

        // Link the submission to a client record (create the client on first touch).
        if (!doc.client) {
          const clientId = await linkOrCreateClient(req, {
            name: doc.name,
            email: doc.email,
            company: doc.company,
            source: 'contact-form',
            attribution: doc.utm,
          })
          if (clientId) {
            try {
              await req.payload.update({
                collection: 'contact-submissions',
                id: doc.id,
                data: { client: clientId },
                overrideAccess: true,
                req,
              })
            } catch {
              // Client linking must not fail the intake flow.
            }
          }
        }

        // Notify the team — contact submissions previously had no notification.
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
        await sendContactNotification({
          name: doc.name,
          email: doc.email,
          company: doc.company || undefined,
          eventType: doc.eventType || undefined,
          services: Array.isArray(doc.services)
            ? doc.services.map((entry: { service?: string }) => entry.service).filter(Boolean)
            : undefined,
          eventDate: doc.eventDate || undefined,
          location: doc.location || undefined,
          budget: doc.budget || undefined,
          message: doc.message,
          adminUrl: `${siteUrl}/admin/collections/contact-submissions/${doc.id}`,
        })

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'eventType',
      type: 'text',
    },
    {
      name: 'services',
      type: 'array',
      fields: [
        {
          name: 'service',
          type: 'text',
        },
      ],
    },
    {
      name: 'eventDate',
      type: 'date',
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'budget',
      type: 'text',
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
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
      name: 'convertedToDeal',
      type: 'relationship',
      relationTo: 'deals',
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        description: 'Deal created from this submission, if converted.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Converted', value: 'converted' },
        { label: 'Archived', value: 'archived' },
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
      name: 'ipHash',
      type: 'text',
      access: {
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
      },
    },
  ],
}

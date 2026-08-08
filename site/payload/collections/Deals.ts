import crypto from 'crypto'
import type { CollectionConfig } from 'payload'
import { sendProposalEmail } from '../../lib/email'

export const Deals: CollectionConfig = {
  slug: 'deals',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'value', 'stage', 'expectedCloseDate', 'sentAt', 'viewedAt'],
    group: 'CRM',
    description: 'Proposals and revenue pipeline.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Every deal gets a public proposal token up front, the proposal
        // page at /proposal/[token] is reachable as soon as content exists.
        if (data && typeof data === 'object' && !data.proposalToken) {
          return { ...data, proposalToken: crypto.randomUUID() }
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        if (!data) return data
        const stage = data.stage
        const prevStage = originalDoc?.stage
        const isClosing = (stage === 'won' || stage === 'lost') && stage !== prevStage
        if (isClosing && !data.closedAt) {
          return { ...data, closedAt: new Date().toISOString() }
        }
        // Re-opening a deal clears the close timestamp.
        if (stage !== 'won' && stage !== 'lost' && data.closedAt) {
          return { ...data, closedAt: null }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        // Stamp the client's last-activity timestamp whenever a deal changes.
        const clientId = typeof doc.client === 'object' && doc.client !== null ? doc.client.id : doc.client
        if (!clientId) return doc
        try {
          await req.payload.update({
            collection: 'clients',
            id: clientId,
            data: { lastActivityAt: new Date().toISOString() },
            overrideAccess: true,
            req,
          })
        } catch {
          // Activity stamping must not block deal edits.
        }
        return doc
      },
      // Moving a deal to "proposal-sent" emails the client their proposal
      // link once (sentAt guards resends and double-fires from the stamp).
      async ({ doc, previousDoc, operation, req }) => {
        const becameProposalSent =
          doc.stage === 'proposal-sent' &&
          (operation === 'create' || previousDoc?.stage !== 'proposal-sent')
        if (!becameProposalSent || doc.sentAt) return doc

        try {
          const clientId = typeof doc.client === 'object' && doc.client !== null ? doc.client.id : doc.client
          const client = clientId
            ? await req.payload.findByID({ collection: 'clients', id: clientId, overrideAccess: true, req })
            : null

          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
          const proposalUrl = `${siteUrl}/proposal/${doc.proposalToken}`

          if (client?.email) {
            await sendProposalEmail({
              to: client.email,
              name: client.name,
              dealTitle: doc.title,
              proposalUrl,
              validUntil: doc.proposal?.validUntil || undefined,
            })
          }

          await req.payload.update({
            collection: 'deals',
            id: doc.id,
            data: { sentAt: new Date().toISOString() },
            overrideAccess: true,
            req,
          })
        } catch (error) {
          console.error('[deals] Failed to send proposal email:', error)
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      required: true,
    },
    {
      name: 'value',
      type: 'number',
      admin: {
        description: 'Deal value in USD.',
      },
    },
    {
      name: 'stage',
      type: 'select',
      defaultValue: 'lead',
      required: true,
      options: [
        { label: 'Lead', value: 'lead' },
        { label: 'Proposal Sent', value: 'proposal-sent' },
        { label: 'Negotiating', value: 'negotiating' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
      ],
    },
    {
      name: 'servicesInterested',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
    },
    {
      name: 'eventDate',
      type: 'date',
    },
    {
      name: 'expectedCloseDate',
      type: 'date',
    },
    {
      name: 'lostReason',
      type: 'text',
      admin: {
        condition: (data) => data?.stage === 'lost',
      },
    },
    {
      name: 'proposalNotes',
      type: 'textarea',
    },
    {
      name: 'proposalToken',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Auto-generated. Public proposal lives at /proposal/[token].',
      },
    },
    {
      name: 'proposal',
      type: 'group',
      admin: {
        description: 'Content of the public proposal page. Moving the stage to "Proposal Sent" emails the client the link.',
      },
      fields: [
        {
          name: 'scopeItems',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            {
              name: 'price',
              type: 'number',
              admin: { description: 'USD.' },
            },
          ],
        },
        {
          name: 'timeline',
          type: 'textarea',
          admin: { description: 'e.g. "Design 2 weeks, fabrication 4 weeks, install 2 days."' },
        },
        {
          name: 'terms',
          type: 'textarea',
          admin: { description: 'Payment terms, deposit, cancellation, etc.' },
        },
        {
          name: 'validUntil',
          type: 'date',
        },
      ],
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Auto-set when the proposal email goes out.',
      },
    },
    {
      name: 'viewedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Auto-set on the client\'s first view of the proposal page.',
      },
    },
    {
      name: 'acceptedAt',
      type: 'date',
      admin: {
        description: 'Set manually when the client accepts. Does not auto-close the deal.',
      },
    },
    {
      name: 'closedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Auto-set when the deal is won or lost.',
      },
    },
  ],
}

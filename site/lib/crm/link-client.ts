import type { PayloadRequest } from 'payload'

export interface LinkClientInput {
  name: string
  email: string
  company?: string | null
  phone?: string | null
  source: 'contact-form' | 'booking'
  attribution?: {
    source?: string | null
    medium?: string | null
    campaign?: string | null
    gclid?: string | null
  } | null
}

/** gclid implies a Google Ads click even when utm_source is absent. */
function resolveAcquisitionSource(attribution?: LinkClientInput['attribution']): string | undefined {
  if (!attribution) return undefined
  if (attribution.source) return attribution.source
  if (attribution.gclid) return 'google-ads'
  return undefined
}

/**
 * Find a client by email or create one, and stamp its last-activity time.
 * Used by the afterChange hooks of contact-submissions and consultations so
 * every public intake lands on a single client record. Never throws — intake
 * flows must not fail because CRM linking failed.
 */
export async function linkOrCreateClient(
  req: PayloadRequest,
  input: LinkClientInput,
): Promise<number | null> {
  try {
    const email = input.email.trim().toLowerCase()
    const now = new Date().toISOString()
    const acquisitionSource = resolveAcquisitionSource(input.attribution)
    const acquisitionCampaign = input.attribution?.campaign || undefined

    const existing = await req.payload.find({
      collection: 'clients',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })

    if (existing.docs.length > 0) {
      const client = existing.docs[0]
      await req.payload.update({
        collection: 'clients',
        id: client.id,
        data: {
          lastActivityAt: now,
          // Backfill contact details only when the client record lacks them.
          ...(input.phone && !client.phone ? { phone: input.phone } : {}),
          ...(input.company && !client.company ? { company: input.company } : {}),
          // First-touch attribution: never overwrite once set.
          ...(acquisitionSource && !client.acquisitionSource ? { acquisitionSource } : {}),
          ...(acquisitionCampaign && !client.acquisitionCampaign ? { acquisitionCampaign } : {}),
        },
        overrideAccess: true,
        req,
      })
      return client.id
    }

    const created = await req.payload.create({
      collection: 'clients',
      data: {
        name: input.name,
        email,
        company: input.company || undefined,
        phone: input.phone || undefined,
        source: input.source,
        acquisitionSource,
        acquisitionCampaign,
        lastActivityAt: now,
      },
      overrideAccess: true,
      req,
    })
    return created.id
  } catch (error) {
    console.error('[crm] Failed to link/create client:', error)
    return null
  }
}

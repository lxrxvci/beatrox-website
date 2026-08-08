import { revalidatePath } from 'next/cache'

// Shared ISR invalidation for CMS content. Used by the admin inline-edit
// endpoint (app/api/admin-update) and by Payload afterChange hooks so edits
// made through the full admin UI refresh the same paths. Every function here
// swallows its own errors, revalidation must never fail a save.

export function revalidateDocument(collection: string, doc: Record<string, unknown>) {
  try {
    const slug = typeof doc.slug === 'string' ? doc.slug : ''

    if (collection === 'pages') {
      if (slug) revalidatePath(slug === 'home' ? '/' : `/${slug}`)
      // Homepage composes page content (hero/blocks), so any page edit may
      // affect it.
      revalidatePath('/')
      return
    }

    if (collection === 'team') {
      // Team members render on the /team index; there are no /team/[slug] pages.
      revalidatePath('/team')
      return
    }

    const prefixMap: Record<string, string> = {
      projects: '/work',
      services: '/services',
    }

    const prefix = prefixMap[collection]
    if (prefix) {
      if (slug) revalidatePath(`${prefix}/${slug}`)
      // Index pages list every document, and the homepage features both
      // projects and services.
      revalidatePath(prefix)
      revalidatePath('/')
    }

    if (collection === 'projects') {
      // Tag pages are keyed by tag value; invalidate the whole dynamic segment.
      revalidatePath('/work/tag/[tag]', 'page')
      // Service pages auto-list tagged projects; invalidate them all.
      revalidatePath('/services')
      revalidatePath('/services/[slug]', 'page')
      // Tech pages list projects via techTags; invalidate them too.
      revalidatePath('/tech')
      revalidatePath('/tech/[slug]', 'page')
    }
  } catch (err) {
    // Don't fail the update if revalidation throws.
    console.error('Revalidation failed:', err)
  }
}

// Globals (navigation, site-styles, seo-defaults, capability-tiles) feed every
// page via the root layout, so any change invalidates the whole site shell.
export function revalidateGlobal() {
  try {
    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('Revalidation failed:', err)
  }
}

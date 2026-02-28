type CollectionKey = 'pages' | 'projects' | 'services' | 'team' | 'case-studies'

function clean(value: string): string {
  return value.trim().replace(/^\/+/, '')
}

function normalizeSlug(value: string): string {
  return clean(value).toLowerCase()
}

export function getLivePath(collection: CollectionKey, slug: string): string {
  const normalized = normalizeSlug(slug)
  if (!normalized) {
    if (collection === 'projects') return '/work'
    if (collection === 'services') return '/services'
    if (collection === 'case-studies') return '/case-studies'
    if (collection === 'team') return '/team'
    return '/'
  }

  if (collection === 'pages') {
    if (normalized === 'home' || normalized === 'homepage') return '/'
    return `/${normalized}`
  }
  if (collection === 'projects') {
    const projectSlug = normalized.replace(/^work\/+/, '')
    return `/work/${projectSlug}`
  }
  if (collection === 'services') {
    const serviceSlug = normalized.replace(/^services\/+/, '')
    return `/services/${serviceSlug}`
  }
  if (collection === 'case-studies') {
    const caseStudySlug = normalized.replace(/^case-studies\/+/, '')
    return `/case-studies/${caseStudySlug}`
  }
  if (collection === 'team') return '/team'
  return '/'
}

export function getPreviewPath(collection: CollectionKey, slug: string): string {
  const livePath = getLivePath(collection, slug)
  const params = new URLSearchParams()
  params.set('path', livePath)
  params.set('collection', collection)
  params.set('slug', normalizeSlug(slug))
  return `/preview?${params.toString()}`
}

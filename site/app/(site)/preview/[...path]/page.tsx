import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServiceResolved } from '@/lib/content'
import HomePage from '../../page'
import WorkPage from '../../work/page'
import ProjectPage from '../../work/[slug]/page'
import WorkTagPage from '../../work/tag/[tag]/page'
import ServicesPage from '../../services/page'
import ServicePage from '../../services/[slug]/page'
import TechIndexPage from '../../tech/page'
import TechPage from '../../tech/[slug]/page'
import TeamPage from '../../team/page'
import AboutPage from '../../about/page'
import ContactPage from '../../contact/page'
import CaseStudiesPage from '../../case-studies/page'
import CaseStudyPage from '../../case-studies/[slug]/page'
import CMSPage from '../../[slug]/page'

// Preview renders are always dynamic and per-request; the public routes stay
// static/ISR because they never touch draftMode/cookies/headers.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Non-CMS routes have no draft content, previewing them just shows the live page.
const NON_CMS_SEGMENTS = new Set(['videos', 'book', 'proposal', 'rentals'])

interface Props {
  params: Promise<{ path: string[] }>
}

export default async function PreviewPage({ params }: Props) {
  const [{ isEnabled }, { path }] = await Promise.all([draftMode(), params])
  const segments = path ?? []
  const livePath = `/${segments.join('/')}`
  // Draft mode is only enabled by /preview after verifying an active Payload
  // session, so an enabled draft cookie is the authorization signal. Without
  // it, bounce to the public page.
  if (!isEnabled) redirect(livePath)

  const [first, second, third] = segments

  if (first === 'home' && !second) return <HomePage preview />
  if (first === 'work' && second === 'tag' && third) {
    return <WorkTagPage params={Promise.resolve({ tag: third })} preview />
  }
  if (first === 'work' && second) {
    return <ProjectPage params={Promise.resolve({ slug: second })} preview />
  }
  if (first === 'work') return <WorkPage preview />
  if (first === 'services' && second) {
    // Tech capability docs preview at /tech/<slug> (their live route); the
    // stored livePath still points at the legacy /services form.
    const service = await getServiceResolved(second, true)
    if (service?.pageType === 'tech') {
      return <TechPage params={Promise.resolve({ slug: second })} preview />
    }
    return <ServicePage params={Promise.resolve({ slug: second })} preview />
  }
  if (first === 'services') return <ServicesPage preview />
  if (first === 'tech' && second) {
    return <TechPage params={Promise.resolve({ slug: second })} preview />
  }
  if (first === 'tech') return <TechIndexPage preview />
  if (first === 'team') return <TeamPage preview />
  if (first === 'about') return <AboutPage preview />
  if (first === 'contact') return <ContactPage preview />
  if (first === 'case-studies' && second) {
    return <CaseStudyPage params={Promise.resolve({ slug: second })} preview />
  }
  if (first === 'case-studies') return <CaseStudiesPage preview />
  if (first && !second && !NON_CMS_SEGMENTS.has(first)) {
    return <CMSPage params={Promise.resolve({ slug: first })} preview />
  }
  redirect(livePath)
}

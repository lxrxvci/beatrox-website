import './load-env.mjs'
import { api, assertCredentials, login, BASE_URL } from './cms-import-utils.mjs'

/**
 * One-off content fix: align the CMS "home" page hero with the scroll-story
 * redesign — statement headline and a "Book a Consultation" CTA that actually
 * goes to /book (previously /services).
 *
 * Usage:
 *   CMS_SEED_BASE_URL=https://beatrox-website.vercel.app node scripts/update-home-hero.mjs
 * (CMS_SEED_EMAIL / CMS_SEED_PASSWORD come from .env)
 */

const HEADLINE = 'Beatrox Experiential and Event Production in Portland, OR'
const SECONDARY_CTA_URL = '/book'

async function main() {
  assertCredentials()
  const token = await login()
  const auth = { 'Content-Type': 'application/json', Authorization: `JWT ${token}` }

  const { docs } = await api('/api/pages?where[slug][equals]=home&limit=1&depth=0', {
    headers: auth,
  })
  if (!docs?.length) throw new Error('No pages doc with slug "home" found')
  const page = docs[0]

  const hero = page.hero || {}
  console.log(`Target: ${BASE_URL} — pages/${page.id}`)
  console.log(`  headline:     "${hero.headline}" -> "${HEADLINE}"`)
  console.log(`  secondaryCta: "${hero.secondaryCta?.label}" ${hero.secondaryCta?.url} -> ${SECONDARY_CTA_URL}`)

  await api(`/api/pages/${page.id}`, {
    method: 'PATCH',
    headers: auth,
    body: JSON.stringify({
      hero: {
        ...hero,
        headline: HEADLINE,
        secondaryCta: { ...(hero.secondaryCta || {}), url: SECONDARY_CTA_URL },
      },
    }),
  })

  const { docs: after } = await api(`/api/pages?where[slug][equals]=home&limit=1&depth=0`, {
    headers: auth,
  })
  console.log(`Verified: headline="${after[0].hero?.headline}", secondaryCta.url=${after[0].hero?.secondaryCta?.url}`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})

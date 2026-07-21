import './load-env.mjs'
import { api, assertCredentials, login, toLexicalText, BASE_URL } from './cms-import-utils.mjs'

/**
 * One-off content fix: port the Squarespace "About Us" philosophy section to
 * the CMS "about" page — image-topped columns with the original Squarespace
 * copy. Only the philosophy block's columns are touched; all other blocks are
 * passed through unchanged.
 *
 * Requires the `image` text field on philosophy columns (payload/blocks/shared.ts)
 * to be deployed first — do not run against production before that deploys.
 *
 * Usage:
 *   CMS_SEED_BASE_URL=https://beatrox-website.vercel.app node scripts/update-about-philosophy.mjs
 * (CMS_SEED_EMAIL / CMS_SEED_PASSWORD come from .env)
 */

const COLUMNS = [
  {
    image: '/images/verified/home/L23640_00_CS_6500_N20_printmedium-4055b62a.jpg',
    heading: 'Who are we',
    body: 'We are a team of imaginative storytellers who use technology to bring worlds to life. Our goal is to evoke emotions in our audience and create unforgettable experiences that take you on an exciting and informative journey. Our diverse team of creators, engineers, designers, architects, and technologists work together to turn even the most unconventional ideas into reality.',
  },
  {
    image: '/images/verified/home/DSC02590-3988912b.jpg',
    heading: 'What we do',
    body: "Our services cover everything from experiential design and creative technology to specialized production and custom fabrication. We believe that any idea is achievable, and we are always experimenting with new tools and solutions to bring the best possible results to our clients. Whether it's a narrative or strategy, multimedia design or custom builds, our goal is always to create work that exceeds expectations.",
  },
  {
    image: '/images/verified/home/DSC01789-71839f6f.JPG',
    heading: 'How we do it',
    body: 'When we are on your team, collaboration is key. We value open and collaborative relationships with our clients and partners, working together to make great work that inspires wonder and human connection. We are passionate about what we do, and we are always pushing the limits of what is possible. Join us in creating something truly amazing.',
  },
]

async function main() {
  assertCredentials()
  const token = await login()
  const auth = { 'Content-Type': 'application/json', Authorization: `JWT ${token}` }

  const { docs } = await api('/api/pages?where[slug][equals]=about&limit=1&depth=0', {
    headers: auth,
  })
  if (!docs?.length) throw new Error('No pages doc with slug "about" found')
  const page = docs[0]

  const blocks = page.blocks || []
  const blockIndex = blocks.findIndex((block) => block.blockType === 'philosophy')
  if (blockIndex === -1) throw new Error('No philosophy block found on the "about" page')
  const block = blocks[blockIndex]

  const columns = COLUMNS.map((col, colIndex) => ({
    ...(block.columns?.[colIndex] || {}),
    image: col.image,
    heading: col.heading,
    body: toLexicalText(col.body),
  }))

  console.log(`Target: ${BASE_URL} — pages/${page.id}`)
  console.log(`  philosophy block index: ${blockIndex}, columns: ${(block.columns || []).length} -> ${columns.length}`)
  for (const col of columns) {
    console.log(`  - "${col.heading}" image=${col.image}`)
  }

  await api(`/api/pages/${page.id}`, {
    method: 'PATCH',
    headers: auth,
    body: JSON.stringify({
      blocks: blocks.map((existing, index) =>
        index === blockIndex ? { ...existing, columns } : existing,
      ),
    }),
  })

  const { docs: after } = await api(`/api/pages?where[slug][equals]=about&limit=1&depth=0`, {
    headers: auth,
  })
  const afterBlock = (after[0].blocks || []).find((b) => b.blockType === 'philosophy')
  const summary = (afterBlock?.columns || []).map((col) => `"${col.heading}" [${col.image || 'no image'}]`)
  console.log(`Verified: ${summary.join(', ')}`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})

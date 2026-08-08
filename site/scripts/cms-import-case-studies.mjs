import path from 'path'
import { pathToFileURL } from 'url'
import {
  assertCredentials,
  login,
  readJson,
  resolveMediaByLegacyUrl,
  upsertBySlug,
} from './cms-import-utils.mjs'

// Enriched case study definitions. Copy is grounded only in each project's
// source JSON (client, venue, type tags) plus the public context implied by
// the project title, no invented metrics or unnamed technologies.
const CASE_STUDIES = [
  {
    file: 'cnn-road-to-270.json',
    slug: 'cnn-road-to-270',
    listOrder: 20,
    body: [
      {
        type: 'objective',
        heading: 'Design Objective',
        content:
          'CNN partnered with Obscura Digital to turn the Empire State Building into a live canvas for its "Road to 270" election coverage. The objective was to translate the race to 270 electoral votes into a large-scale architectural projection mapping spectacle visible across New York City, extending the broadcast beyond the screen and into the skyline.',
      },
      {
        type: 'approach',
        heading: 'Approach',
        content:
          'Working with CNN and Obscura Digital, Beatrox supported the projection mapping and interactive production on one of the most recognized facades in the world. The execution combined precision architectural mapping with live election content, requiring careful alignment between broadcast timing and the on-building visual program.',
      },
      {
        type: 'features_list',
        heading: 'Scope of Work',
        items: [
          'Large-format architectural projection mapping on the Empire State Building facade',
          'Interactive visual content integrated with live election coverage',
          'On-site production execution in Midtown Manhattan',
          'Coordination with CNN broadcast and Obscura Digital creative teams',
        ],
      },
      {
        type: 'outcomes',
        heading: 'Outcomes Snapshot',
        content: 'Documented output from the activation:',
        items: [
          'Projection mapping delivered on an iconic New York City landmark',
          'Election-night visual program executed for CNN & Obscura Digital',
          'Full activation documented across a 6-image production gallery',
        ],
      },
    ],
  },
  {
    file: 'disenchantment.json',
    slug: 'disenchantment',
    listOrder: 30,
    body: [
      {
        type: 'objective',
        heading: 'Design Objective',
        content:
          'For the launch of Disenchantment, Netflix wanted to bring the animated world of the series off the screen and into the real world at San Diego Comic-Con. The objective was an immersive exhibition that let fans step inside the show\u2019s universe and walk away with a memorable, shareable experience.',
      },
      {
        type: 'approach',
        heading: 'Approach',
        content:
          'Beatrox produced a Comic-Con exhibition environment built around the show\u2019s settings and characters, translating 2D animation into a physical, walkable space. The build combined scenic fabrication with interactive moments designed for fan engagement and social capture.',
      },
      {
        type: 'features_list',
        heading: 'Scope of Work',
        items: [
          'Immersive exhibition environment for San Diego Comic-Con',
          'Physical translation of the Disenchantment series world',
          'Interactive fan touchpoints throughout the space',
          'End-to-end production for Netflix',
        ],
      },
      {
        type: 'outcomes',
        heading: 'Outcomes Snapshot',
        content: 'Documented output from the activation:',
        items: [
          'Comic-Con exhibition delivered for Netflix in San Diego, CA',
          'Recap video published for the activation',
          'Full exhibition documented across a 12-image production gallery',
        ],
      },
    ],
  },
  {
    file: 'el-camino.json',
    slug: 'el-camino',
    listOrder: 40,
    body: [
      {
        type: 'objective',
        heading: 'Design Objective',
        content:
          'To support the release of El Camino: A Breaking Bad Movie, Netflix set out to create a fan-facing experience in New York City worthy of one of television\u2019s most celebrated franchises. The objective was an immersive exhibition that rewarded the series\u2019 dedicated fanbase with a tangible connection to the film.',
      },
      {
        type: 'approach',
        heading: 'Approach',
        content:
          'Beatrox produced an exhibition experience that recreated the world of the film in physical space, giving fans the feeling of stepping onto the set. Detailed scenic work and interactive elements drove engagement and social sharing throughout the run.',
      },
      {
        type: 'features_list',
        heading: 'Scope of Work',
        items: [
          'Immersive exhibition experience in New York, NY',
          'Set-inspired scenic fabrication tied to the film',
          'Interactive fan touchpoints designed for social capture',
          'End-to-end production for Netflix',
        ],
      },
      {
        type: 'outcomes',
        heading: 'Outcomes Snapshot',
        content: 'Documented output from the activation:',
        items: [
          'Exhibition experience delivered for Netflix in New York, NY',
          '3 recap and behind-the-scenes videos published',
          'Full experience documented across an 11-image production gallery',
        ],
      },
    ],
  },
  {
    file: 'g-man-experiential-campaign.json',
    slug: 'g-man-experiential-campaign',
    listOrder: 50,
    body: [
      {
        type: 'objective',
        heading: 'Design Objective',
        content:
          'Toyota and MTV teamed up around the MTV Music Awards to put the Toyota C-HR in front of a young, music-driven audience. The objective was an experiential campaign that made the vehicle part of the awards-week energy rather than a passive sponsorship placement.',
      },
      {
        type: 'approach',
        heading: 'Approach',
        content:
          'Beatrox produced the G-MAN experiential activation in Los Angeles, building an interactive event environment around the Toyota C-HR and the MTV Music Awards moment. The experience was designed for high foot traffic, hands-on engagement, and social amplification.',
      },
      {
        type: 'features_list',
        heading: 'Scope of Work',
        items: [
          'Experiential event activation for Toyota x MTV',
          'Vehicle-integrated interactive environment',
          'Awards-week audience engagement programming',
          'End-to-end event production in Los Angeles, CA',
        ],
      },
      {
        type: 'outcomes',
        heading: 'Outcomes Snapshot',
        content: 'Documented output from the campaign:',
        items: [
          'Experiential campaign delivered for Toyota x MTV in Los Angeles, CA',
          'Project recap video published (Toyota C-HR x MTV Music Awards)',
          'Full activation documented across a 12-image production gallery',
        ],
      },
    ],
  },
  {
    file: 'the-great-escape.json',
    slug: 'the-great-escape',
    listOrder: 60,
    body: [
      {
        type: 'objective',
        heading: 'Design Objective',
        content:
          'Adidas engaged Beatrox to create "The Great Escape," a product launch experience in Los Angeles built around play and competition. The objective was to launch the product through participation, putting guests inside an escape-style experience rather than a conventional retail or press event.',
      },
      {
        type: 'approach',
        heading: 'Approach',
        content:
          'Beatrox designed and produced an escape-room-inspired launch experience that turned product discovery into a game. Guests moved through a series of interactive challenges, with the product woven into the narrative and the environment itself.',
      },
      {
        type: 'features_list',
        heading: 'Scope of Work',
        items: [
          'Escape-style product launch experience for Adidas',
          'Interactive challenge and game design',
          'Immersive environment build in Los Angeles, CA',
          'End-to-end experiential production',
        ],
      },
      {
        type: 'outcomes',
        heading: 'Outcomes Snapshot',
        content: 'Documented output from the launch:',
        items: [
          'Product launch experience delivered for Adidas in Los Angeles, CA',
          '3 recap and highlight videos published',
          'Full experience documented across a 14-image production gallery',
        ],
      },
    ],
  },
]

function asArray(input) {
  return Array.isArray(input) ? input : []
}

function youtubeIdFromUrl(url) {
  if (!url) return ''
  const match = String(url).match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  return match?.[1] || ''
}

function mapBody(body) {
  return asArray(body).map((block) => ({
    type: block.type || 'text',
    heading: block.heading || '',
    content: block.content || '',
    items: asArray(block.items).map((item) => ({ value: typeof item === 'string' ? item : item?.value || '' })),
  }))
}

async function mapImages(images, token, fallbackAlt) {
  const out = []
  for (const image of asArray(images)) {
    const media = await resolveMediaByLegacyUrl(image.url, token)
    out.push({
      media: media?.id,
      legacyUrl: image.url || '',
      alt: image.alt || fallbackAlt,
    })
  }
  return out
}

function mapVideos(videos) {
  return asArray(videos).map((video) => {
    const videoId = youtubeIdFromUrl(video.url || video.embedUrl || '')
    return {
      title: video.title || 'Campaign video',
      provider: video.provider || 'youtube',
      url: video.url || '',
      embedUrl: video.embedUrl || (videoId ? `https://www.youtube.com/embed/${videoId}` : ''),
    }
  })
}

export async function importCaseStudy(def, token) {
  const source = readJson(path.resolve(process.cwd(), '..', 'content', 'portfolio', def.file))
  const title = source.title
  const ogImageDoc = await resolveMediaByLegacyUrl(source?.seo?.og?.image, token)
  const images = await mapImages(source.images, token, `${title} activation image`)
  const unresolved = images.filter((img) => !img.media).map((img) => img.legacyUrl)

  const result = await upsertBySlug(
    'case-studies',
    def.slug,
    {
      title,
      slug: def.slug,
      _status: 'published',
      status: 'published',
      isEnabled: true,
      listOrder: def.listOrder,
      hero: {
        headline: source?.hero?.headline || title,
        subheadline: source?.hero?.subheadline || '',
        tags: asArray(source?.hero?.tags).map((tag) => ({ tag })),
      },
      metadata: {
        client: source?.metadata?.client || '',
        location: source?.metadata?.location || '',
        type: source?.metadata?.type || '',
        partners: asArray(source?.metadata?.partners).map((name) => ({ name })),
      },
      seo: {
        title: source?.seo?.title || `${title} - Case Study`,
        description: source?.seo?.description || '',
        ogTitle: source?.seo?.og?.title || source?.seo?.title || title,
        ogDescription: source?.seo?.og?.description || source?.seo?.description || '',
        canonicalUrl: `/case-studies/${def.slug}`,
        noindex: false,
        ogImage: ogImageDoc?.id,
        ogImageLegacyUrl: source?.seo?.og?.image || '',
      },
      body: mapBody(def.body),
      images,
      videos: mapVideos(source.videos),
    },
    token,
  )

  return { result, unresolved }
}

async function run() {
  assertCredentials()
  const token = await login()
  for (const def of CASE_STUDIES) {
    const { result, unresolved } = await importCaseStudy(def, token)
    const slug = result?.doc?.slug || result?.slug || def.slug
    console.log(`Upserted case study: ${slug}`)
    if (unresolved.length > 0) {
      console.log(`  WARNING: ${unresolved.length} image(s) had no matching media doc (legacyUrl fallback):`)
      for (const url of unresolved) console.log(`   - ${url}`)
    }
  }
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  run().catch((error) => {
    console.error('Case study import failed:', error.message)
    process.exitCode = 1
  })
}

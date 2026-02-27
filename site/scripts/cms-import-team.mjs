import path from 'path'
import { pathToFileURL } from 'url'
import {
  assertCredentials,
  login,
  normalizeSlug,
  readJson,
  resolveMediaByLegacyUrl,
  upsertBySlug,
} from './cms-import-utils.mjs'

const CONTENT_ROOT = path.resolve(process.cwd(), '..', 'content')
const TEAM_FILE = path.join(CONTENT_ROOT, 'team.json')

function asArray(input) {
  return Array.isArray(input) ? input : []
}

export async function importTeam(token) {
  const source = readJson(TEAM_FILE)
  const members = asArray(source.members)
  let count = 0

  for (const member of members) {
    const slug = normalizeSlug(member.slug || member.name)
    const photoDoc = await resolveMediaByLegacyUrl(member?.photo?.url, token)
    await upsertBySlug(
      'team',
      slug,
      {
        name: member.name || slug,
        slug,
        title: member.title || '',
        bio: member.bio || '',
        status: 'published',
        isEnabled: true,
        order: typeof member.order === 'number' ? member.order : 0,
        expertise: asArray(member.expertise).map((item) => ({ value: item })),
        photo: {
          media: photoDoc?.id,
          legacyUrl: member?.photo?.url || '',
          alt: member?.photo?.alt || member.name || 'Team member',
        },
      },
      token,
    )
    count += 1
  }

  return { count }
}

async function run() {
  assertCredentials()
  const token = await login()
  const result = await importTeam(token)
  console.log(`Imported team members: ${result.count}`)
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  run().catch((error) => {
    console.error('Team import failed:', error.message)
    process.exitCode = 1
  })
}

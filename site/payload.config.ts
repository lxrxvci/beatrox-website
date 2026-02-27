import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Users } from './payload/collections/Users.ts'
import { Media } from './payload/collections/Media.ts'
import { Pages } from './payload/collections/Pages.ts'
import { Projects } from './payload/collections/Projects.ts'
import { Services } from './payload/collections/Services.ts'
import { Team } from './payload/collections/Team.ts'
import { Redirects } from './payload/collections/Redirects.ts'
import { Navigation } from './payload/globals/Navigation.ts'
import { SiteStyles } from './payload/globals/SiteStyles.ts'
import { SeoDefaults } from './payload/globals/SeoDefaults.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const defaultDatabasePath = path.resolve(dirname, '.cms-data', 'payload.db')
fs.mkdirSync(path.dirname(defaultDatabasePath), { recursive: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  secret: process.env.PAYLOAD_SECRET || 'dev-only-secret-change-me',
  editor: lexicalEditor(),
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || `file:${defaultDatabasePath}`,
    },
    push: true,
  }),
  collections: [Users, Media, Redirects, Pages, Projects, Services, Team],
  globals: [Navigation, SiteStyles, SeoDefaults],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Users } from './payload/collections/Users.ts'
import { Media } from './payload/collections/Media.ts'
import { Pages } from './payload/collections/Pages.ts'
import { Projects } from './payload/collections/Projects.ts'
import { CaseStudies } from './payload/collections/CaseStudies.ts'
import { Services } from './payload/collections/Services.ts'
import { Team } from './payload/collections/Team.ts'
import { Redirects } from './payload/collections/Redirects.ts'
import { Navigation } from './payload/globals/Navigation.ts'
import { SiteStyles } from './payload/globals/SiteStyles.ts'
import { SeoDefaults } from './payload/globals/SeoDefaults.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  secret: process.env.PAYLOAD_SECRET || 'dev-only-secret-change-me',
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || 'postgresql://localhost:5432/beatrox',
    },
    push: true,
  }),
  collections: [Users, Media, Redirects, Pages, Projects, CaseStudies, Services, Team],
  globals: [Navigation, SiteStyles, SeoDefaults],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Users } from './payload/collections/Users.ts'
import { Media } from './payload/collections/Media.ts'
import { Pages } from './payload/collections/Pages.ts'
import { Projects } from './payload/collections/Projects.ts'
import { CaseStudies } from './payload/collections/CaseStudies.ts'
import { Services } from './payload/collections/Services.ts'
import { Team } from './payload/collections/Team.ts'
import { Redirects } from './payload/collections/Redirects.ts'
import { ContactSubmissions } from './payload/collections/ContactSubmissions.ts'
import { ConsultationTypes } from './payload/collections/ConsultationTypes.ts'
import { AvailabilityRules } from './payload/collections/AvailabilityRules.ts'
import { BlackoutDates } from './payload/collections/BlackoutDates.ts'
import { Consultations } from './payload/collections/Consultations.ts'
import { Navigation } from './payload/globals/Navigation.ts'
import { SiteStyles } from './payload/globals/SiteStyles.ts'
import { SeoDefaults } from './payload/globals/SeoDefaults.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Read via indirection so Turbopack cannot inline the value at build time —
// the token must be a true runtime read (env vars change between deploys).
const runtimeEnv = process.env

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
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || 'postgresql://localhost:5432/beatrox',
    },
    push: true,
  }),
  collections: [Users, Media, Redirects, ContactSubmissions, ConsultationTypes, AvailabilityRules, BlackoutDates, Consultations, Pages, Projects, CaseStudies, Services, Team],
  globals: [Navigation, SiteStyles, SeoDefaults],
  plugins: [
    // Media files are served from Vercel Blob when a store is provisioned
    // (BLOB_READ_WRITE_TOKEN set). Without it, uploads stay on local disk and
    // all existing legacyUrl fields keep serving current content.
    vercelBlobStorage({
      enabled: Boolean(runtimeEnv.BLOB_READ_WRITE_TOKEN),
      // Media read access is fully public, so serve direct Blob URLs (CDN)
      // instead of proxying every image request through a lambda.
      collections: { media: { disablePayloadAccessControl: true } },
      token: runtimeEnv.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

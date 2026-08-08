import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { Users } from './payload/collections/Users.ts'
import { Media } from './payload/collections/Media.ts'
import { Pages } from './payload/collections/Pages.ts'
import { Projects } from './payload/collections/Projects.ts'
import { CaseStudies } from './payload/collections/CaseStudies.ts'
import { Services } from './payload/collections/Services.ts'
import { Team } from './payload/collections/Team.ts'
import { Redirects } from './payload/collections/Redirects.ts'
import { ContactSubmissions } from './payload/collections/ContactSubmissions.ts'
import { Clients } from './payload/collections/Clients.ts'
import { Deals } from './payload/collections/Deals.ts'
import { Activities } from './payload/collections/Activities.ts'
import { ConsultationTypes } from './payload/collections/ConsultationTypes.ts'
import { AvailabilityRules } from './payload/collections/AvailabilityRules.ts'
import { BlackoutDates } from './payload/collections/BlackoutDates.ts'
import { Consultations } from './payload/collections/Consultations.ts'
import { Navigation } from './payload/globals/Navigation.ts'
import { SiteStyles } from './payload/globals/SiteStyles.ts'
import { SeoDefaults } from './payload/globals/SeoDefaults.ts'
import { CapabilityTiles } from './payload/globals/CapabilityTiles.ts'
import { consultationReminderTask } from './payload/jobs/consultation-reminder.ts'
import { staleLeadNudgeTask } from './payload/jobs/stale-lead-nudge.ts'
import { weeklyKpiDigestTask } from './payload/jobs/weekly-kpi-digest.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Read via indirection so Turbopack cannot inline the value at build time
// the token must be a true runtime read (env vars change between deploys).
const runtimeEnv = process.env

// Never fall back to the dev secret in production, fail fast at config load.
const payloadSecret = runtimeEnv.PAYLOAD_SECRET
if (!payloadSecret && runtimeEnv.NODE_ENV === 'production') {
  throw new Error('PAYLOAD_SECRET environment variable is required in production.')
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      views: {
        dashboard: {
          Component: '/components/payload/dashboard/DashboardView#DashboardView',
        },
        calendar: {
          Component: '/components/payload/CalendarView#CalendarView',
          path: '/calendar',
          exact: true,
        },
      },
    },
  },
  secret: payloadSecret || 'dev-only-secret-change-me',
  editor: lexicalEditor(),
  // Payload-level email (password resets, etc.) goes through Resend SMTP.
  // Without RESEND_API_KEY the adapter is omitted and email logs to console,
  // matching the behavior of lib/email.ts.
  ...(runtimeEnv.RESEND_API_KEY
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: runtimeEnv.BOOKING_FROM_EMAIL || 'hello@beatrox.com',
          defaultFromName: 'BEATROX',
          skipVerify: true,
          transportOptions: {
            host: 'smtp.resend.com',
            port: 465,
            secure: true,
            auth: {
              user: 'resend',
              pass: runtimeEnv.RESEND_API_KEY,
            },
          },
        }),
      }
    : {}),
  jobs: {
    tasks: [consultationReminderTask, staleLeadNudgeTask, weeklyKpiDigestTask],
    // Process the queue every 15 minutes (request-driven), and let task
    // `schedule` crons queue new jobs. On Vercel, a cron hits
    // /api/payload-jobs/run so jobs also run with zero site traffic.
    autoRun: [{ cron: '*/15 * * * *', queue: 'default' }],
    access: {
      run: ({ req }) => {
        if (req.user) return true
        const cronSecret = runtimeEnv.CRON_SECRET
        if (!cronSecret) return false
        return req.headers.get('authorization') === `Bearer ${cronSecret}`
      },
    },
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || 'postgresql://localhost:5432/beatrox',
    },
    push: runtimeEnv.NODE_ENV !== 'production',
  }),
  collections: [Users, Media, Redirects, ContactSubmissions, Clients, Deals, Activities, ConsultationTypes, AvailabilityRules, BlackoutDates, Consultations, Pages, Projects, CaseStudies, Services, Team],
  globals: [Navigation, SiteStyles, SeoDefaults, CapabilityTiles],
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

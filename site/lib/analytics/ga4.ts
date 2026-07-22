import { unstable_cache } from 'next/cache'
import { google } from 'googleapis'

export interface Ga4TrendPoint {
  date: string // yyyyMMdd
  sessions: number
  pageviews: number
}

export interface Ga4TopPage {
  path: string
  pageviews: number
}

export interface Ga4TopSource {
  source: string
  sessions: number
}

export interface Ga4DashboardData {
  sessions: number
  users: number
  pageviews: number
  avgSessionDurationSec: number
  trend: Ga4TrendPoint[]
  topPages: Ga4TopPage[]
  topSources: Ga4TopSource[]
}

function getAnalyticsClient() {
  const clientEmail = process.env.GA4_CLIENT_EMAIL
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const propertyId = process.env.GA4_PROPERTY_ID

  if (!clientEmail || !privateKey || !propertyId) {
    return null
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  })

  return { client: google.analyticsdata({ version: 'v1beta', auth }), propertyId }
}

async function fetchGa4Dashboard(days: number): Promise<Ga4DashboardData | null> {
  const analytics = getAnalyticsClient()
  if (!analytics) return null

  const { client, propertyId } = analytics
  const property = `properties/${propertyId}`
  const dateRange = { startDate: `${days}daysAgo`, endDate: 'today' }

  try {
    const [summaryRes, pagesRes, sourcesRes] = await Promise.all([
      client.properties.runReport({
        property,
        requestBody: {
          dateRanges: [dateRange],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        },
      }),
      client.properties.runReport({
        property,
        requestBody: {
          dateRanges: [dateRange],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: '8',
        },
      }),
      client.properties.runReport({
        property,
        requestBody: {
          dateRanges: [dateRange],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: '8',
        },
      }),
    ])

    const rows = summaryRes.data.rows || []
    const metric = (row: (typeof rows)[number], index: number) =>
      Number(row.metricValues?.[index]?.value || 0)

    return {
      sessions: rows.reduce((sum, row) => sum + metric(row, 0), 0),
      users: rows.reduce((sum, row) => sum + metric(row, 1), 0),
      pageviews: rows.reduce((sum, row) => sum + metric(row, 2), 0),
      avgSessionDurationSec: rows.length
        ? rows.reduce((sum, row) => sum + metric(row, 3), 0) / rows.length
        : 0,
      trend: rows.map((row) => ({
        date: row.dimensionValues?.[0]?.value || '',
        sessions: metric(row, 0),
        pageviews: metric(row, 2),
      })),
      topPages: (pagesRes.data.rows || []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || '',
        pageviews: Number(row.metricValues?.[0]?.value || 0),
      })),
      topSources: (sourcesRes.data.rows || []).map((row) => ({
        source: row.dimensionValues?.[0]?.value || '',
        sessions: Number(row.metricValues?.[0]?.value || 0),
      })),
    }
  } catch (error) {
    console.error('[ga4] Failed to fetch analytics:', error)
    return null
  }
}

/**
 * GA4 dashboard data, cached for 1 hour so the admin dashboard never blocks
 * on Google. Returns null when GA4 env vars are missing or the API fails —
 * callers render a "connect GA4" placeholder instead of erroring.
 */
export async function getGa4Dashboard(days = 30): Promise<Ga4DashboardData | null> {
  const cached = unstable_cache(
    async (daysKey: number) => fetchGa4Dashboard(daysKey),
    ['ga4-dashboard'],
    { revalidate: 3600 },
  )
  return cached(days)
}

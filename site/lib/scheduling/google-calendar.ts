import { google, type calendar_v3 } from 'googleapis'
import crypto from 'crypto'

export interface GoogleCalendarCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
}

export interface CreateCalendarEventInput {
  summary: string
  description?: string
  startTime: Date
  endTime: Date
  timezone: string
  attendees: { email: string; displayName?: string }[]
}

export interface CreateCalendarEventResult {
  eventId: string
  htmlLink: string
  meetLink: string
}

function getCredentials(): GoogleCalendarCredentials | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    return null
  }

  return { clientId, clientSecret, refreshToken }
}

export function isGoogleCalendarConfigured(): boolean {
  return getCredentials() !== null
}

function getCalendarClient(credentials: GoogleCalendarCredentials) {
  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    'http://localhost',
  )
  oauth2Client.setCredentials({ refresh_token: credentials.refreshToken })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<CreateCalendarEventResult | null> {
  const credentials = getCredentials()
  if (!credentials) {
    console.warn('[google-calendar] Credentials missing; skipping calendar event creation.')
    return null
  }

  const calendar = getCalendarClient(credentials)
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

  const event: calendar_v3.Schema$Event = {
    summary: input.summary,
    description: input.description,
    start: {
      dateTime: input.startTime.toISOString(),
      timeZone: input.timezone,
    },
    end: {
      dateTime: input.endTime.toISOString(),
      timeZone: input.timezone,
    },
    attendees: input.attendees.map((attendee) => ({
      email: attendee.email,
      displayName: attendee.displayName,
      responseStatus: 'needsAction',
    })),
    guestsCanInviteOthers: false,
    guestsCanSeeOtherGuests: false,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 * 24 },
        { method: 'email', minutes: 60 },
      ],
    },
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  }

  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      conferenceDataVersion: 1,
    })

    const eventId = response.data.id
    const htmlLink = response.data.htmlLink
    const meetLink =
      response.data.conferenceData?.entryPoints?.find(
        (entry) => entry.entryPointType === 'video',
      )?.uri || ''

    if (!eventId) {
      throw new Error('Google Calendar event creation returned no event ID')
    }

    return { eventId, htmlLink: htmlLink || '', meetLink: meetLink || '' }
  } catch (error) {
    console.error('[google-calendar] Failed to create calendar event:', error)
    return null
  }
}

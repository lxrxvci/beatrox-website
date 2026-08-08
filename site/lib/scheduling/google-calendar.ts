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

export interface UpdateCalendarEventInput {
  eventId: string
  summary?: string
  description?: string
  startTime: Date
  endTime: Date
  timezone: string
}

/**
 * Patch an existing event's time window (reschedule). Attendees are notified
 * by Google (sendUpdates: 'all'). Returns false when unconfigured or on error.
 */
export async function updateCalendarEvent(input: UpdateCalendarEventInput): Promise<boolean> {
  const credentials = getCredentials()
  if (!credentials) {
    console.warn('[google-calendar] Credentials missing; skipping calendar event update.')
    return false
  }

  const calendar = getCalendarClient(credentials)
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

  try {
    await calendar.events.patch({
      calendarId,
      eventId: input.eventId,
      sendUpdates: 'all',
      requestBody: {
        ...(input.summary ? { summary: input.summary } : {}),
        ...(input.description ? { description: input.description } : {}),
        start: {
          dateTime: input.startTime.toISOString(),
          timeZone: input.timezone,
        },
        end: {
          dateTime: input.endTime.toISOString(),
          timeZone: input.timezone,
        },
      },
    })
    return true
  } catch (error) {
    console.error('[google-calendar] Failed to update calendar event:', error)
    return false
  }
}

/**
 * Delete an event (cancellation). Attendees are notified by Google.
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const credentials = getCredentials()
  if (!credentials) {
    console.warn('[google-calendar] Credentials missing; skipping calendar event deletion.')
    return false
  }

  const calendar = getCalendarClient(credentials)
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all',
    })
    return true
  } catch (error) {
    console.error('[google-calendar] Failed to delete calendar event:', error)
    return false
  }
}

export interface BusyInterval {
  start: Date
  end: Date
}

/**
 * Busy intervals on the bookings calendar, so externally-created events
 * block consultation slots. Returns [] when unconfigured or on error
 * availability must never break because Google is unreachable.
 */
export async function getBusyIntervals(timeMin: Date, timeMax: Date): Promise<BusyInterval[]> {
  const credentials = getCredentials()
  if (!credentials) {
    return []
  }

  const calendar = getCalendarClient(credentials)
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: calendarId }],
      },
    })

    const busy = response.data.calendars?.[calendarId]?.busy || []
    return busy
      .filter((entry) => entry.start && entry.end)
      .map((entry) => ({ start: new Date(entry.start as string), end: new Date(entry.end as string) }))
  } catch (error) {
    console.error('[google-calendar] Failed to query free/busy:', error)
    return []
  }
}

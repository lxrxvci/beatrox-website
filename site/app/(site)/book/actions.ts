'use server'

import { addHours, format } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import payloadConfig from '@/payload.config'
import { getAvailableSlots } from '@/lib/scheduling/availability'
import { createCalendarEvent } from '@/lib/scheduling/google-calendar'
import { sendBookingConfirmation, sendInternalBookingNotification } from '@/lib/email'
import { hashIp, isRateLimited } from '@/lib/rate-limit'

const DEFAULT_TIMEZONE = 'America/Los_Angeles'

export interface SlotOption {
  startTime: string
  endTime: string
  timezone: string
  displayTime: string
  displayPeriod: string
}

export interface BookingFormState {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  meetLink?: string
  startTime?: string
  timezone?: string
}

function toISOLocal(date: Date, timezone: string): string {
  const zoned = toZonedTime(date, timezone)
  return format(zoned, "yyyy-MM-dd'T'HH:mm:ss")
}

function formatSlotDisplay(date: Date, timezone: string): { time: string; period: string } {
  const zoned = toZonedTime(date, timezone)
  return {
    time: format(zoned, 'h:mm'),
    period: format(zoned, 'a'),
  }
}

export async function getAvailableSlotsForDate(
  consultationTypeId: string | number,
  date: string,
): Promise<SlotOption[]> {
  try {
    const payload = await getPayload({ config: payloadConfig })

    const dayStart = fromZonedTime(`${date}T00:00:00`, DEFAULT_TIMEZONE)
    const dayEnd = fromZonedTime(`${date}T23:59:59`, DEFAULT_TIMEZONE)

    const allSlots = await getAvailableSlots(payload, {
      consultationTypeId,
      from: addHours(dayStart, -24),
      to: addHours(dayEnd, 24),
    })

    const filtered = allSlots.filter((slot) => {
      const slotDateStr = format(toZonedTime(slot.startTime, slot.timezone), 'yyyy-MM-dd')
      return slotDateStr === date
    })

    return filtered.map((slot) => {
      const display = formatSlotDisplay(slot.startTime, slot.timezone)
      return {
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        timezone: slot.timezone,
        displayTime: display.time,
        displayPeriod: display.period,
      }
    })
  } catch (error) {
    console.error('[book/getAvailableSlotsForDate] Error:', error)
    return []
  }
}

function validateBookingInput(formData: FormData): {
  valid: boolean
  errors?: Record<string, string[]>
  data?: Record<string, unknown>
} {
  const errors: Record<string, string[]> = {}

  const typeId = formData.get('typeId')?.toString()
  const startTime = formData.get('startTime')?.toString()
  const endTime = formData.get('endTime')?.toString()
  const timezone = formData.get('timezone')?.toString()
  const name = formData.get('name')?.toString().trim()
  const email = formData.get('email')?.toString().trim()
  const company = formData.get('company')?.toString().trim()
  const phone = formData.get('phone')?.toString().trim()
  const projectSummary = formData.get('projectSummary')?.toString().trim()

  if (!typeId) errors.typeId = ['Please select a consultation type.']
  if (!startTime || !endTime || !timezone) errors.slot = ['Please select a date and time.']
  if (!name || name.length < 2) errors.name = ['Please enter your name.']
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = ['Please enter a valid email address.']
  }
  if (!projectSummary || projectSummary.length < 10) {
    errors.projectSummary = ['Please tell us a bit more about your project (at least 10 characters).']
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors }
  }

  const utm = {
    source: formData.get('utm_source')?.toString().trim() || undefined,
    medium: formData.get('utm_medium')?.toString().trim() || undefined,
    campaign: formData.get('utm_campaign')?.toString().trim() || undefined,
    gclid: formData.get('gclid')?.toString().trim() || undefined,
  }

  return {
    valid: true,
    data: {
      typeId,
      startTime,
      endTime,
      timezone,
      name,
      email,
      company,
      phone,
      projectSummary,
      ...(Object.values(utm).some(Boolean) ? { utm } : {}),
    },
  }
}

export async function bookConsultation(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  // Honeypot: hidden field humans never fill. Silently fake success for bots.
  if (formData.get('website')?.toString().trim()) {
    return {
      success: true,
      message: 'Your consultation is booked. You will receive a confirmation email shortly with meeting details.',
    }
  }

  const validation = validateBookingInput(formData)
  if (!validation.valid) {
    return {
      success: false,
      message: 'Please fix the errors below.',
      errors: validation.errors,
    }
  }

  // Best-effort per-IP throttle (see lib/rate-limit.ts).
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null
  if (isRateLimited(hashIp(ip))) {
    return {
      success: false,
      message: 'Too many booking attempts. Please try again in a few minutes.',
    }
  }

  const {
    typeId,
    startTime,
    endTime,
    timezone,
    name,
    email,
    company,
    phone,
    projectSummary,
    utm,
  } = validation.data as Record<string, string> & {
    utm?: { source?: string; medium?: string; campaign?: string; gclid?: string }
  }

  try {
    const payload = await getPayload({ config: payloadConfig })

    const slotStart = new Date(startTime)
    const slotEnd = new Date(endTime)

    // Re-verify the slot is still available before booking.
    const available = await getAvailableSlots(payload, {
      consultationTypeId: typeId,
      from: addHours(slotStart, -1),
      to: addHours(slotEnd, 1),
    })

    const slotStillAvailable = available.some(
      (slot) =>
        slot.startTime.toISOString() === slotStart.toISOString() &&
        slot.endTime.toISOString() === slotEnd.toISOString(),
    )

    if (!slotStillAvailable) {
      return {
        success: false,
        message: 'This time slot is no longer available. Please select another.',
      }
    }

    const typeDoc = await payload.findByID({
      collection: 'consultation-types',
      id: typeId,
    })

    const typeIdNumber = Number.parseInt(typeId, 10)
    if (!Number.isFinite(typeIdNumber)) {
      return {
        success: false,
        message: 'Invalid consultation type. Please reload the page and try again.',
      }
    }

    const consultation = await payload.create({
      collection: 'consultations',
      // Trusted server-side write — collection create access requires an
      // authenticated user; this validated action is the public write path.
      overrideAccess: true,
      data: {
        type: typeIdNumber,
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        timezone,
        clientName: name,
        clientEmail: email,
        clientCompany: company || undefined,
        phone: phone || undefined,
        projectSummary: projectSummary || undefined,
        status: 'new',
        source: 'website',
        ...(utm ? { utm } : {}),
      },
    })

    const calendarResult = await createCalendarEvent({
      summary: `BEATROX ${typeDoc.name} — ${name}`,
      description: [
        projectSummary,
        company ? `Company: ${company}` : '',
        phone ? `Phone: ${phone}` : '',
        'Booked via beatrox.com',
      ]
        .filter(Boolean)
        .join('\n\n'),
      startTime: slotStart,
      endTime: slotEnd,
      timezone,
      attendees: [{ email, displayName: name }],
    })

    if (calendarResult) {
      await payload.update({
        collection: 'consultations',
        id: consultation.id,
        // Trusted server-side write of the Google Calendar sync fields.
        overrideAccess: true,
        data: {
          googleCalendarEventId: calendarResult.eventId,
          googleMeetLink: calendarResult.meetLink,
          status: 'confirmed',
        },
      })
    }

    await sendBookingConfirmation({
      to: email,
      name,
      consultationType: typeDoc.name as string,
      startTime: slotStart,
      endTime: slotEnd,
      timezone,
      meetLink: calendarResult?.meetLink,
    })

    await sendInternalBookingNotification({
      name,
      email,
      company,
      phone,
      consultationType: typeDoc.name as string,
      startTime: slotStart,
      endTime: slotEnd,
      timezone,
      projectSummary,
      adminUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://beatrox-website.vercel.app'}/admin/collections/consultations/${consultation.id}`,
    })

    return {
      success: true,
      message: calendarResult?.meetLink
        ? 'Your consultation is booked. A calendar invite with a Google Meet link has been emailed to you.'
        : 'Your consultation is booked. You will receive a confirmation email shortly with meeting details.',
      meetLink: calendarResult?.meetLink,
      startTime: toISOLocal(slotStart, timezone),
      timezone,
    }
  } catch (error) {
    console.error('[book/bookConsultation] Error:', error)
    return {
      success: false,
      message: 'Something went wrong while booking your consultation. Please try again or contact us directly.',
    }
  }
}

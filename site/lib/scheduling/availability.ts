import { addDays, addMinutes, format, isAfter, isBefore, isEqual } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import type { Payload } from 'payload'

export interface AvailableSlot {
  startTime: Date
  endTime: Date
  timezone: string
}

export interface GetAvailableSlotsOptions {
  consultationTypeId: string | number
  from: Date
  to: Date
}

const DEFAULT_TIMEZONE = 'America/Los_Angeles'
const BOOKING_BUFFER_HOURS = 24
const MAX_BOOKING_DAYS = 60

function normalizeId(id: unknown): string {
  return String(id)
}

function getDayOfWeekInTimezone(date: Date, timezone: string): string {
  const zoned = toZonedTime(date, timezone)
  const isoDay = parseInt(format(zoned, 'i'), 10) // 1 = Monday, 7 = Sunday
  return String(isoDay % 7) // 0 = Sunday, 1 = Monday, ...
}

function parseTimeOnDate(dateStr: string, timeStr: string, timezone: string): Date {
  return fromZonedTime(`${dateStr}T${timeStr}:00`, timezone)
}

function overlaps(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return (isBefore(start1, end2) || isEqual(start1, end2)) && isAfter(end1, start2)
}

function ruleAppliesToType(
  rule: Record<string, unknown>,
  consultationTypeId: string | number,
): boolean {
  const allowed = rule.consultationTypes
  if (!Array.isArray(allowed) || allowed.length === 0) return true
  const target = normalizeId(consultationTypeId)
  return allowed.some((item: unknown) => {
    if (typeof item === 'number' || typeof item === 'string') {
      return normalizeId(item) === target
    }
    if (item && typeof item === 'object' && 'id' in item) {
      return normalizeId((item as { id: unknown }).id) === target
    }
    return false
  })
}

export async function getAvailableSlots(
  payload: Payload,
  options: GetAvailableSlotsOptions,
): Promise<AvailableSlot[]> {
  const { consultationTypeId, from, to } = options

  // Trusted server-side scheduling engine: bypass access control (collections
  // are auth-only reads) so anonymous booking flows see rules/blackouts/bookings.
  const typeDoc = await payload.findByID({
    collection: 'consultation-types',
    id: consultationTypeId,
    overrideAccess: true,
  })

  if (!typeDoc || !typeDoc.isEnabled) {
    throw new Error('Consultation type not found or not enabled')
  }

  const duration = typeof typeDoc.duration === 'number' ? typeDoc.duration : 30

  const now = new Date()
  const earliestAllowed = addMinutes(now, BOOKING_BUFFER_HOURS * 60)
  const maxAllowed = addMinutes(now, MAX_BOOKING_DAYS * 24 * 60)

  const effectiveFrom = isAfter(from, earliestAllowed) ? from : earliestAllowed
  const effectiveTo = isBefore(to, maxAllowed) ? to : maxAllowed

  if (isAfter(effectiveFrom, effectiveTo)) {
    return []
  }

  const rulesRes = await payload.find({
    collection: 'availability-rules',
    where: { isEnabled: { equals: true } },
    limit: 1000,
    overrideAccess: true,
  })

  const rules = rulesRes.docs.filter((rule) => ruleAppliesToType(rule, consultationTypeId))

  const fromDateStr = format(effectiveFrom, 'yyyy-MM-dd')
  const toDateStr = format(effectiveTo, 'yyyy-MM-dd')

  const blackoutsRes = await payload.find({
    collection: 'blackout-dates',
    where: {
      isEnabled: { equals: true },
      date: {
        greater_than_equal: fromDateStr,
        less_than_equal: toDateStr,
      },
    },
    limit: 1000,
    overrideAccess: true,
  })

  const existingRes = await payload.find({
    collection: 'consultations',
    where: {
      status: { in: ['new', 'confirmed'] },
      startTime: { less_than_equal: effectiveTo.toISOString() },
      endTime: { greater_than_equal: effectiveFrom.toISOString() },
    },
    limit: 1000,
    overrideAccess: true,
  })

  const existingBookings = existingRes.docs.map((doc) => ({
    start: new Date(doc.startTime as string),
    end: new Date(doc.endTime as string),
    timezone: (doc.timezone as string) || DEFAULT_TIMEZONE,
  }))

  const blackoutRanges = (blackoutsRes.docs as Record<string, unknown>[]).map((doc) => {
    const dateStr = format(new Date(doc.date as string), 'yyyy-MM-dd')
    const tz = DEFAULT_TIMEZONE
    if (doc.isAllDay) {
      return {
        start: parseTimeOnDate(dateStr, '00:00', tz),
        end: parseTimeOnDate(dateStr, '23:59', tz),
      }
    }
    return {
      start: parseTimeOnDate(dateStr, (doc.startTime as string) || '00:00', tz),
      end: parseTimeOnDate(dateStr, (doc.endTime as string) || '23:59', tz),
    }
  })

  const timezones = new Set<string>(rules.map((rule) => (rule.timezone as string) || DEFAULT_TIMEZONE))
  const slots: AvailableSlot[] = []

  for (const timezone of timezones) {
    const zonedFrom = toZonedTime(effectiveFrom, timezone)
    const zonedTo = toZonedTime(effectiveTo, timezone)

    let cursorDate = new Date(`${format(zonedFrom, 'yyyy-MM-dd')}T00:00:00`)
    const endDate = new Date(`${format(zonedTo, 'yyyy-MM-dd')}T00:00:00`)

    while (!isAfter(cursorDate, endDate)) {
      const dateStr = format(cursorDate, 'yyyy-MM-dd')
      const dayOfWeek = getDayOfWeekInTimezone(
        fromZonedTime(`${dateStr}T00:00:00`, timezone),
        timezone,
      )

      const dayRules = rules.filter(
        (rule) => ((rule.timezone as string) || DEFAULT_TIMEZONE) === timezone && rule.dayOfWeek === dayOfWeek,
      )

      for (const rule of dayRules) {
        const start = parseTimeOnDate(dateStr, rule.startTime as string, timezone)
        const end = parseTimeOnDate(dateStr, rule.endTime as string, timezone)

        if (!isBefore(start, end)) continue

        let slotStart = start
        while (isBefore(slotStart, end) || isEqual(slotStart, end)) {
          const slotEnd = addMinutes(slotStart, duration)
          if (isAfter(slotEnd, end)) break

          const isBlockedByBuffer = isBefore(slotStart, earliestAllowed)
          const isBlockedByBlackout = blackoutRanges.some((range) =>
            overlaps(slotStart, slotEnd, range.start, range.end),
          )
          const isBlockedByExisting = existingBookings.some((booking) =>
            overlaps(slotStart, slotEnd, booking.start, booking.end),
          )

          if (!isBlockedByBuffer && !isBlockedByBlackout && !isBlockedByExisting) {
            slots.push({ startTime: slotStart, endTime: slotEnd, timezone })
          }

          slotStart = slotEnd
        }
      }

      cursorDate = addDays(cursorDate, 1)
    }
  }

  slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  return slots
}

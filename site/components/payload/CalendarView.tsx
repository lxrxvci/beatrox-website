import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import type { Consultation, ConsultationType } from '@/payload-types'

const TZ = 'America/Los_Angeles'

const STATUS_COLORS: Record<string, string> = {
  new: 'var(--theme-warning-500, #d97706)',
  confirmed: 'var(--theme-success-500, #059669)',
  cancelled: 'var(--theme-error-500, #dc2626)',
  completed: 'var(--theme-text, #888)',
}

function monthParam(raw: unknown): string {
  const value = typeof raw === 'string' ? raw : ''
  return /^\d{4}-\d{2}$/.test(value) ? value : format(new Date(), 'yyyy-MM')
}

export async function CalendarView({ initPageResult, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult
  const params = await Promise.resolve(searchParams)
  const month = monthParam(params?.month)

  const monthStart = fromZonedTime(`${month}-01T00:00:00`, TZ)
  const monthEnd = endOfMonth(monthStart)

  const result = await req.payload.find({
    collection: 'consultations',
    where: {
      startTime: { less_than: monthEnd.toISOString() },
      endTime: { greater_than: monthStart.toISOString() },
    },
    sort: 'startTime',
    limit: 500,
    depth: 1,
    overrideAccess: true,
    req,
  })

  // Bucket bookings by local day so the grid aligns with the LA calendar.
  const byDay = new Map<string, Consultation[]>()
  for (const doc of result.docs) {
    const key = format(toZonedTime(new Date(doc.startTime), doc.timezone || TZ), 'yyyy-MM-dd')
    const list = byDay.get(key) || []
    list.push(doc)
    byDay.set(key, list)
  }

  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const prevMonth = format(addMonths(monthStart, -1), 'yyyy-MM')
  const nextMonth = format(addMonths(monthStart, 1), 'yyyy-MM')
  const currentMonth = format(new Date(), 'yyyy-MM')

  const cellStyle: React.CSSProperties = {
    border: '1px solid var(--theme-elevation-150, #333)',
    minHeight: '110px',
    padding: '6px',
    verticalAlign: 'top',
  }

  return (
    <div style={{ padding: 'var(--gutter-h, 24px)', color: 'var(--theme-text)', maxWidth: '1400px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>{format(monthStart, 'MMMM yyyy')}</h1>
        <nav style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/admin/calendar?month=${prevMonth}`} style={navButtonStyle}>
            ← Prev
          </Link>
          <Link href={`/admin/calendar?month=${currentMonth}`} style={navButtonStyle}>
            Today
          </Link>
          <Link href={`/admin/calendar?month=${nextMonth}`} style={navButtonStyle}>
            Next →
          </Link>
        </nav>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <th
                key={day}
                style={{
                  textAlign: 'left',
                  padding: '6px',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  opacity: 0.6,
                }}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
            <tr key={weekIndex}>
              {days.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => {
                const key = format(day, 'yyyy-MM-dd')
                const bookings = byDay.get(key) || []
                const inMonth = isSameMonth(day, monthStart)
                return (
                  <td key={key} style={{ ...cellStyle, opacity: inMonth ? 1 : 0.35 }}>
                    <div style={{ fontSize: '12px', marginBottom: '4px', opacity: 0.7 }}>{format(day, 'd')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {bookings.map((booking) => {
                        const type =
                          typeof booking.type === 'object' && booking.type !== null
                            ? (booking.type as ConsultationType)
                            : null
                        const start = toZonedTime(new Date(booking.startTime), booking.timezone || TZ)
                        const cancelled = booking.status === 'cancelled'
                        return (
                          <Link
                            key={booking.id}
                            href={`/admin/collections/consultations/${booking.id}`}
                            title={`${type?.name || 'Consultation'}: ${booking.clientName} (${booking.status})`}
                            style={{
                              display: 'block',
                              fontSize: '11px',
                              lineHeight: 1.3,
                              padding: '3px 6px',
                              borderRadius: '3px',
                              color: '#fff',
                              background: cancelled
                                ? 'var(--theme-elevation-300, #555)'
                                : type?.color || 'var(--theme-success-600, #047857)',
                              borderLeft: `3px solid ${STATUS_COLORS[booking.status || 'new']}`,
                              textDecoration: cancelled ? 'line-through' : 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {format(start, 'h:mm a')} {booking.clientName}
                          </Link>
                        )
                      })}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: '12px', fontSize: '12px', opacity: 0.55 }}>
        {result.totalDocs} booking{result.totalDocs === 1 ? '' : 's'} this month · times shown in {TZ} · click a
        booking to open it
      </p>
    </div>
  )
}

const navButtonStyle: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: '13px',
  border: '1px solid var(--theme-elevation-150, #333)',
  borderRadius: '4px',
  textDecoration: 'none',
  color: 'inherit',
}

export default CalendarView

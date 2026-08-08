import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export interface BookingConfirmationInput {
  to: string
  name: string
  consultationType: string
  startTime: Date
  endTime: Date
  timezone: string
  meetLink?: string
}

export interface InternalNotificationInput {
  name: string
  email: string
  company?: string
  phone?: string
  consultationType: string
  startTime: Date
  endTime: Date
  timezone: string
  projectSummary?: string
  adminUrl: string
}

export interface ContactNotificationInput {
  name: string
  email: string
  company?: string
  eventType?: string
  services?: string[]
  eventDate?: string
  location?: string
  budget?: string
  message: string
  adminUrl: string
}

function formatBookingTime(date: Date, timezone: string): string {
  const zoned = toZonedTime(date, timezone)
  return format(zoned, "EEEE, MMMM do yyyy 'at' h:mm a")
}

// Escape user-controlled values before interpolating into HTML email bodies.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sendEmail(options: {
  to: string | string[]
  subject: string
  text: string
  html: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.log('[email] RESEND_API_KEY not configured; logging email instead:')
    console.log('  To:', options.to)
    console.log('  Subject:', options.subject)
    console.log('  Body:', options.text)
    return
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    // Sends go from the verified Resend domain (rental.beatrox.com) until
    // beatrox.com is verified; replies route to admin@beatrox.com.
    const from = process.env.BOOKING_FROM_EMAIL || 'Beatrox <admin@rental.beatrox.com>'
    const replyTo = process.env.BOOKING_REPLY_TO_EMAIL || 'admin@beatrox.com'

    // The Resend SDK reports delivery API failures on the result object
    // instead of throwing, so check `error` explicitly.
    const { error } = await resend.emails.send({
      from,
      replyTo,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    if (error) {
      console.error('[email] Resend API error:', error)
    }
  } catch (error) {
    console.error('[email] Failed to send email:', error)
  }
}

export async function sendBookingConfirmation(input: BookingConfirmationInput): Promise<void> {
  const timeText = `${formatBookingTime(input.startTime, input.timezone)} ${input.timezone}`

  const text = [
    `Hi ${input.name},`,
    '',
    `Your ${input.consultationType} with BEATROX is booked for ${timeText}.`,
    '',
    input.meetLink
      ? `Google Meet link: ${input.meetLink}`
      : 'Our team will confirm this time and send your meeting link by email.',
    '',
    'If you need to reschedule, please reply to this email or contact us at admin@beatrox.com.',
    '',
    'Looking forward to talking with you,',
    'The BEATROX team',
  ].join('\n')

  const html = `
    <div style="font-family: Inter, sans-serif; color: #111;">
      <p>Hi ${escapeHtml(input.name)},</p>
      <p>Your <strong>${escapeHtml(input.consultationType)}</strong> with BEATROX is booked for:</p>
      <p style="font-size: 18px; font-weight: 600;">${escapeHtml(timeText)}</p>
      ${input.meetLink ? `<p><a href="${escapeHtml(input.meetLink)}">Join Google Meet</a></p>` : '<p>Our team will confirm this time and send your meeting link by email.</p>'}
      <p>If you need to reschedule, please reply to this email or contact us at <a href="mailto:admin@beatrox.com">admin@beatrox.com</a>.</p>
      <p>Looking forward to talking with you,<br>The BEATROX team</p>
    </div>
  `

  await sendEmail({
    to: input.to,
    subject: input.meetLink
      ? `Your BEATROX ${input.consultationType} is confirmed`
      : `Your BEATROX ${input.consultationType} booking`,
    text,
    html,
  })
}

export async function sendInternalBookingNotification(input: InternalNotificationInput): Promise<void> {
  const notificationEmail = process.env.BOOKING_NOTIFICATION_EMAIL || 'admin@beatrox.com'
  const timeText = `${formatBookingTime(input.startTime, input.timezone)} ${input.timezone}`

  const text = [
    'New consultation booking:',
    '',
    `Type: ${input.consultationType}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    input.company ? `Company: ${input.company}` : '',
    input.phone ? `Phone: ${input.phone}` : '',
    `Time: ${timeText}`,
    '',
    'Project summary:',
    input.projectSummary || '',
    '',
    `View in admin: ${input.adminUrl}`,
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
    <div style="font-family: Inter, sans-serif; color: #111;">
      <h2>New consultation booking</h2>
      <ul>
        <li><strong>Type:</strong> ${escapeHtml(input.consultationType)}</li>
        <li><strong>Name:</strong> ${escapeHtml(input.name)}</li>
        <li><strong>Email:</strong> ${escapeHtml(input.email)}</li>
        ${input.company ? `<li><strong>Company:</strong> ${escapeHtml(input.company)}</li>` : ''}
        ${input.phone ? `<li><strong>Phone:</strong> ${escapeHtml(input.phone)}</li>` : ''}
        <li><strong>Time:</strong> ${escapeHtml(timeText)}</li>
      </ul>
      <p><strong>Project summary:</strong></p>
      <p>${escapeHtml(input.projectSummary || '')}</p>
      <p><a href="${escapeHtml(input.adminUrl)}">View in admin</a></p>
    </div>
  `

  await sendEmail({
    to: notificationEmail,
    subject: `New booking: ${input.consultationType} for ${input.name}`,
    text,
    html,
  })
}

export async function sendContactNotification(input: ContactNotificationInput): Promise<void> {
  const notificationEmail = process.env.BOOKING_NOTIFICATION_EMAIL || 'admin@beatrox.com'

  const detailRows: [string, string | undefined][] = [
    ['Name', input.name],
    ['Email', input.email],
    ['Company', input.company],
    ['Event type', input.eventType],
    ['Services', input.services && input.services.length > 0 ? input.services.join(', ') : undefined],
    ['Event date', input.eventDate],
    ['Location', input.location],
    ['Budget', input.budget],
  ]

  const text = [
    'New contact form submission:',
    '',
    ...detailRows.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`),
    '',
    'Message:',
    input.message,
    '',
    `View in admin: ${input.adminUrl}`,
  ].join('\n')

  const html = `
    <div style="font-family: Inter, sans-serif; color: #111;">
      <h2>New contact form submission</h2>
      <ul>
        ${detailRows
          .filter(([, value]) => value)
          .map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value as string)}</li>`)
          .join('')}
      </ul>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(input.message)}</p>
      <p><a href="${escapeHtml(input.adminUrl)}">View in admin</a></p>
    </div>
  `

  await sendEmail({
    to: notificationEmail,
    subject: `New inquiry: ${input.name}${input.eventType ? ` (${input.eventType})` : ''}`,
    text,
    html,
  })
}

export async function sendConsultationReminder(input: BookingConfirmationInput): Promise<void> {
  const timeText = `${formatBookingTime(input.startTime, input.timezone)} ${input.timezone}`

  const text = [
    `Hi ${input.name},`,
    '',
    `A reminder that your ${input.consultationType} with BEATROX is coming up on ${timeText}.`,
    '',
    input.meetLink
      ? `Google Meet link: ${input.meetLink}`
      : 'If you do not have a meeting link yet, our team will send it by email before the call.',
    '',
    'If you need to reschedule, please reply to this email or contact us at admin@beatrox.com.',
    '',
    'The BEATROX team',
  ].join('\n')

  const html = `
    <div style="font-family: Inter, sans-serif; color: #111;">
      <p>Hi ${escapeHtml(input.name)},</p>
      <p>A reminder that your <strong>${escapeHtml(input.consultationType)}</strong> with BEATROX is coming up on:</p>
      <p style="font-size: 18px; font-weight: 600;">${escapeHtml(timeText)}</p>
      ${input.meetLink ? `<p><a href="${escapeHtml(input.meetLink)}">Join Google Meet</a></p>` : '<p>If you do not have a meeting link yet, our team will send it by email before the call.</p>'}
      <p>If you need to reschedule, please reply to this email or contact us at <a href="mailto:admin@beatrox.com">admin@beatrox.com</a>.</p>
      <p>The BEATROX team</p>
    </div>
  `

  await sendEmail({
    to: input.to,
    subject: `Reminder: your BEATROX ${input.consultationType} is tomorrow`,
    text,
    html,
  })
}

export interface StaleLeadDigestInput {
  staleSubmissions: { id: string | number; name: string; email: string; createdAt: string }[]
  staleDeals: { id: string | number; title: string; value?: number | null; createdAt: string }[]
  adminUrl: string
}

export async function sendStaleLeadDigest(input: StaleLeadDigestInput): Promise<void> {
  const notificationEmail = process.env.BOOKING_NOTIFICATION_EMAIL || 'admin@beatrox.com'
  const total = input.staleSubmissions.length + input.staleDeals.length
  if (total === 0) return

  const submissionLines = input.staleSubmissions.map(
    (s) => `• ${s.name} <${s.email}>, inquiry from ${s.createdAt.slice(0, 10)} (${input.adminUrl}/collections/contact-submissions/${s.id})`,
  )
  const dealLines = input.staleDeals.map(
    (d) => `• ${d.title}${d.value ? ` ($${d.value.toLocaleString()})` : ''}, opened ${d.createdAt.slice(0, 10)} (${input.adminUrl}/collections/deals/${d.id})`,
  )

  const text = [
    `${total} item${total === 1 ? '' : 's'} need${total === 1 ? 's' : ''} follow-up (untouched for 3+ days):`,
    '',
    ...(submissionLines.length ? ['Stale inquiries:', ...submissionLines, ''] : []),
    ...(dealLines.length ? ['Stale deals:', ...dealLines, ''] : []),
  ].join('\n')

  const html = `
    <div style="font-family: Inter, sans-serif; color: #111;">
      <h2>${total} item${total === 1 ? '' : 's'} need follow-up</h2>
      <p>Untouched for 3+ days:</p>
      ${submissionLines.length ? `<h3>Stale inquiries</h3><ul>${input.staleSubmissions
        .map(
          (s) =>
            `<li>${escapeHtml(s.name)} &lt;${escapeHtml(s.email)}&gt;, inquiry from ${escapeHtml(s.createdAt.slice(0, 10))} (<a href="${escapeHtml(`${input.adminUrl}/collections/contact-submissions/${s.id}`)}">open</a>)</li>`,
        )
        .join('')}</ul>` : ''}
      ${dealLines.length ? `<h3>Stale deals</h3><ul>${input.staleDeals
        .map(
          (d) =>
            `<li>${escapeHtml(d.title)}${d.value ? ` ($${d.value.toLocaleString()})` : ''}, opened ${escapeHtml(d.createdAt.slice(0, 10))} (<a href="${escapeHtml(`${input.adminUrl}/collections/deals/${d.id}`)}">open</a>)</li>`,
        )
        .join('')}</ul>` : ''}
    </div>
  `

  await sendEmail({
    to: notificationEmail,
    subject: `Follow-up needed: ${total} stale lead${total === 1 ? '' : 's'}/deal${total === 1 ? '' : 's'}`,
    text,
    html,
  })
}

export interface WeeklyKpiDigestInput {
  weekLabel: string
  leadsThisWeek: number
  qualifiedLeadsThisWeek: number
  consultationsThisWeek: number
  openProposals: number
  dealsWonThisMonth: number
  revenueBookedThisMonth: number
  pipelineValue: number
  adminUrl: string
}

export async function sendWeeklyKpiDigest(input: WeeklyKpiDigestInput): Promise<void> {
  const notificationEmail = process.env.BOOKING_NOTIFICATION_EMAIL || 'admin@beatrox.com'

  const rows: [string, string][] = [
    ['New leads (this week)', String(input.leadsThisWeek)],
    ['Qualified leads (this week)', String(input.qualifiedLeadsThisWeek)],
    ['Consultations booked (this week)', String(input.consultationsThisWeek)],
    ['Proposals out (open)', String(input.openProposals)],
    ['Deals won (this month)', String(input.dealsWonThisMonth)],
    ['Revenue booked (this month)', `$${input.revenueBookedThisMonth.toLocaleString()}`],
    ['Open pipeline value', `$${input.pipelineValue.toLocaleString()}`],
  ]

  const text = [
    `BEATROX weekly KPIs: ${input.weekLabel}`,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    `Dashboard: ${input.adminUrl}`,
  ].join('\n')

  const html = `
    <div style="font-family: Inter, sans-serif; color: #111;">
      <h2>BEATROX weekly KPIs</h2>
      <p>${escapeHtml(input.weekLabel)}</p>
      <table style="border-collapse: collapse;">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding: 4px 16px 4px 0;">${escapeHtml(label)}</td><td style="font-weight: 600;">${escapeHtml(value)}</td></tr>`,
          )
          .join('')}
      </table>
      <p><a href="${escapeHtml(input.adminUrl)}">Open dashboard</a></p>
    </div>
  `

  await sendEmail({
    to: notificationEmail,
    subject: `Weekly KPIs: ${input.leadsThisWeek} leads, ${input.consultationsThisWeek} consults, $${input.revenueBookedThisMonth.toLocaleString()} booked`,
    text,
    html,
  })
}

export interface ProposalEmailInput {
  to: string
  name: string
  dealTitle: string
  proposalUrl: string
  validUntil?: string
}

export async function sendProposalEmail(input: ProposalEmailInput): Promise<void> {
  const validText = input.validUntil
    ? `This proposal is valid until ${new Date(input.validUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
    : ''

  const text = [
    `Hi ${input.name},`,
    '',
    `Your proposal from BEATROX (${input.dealTitle}) is ready to review:`,
    '',
    input.proposalUrl,
    '',
    validText,
    '',
    'Reply to this email with any questions, or to accept the proposal.',
    '',
    'The BEATROX team',
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
    <div style="font-family: Inter, sans-serif; color: #111;">
      <p>Hi ${escapeHtml(input.name)},</p>
      <p>Your proposal from BEATROX (<strong>${escapeHtml(input.dealTitle)}</strong>) is ready to review:</p>
      <p><a href="${escapeHtml(input.proposalUrl)}" style="font-size: 16px; font-weight: 600;">View your proposal</a></p>
      ${validText ? `<p>${escapeHtml(validText)}</p>` : ''}
      <p>Reply to this email with any questions, or to accept the proposal.</p>
      <p>The BEATROX team</p>
    </div>
  `

  await sendEmail({
    to: input.to,
    subject: `Your BEATROX proposal: ${input.dealTitle}`,
    text,
    html,
  })
}

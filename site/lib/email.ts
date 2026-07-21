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
    const from = process.env.BOOKING_FROM_EMAIL || 'hello@beatrox.com'

    await resend.emails.send({
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html,
    })
  } catch (error) {
    console.error('[email] Failed to send email:', error)
  }
}

export async function sendBookingConfirmation(input: BookingConfirmationInput): Promise<void> {
  const timeText = `${formatBookingTime(input.startTime, input.timezone)} ${input.timezone}`

  const text = [
    `Hi ${input.name},`,
    '',
    `Your ${input.consultationType} with BEATROX is confirmed for ${timeText}.`,
    '',
    input.meetLink ? `Google Meet link: ${input.meetLink}` : 'Meeting details will be sent separately.',
    '',
    'If you need to reschedule, please reply to this email or contact us at hello@beatrox.com.',
    '',
    'Looking forward to talking with you,',
    'The BEATROX team',
  ].join('\n')

  const html = `
    <div style="font-family: Inter, sans-serif; color: #111;">
      <p>Hi ${escapeHtml(input.name)},</p>
      <p>Your <strong>${escapeHtml(input.consultationType)}</strong> with BEATROX is confirmed for:</p>
      <p style="font-size: 18px; font-weight: 600;">${escapeHtml(timeText)}</p>
      ${input.meetLink ? `<p><a href="${escapeHtml(input.meetLink)}">Join Google Meet</a></p>` : '<p>Meeting details will be sent separately.</p>'}
      <p>If you need to reschedule, please reply to this email or contact us at <a href="mailto:hello@beatrox.com">hello@beatrox.com</a>.</p>
      <p>Looking forward to talking with you,<br>The BEATROX team</p>
    </div>
  `

  await sendEmail({
    to: input.to,
    subject: `Your BEATROX ${input.consultationType} is confirmed`,
    text,
    html,
  })
}

export async function sendInternalBookingNotification(input: InternalNotificationInput): Promise<void> {
  const notificationEmail = process.env.BOOKING_NOTIFICATION_EMAIL || 'hello@beatrox.com'
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
    subject: `New booking: ${input.consultationType} — ${input.name}`,
    text,
    html,
  })
}

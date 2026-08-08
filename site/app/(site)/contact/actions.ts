'use server'

import { getPayload } from 'payload'
import payloadConfig from '@/payload.config'
import { headers } from 'next/headers'
import { hashIp, isRateLimited } from '@/lib/rate-limit'

export interface FormState {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

export async function submitContactForm(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Honeypot: hidden field humans never fill. Silently fake success for bots.
  if (formData.get('website')?.toString().trim()) {
    return {
      success: true,
      message: 'Thanks for reaching out! A member of the Beatrox team will be in touch within 1–2 business days.',
    }
  }

  const name = formData.get('name')?.toString().trim()
  const email = formData.get('email')?.toString().trim()
  const company = formData.get('company')?.toString().trim()
  const eventType = formData.get('event_type')?.toString().trim()
  const eventDate = formData.get('event_date')?.toString().trim()
  const location = formData.get('location')?.toString().trim()
  const budget = formData.get('budget')?.toString().trim()
  const message = formData.get('message')?.toString().trim()
  const services = formData.getAll('services').map((v) => v.toString().trim())

  const utm = {
    source: formData.get('utm_source')?.toString().trim() || undefined,
    medium: formData.get('utm_medium')?.toString().trim() || undefined,
    campaign: formData.get('utm_campaign')?.toString().trim() || undefined,
    gclid: formData.get('gclid')?.toString().trim() || undefined,
  }
  const hasUtm = Object.values(utm).some(Boolean)

  const errors: Record<string, string[]> = {}

  if (!name || name.length < 2) {
    errors.name = ['Please enter your name.']
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = ['Please enter a valid email address.']
  }

  if (!eventType) {
    errors.event_type = ['Please select an event type.']
  }

  if (!message || message.length < 10) {
    errors.message = ['Please tell us more about your project (at least 10 characters).']
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: 'Please fix the errors below.',
      errors,
    }
  }

  try {
    const payload = await getPayload({ config: payloadConfig })
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null
    const ipHash = hashIp(ip)

    if (isRateLimited(ipHash)) {
      return {
        success: false,
        message: 'Too many submissions. Please try again in a few minutes.',
      }
    }

    await payload.create({
      collection: 'contact-submissions',
      // Trusted server-side write: collection create access requires an
      // authenticated user; this validated action is the public write path.
      overrideAccess: true,
      data: {
        // Validated above: the errors guard guarantees these are present.
        name: name!,
        email: email!,
        message: message!,
        source: 'website',
        ipHash,
        ...(company ? { company } : {}),
        ...(eventType ? { eventType } : {}),
        ...(services.length > 0 ? { services: services.map((service) => ({ service })) } : {}),
        ...(eventDate ? { eventDate } : {}),
        ...(location ? { location } : {}),
        ...(budget ? { budget } : {}),
        ...(hasUtm ? { utm } : {}),
      },
    })

    return {
      success: true,
      message: 'Thanks for reaching out! A member of the Beatrox team will be in touch within 1–2 business days.',
    }
  } catch (error) {
    console.error('Contact submission error:', error)
    return {
      success: false,
      message: 'Something went wrong. Please try again or email us directly at hello@beatrox.com.',
    }
  }
}

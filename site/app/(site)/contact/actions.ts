'use server'

import { getPayload } from 'payload'
import payloadConfig from '@/payload.config'
import { headers } from 'next/headers'
import crypto from 'crypto'

export interface FormState {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

function hashIp(ip: string | null): string | undefined {
  if (!ip) return undefined
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

export async function submitContactForm(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = formData.get('name')?.toString().trim()
  const email = formData.get('email')?.toString().trim()
  const company = formData.get('company')?.toString().trim()
  const eventType = formData.get('event_type')?.toString().trim()
  const eventDate = formData.get('event_date')?.toString().trim()
  const location = formData.get('location')?.toString().trim()
  const budget = formData.get('budget')?.toString().trim()
  const message = formData.get('message')?.toString().trim()
  const services = formData.getAll('services').map((v) => v.toString().trim())

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

    const data: Record<string, unknown> = {
      name,
      email,
      message,
      source: 'website',
      ipHash: hashIp(ip),
    }

    if (company) data.company = company
    if (eventType) data.eventType = eventType
    if (services.length > 0) data.services = services.map((service) => ({ service }))
    if (eventDate) data.eventDate = eventDate
    if (location) data.location = location
    if (budget) data.budget = budget

    await payload.create({
      collection: 'contact-submissions',
      data,
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

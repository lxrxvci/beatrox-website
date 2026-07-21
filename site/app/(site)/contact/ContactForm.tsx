'use client'

import { useActionState } from 'react'
import { submitContactForm, type FormState } from './actions'

interface Field {
  id: string
  label: string
  type: string
  required: boolean
  options?: string[]
  placeholder?: string
}

interface ContactFormProps {
  fields: Field[]
  submitLabel: string
  successMessage: string
}

const initialState: FormState = {
  success: false,
  message: '',
}

export default function ContactForm({ fields, submitLabel, successMessage }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState)

  if (state.success) {
    return (
      <div className="border border-white/20 bg-white/5 p-10 md:p-12 text-center" role="status" aria-live="polite">
        <h3 className="heading-sm text-white mb-4">Message Sent</h3>
        <p className="text-base text-white/70 leading-relaxed">{successMessage}</p>
      </div>
    )
  }

  const textFields = fields.filter(
    (f) => f.type === 'text' || f.type === 'email' || f.type === 'tel',
  )
  const otherFields = fields.filter(
    (f) => f.type === 'select' || f.type === 'multiselect' || f.type === 'date' || f.type === 'textarea',
  )

  const fieldError = (id: string) =>
    state.errors?.[id]?.map((err, i) => (
      <p key={i} className="text-sm text-red-400 mt-2">
        {err}
      </p>
    ))

  return (
    <form action={formAction} className="space-y-7 md:space-y-8">
      {state.message && !state.success && (
        <div className="border border-red-400/30 bg-red-400/10 p-5" role="alert" aria-live="polite">
          <p className="text-base text-red-200">{state.message}</p>
        </div>
      )}

      {/* Honeypot — off-screen; humans leave it blank, bots fill it. */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-7">
        {textFields.slice(0, 4).map((field) => (
          <div key={field.id}>
            <label className="heading-sm text-white/75 block mb-2.5" htmlFor={field.id}>
              {field.label}
              {field.required && ' *'}
            </label>
            <input
              id={field.id}
              name={field.id}
              type={field.type}
              required={field.required}
              defaultValue={field.id === 'company' ? '' : undefined}
              className="w-full bg-transparent border border-white/25 px-4 py-3.5 text-base text-white placeholder:text-white/55 focus:outline-none focus:border-white transition-colors"
              placeholder={field.label}
            />
            {fieldError(field.id)}
          </div>
        ))}
      </div>

      {otherFields.map((field) => {
        if (field.type === 'select' && field.options) {
          return (
            <div key={field.id}>
              <label className="heading-sm text-white/75 block mb-2.5" htmlFor={field.id}>
                {field.label}
                {field.required && ' *'}
              </label>
              <select
                id={field.id}
                name={field.id}
                required={field.required}
                className="w-full bg-black border border-white/25 px-4 py-3.5 text-base text-white focus:outline-none focus:border-white transition-colors"
              >
                <option value="">Select…</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {fieldError(field.id)}
            </div>
          )
        }

        if (field.type === 'multiselect' && field.options) {
          return (
            <div key={field.id}>
              <span className="heading-sm text-white/75 block mb-4">
                {field.label}
                {field.required && ' *'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field.options.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-start gap-3.5 p-4 border border-white/15 bg-transparent hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      name="services"
                      value={opt}
                      className="mt-1 w-4 h-4 accent-white"
                    />
                    <span className="text-base text-white/80 leading-snug">{opt}</span>
                  </label>
                ))}
              </div>
              {fieldError(field.id)}
            </div>
          )
        }

        if (field.type === 'date') {
          return (
            <div key={field.id}>
              <label className="heading-sm text-white/75 block mb-2.5" htmlFor={field.id}>
                {field.label}
                {field.required && ' *'}
              </label>
              <input
                id={field.id}
                name={field.id}
                type="date"
                required={field.required}
                className="w-full bg-transparent border border-white/25 px-4 py-3.5 text-base text-white placeholder:text-white/55 focus:outline-none focus:border-white transition-colors [color-scheme:dark]"
              />
              {fieldError(field.id)}
            </div>
          )
        }

        if (field.type === 'textarea') {
          return (
            <div key={field.id}>
              <label className="heading-sm text-white/75 block mb-2.5" htmlFor={field.id}>
                {field.label}
                {field.required && ' *'}
              </label>
              <textarea
                id={field.id}
                name={field.id}
                required={field.required}
                rows={6}
                className="w-full bg-transparent border border-white/25 px-4 py-3.5 text-base text-white placeholder:text-white/55 focus:outline-none focus:border-white transition-colors resize-none"
                placeholder={field.placeholder || field.label}
              />
              {fieldError(field.id)}
            </div>
          )
        }

        return null
      })}

      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
        {pending ? 'Sending…' : submitLabel}
      </button>
    </form>
  )
}

'use client'

import { useActionState, useState, useTransition } from 'react'
import { bookConsultation, getAvailableSlotsForDate, type BookingFormState, type SlotOption } from './actions'
import { AttributionFields } from '@/components/AttributionFields'

interface ConsultationType {
  id: string
  name: string
  slug: string
  duration: number
  description: string
  color: string
}

interface BookingFormProps {
  types: ConsultationType[]
}

const initialState: BookingFormState = {
  success: false,
  message: '',
}

function formatDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function BookingForm({ types }: BookingFormProps) {
  const [state, formAction, pending] = useActionState(bookConsultation, initialState)
  const [isPendingSlots, startTransition] = useTransition()

  const fieldError = (id: string) =>
    state.errors?.[id]?.map((err, i) => (
      <p key={i} className="text-sm text-red-400 mt-2">
        {err}
      </p>
    ))
  const hasError = (id: string) => Boolean(state.errors?.[id]?.length)

  const [step, setStep] = useState<'type' | 'datetime' | 'details' | 'success'>('type')
  const [selectedType, setSelectedType] = useState<ConsultationType | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null)
  const [slots, setSlots] = useState<SlotOption[]>([])
  const [slotError, setSlotError] = useState<string>('')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 60)

  if (state.success && step !== 'success') {
    setStep('success')
  }

  async function handleDateChange(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setSlotError('')
    setSlots([])

    if (!date || !selectedType) return

    startTransition(async () => {
      try {
        const available = await getAvailableSlotsForDate(selectedType.id, date)
        if (available.length === 0) {
          setSlotError('No available times for this date. Please choose another.')
        }
        setSlots(available)
      } catch {
        setSlotError('Could not load available times. Please try again.')
      }
    })
  }

  function handleTypeSelect(type: ConsultationType) {
    setSelectedType(type)
    setSelectedDate('')
    setSelectedSlot(null)
    setSlots([])
    setSlotError('')
    setStep('datetime')
  }

  function handleSlotSelect(slot: SlotOption) {
    setSelectedSlot(slot)
    setStep('details')
  }

  if (step === 'success') {
    return (
      <div className="border border-white/20 bg-white/5 p-10 md:p-12 text-center" role="status" aria-live="polite">
        <h2 className="heading-md text-white mb-5">You're Booked</h2>
        <p className="text-base text-white leading-relaxed mb-6">{state.message}</p>
        {state.startTime && state.timezone && (
          <p className="text-base text-white mb-2">
            <strong>{state.startTime}</strong> {state.timezone}
          </p>
        )}
        {state.meetLink && (
          <a
            href={state.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            Join Google Meet
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {state.message && !state.success && (
        <div className="border border-red-400/30 bg-red-400/10 p-5" role="alert" aria-live="polite">
          <p className="text-base text-red-200">{state.message}</p>
        </div>
      )}

      {/* Step 1: Select type */}
      <div className={step === 'type' ? 'block' : 'hidden'}>
        <h2 className="heading-sm text-white mb-7">1. Choose a consultation type</h2>
        {types.length === 0 ? (
          <p className="text-base text-white">No consultation types are available right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {types.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleTypeSelect(type)}
                className="text-left border border-white/15 bg-transparent hover:bg-white/5 p-6 transition-colors"
              >
                <span className="flex items-center gap-3 mb-3">
                  {type.color && (
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                  )}
                  <span className="heading-sm text-white">{type.name}</span>
                </span>
                <span className="text-sm text-white block mb-2">{type.duration} minutes</span>
                {type.description && (
                  <span className="text-base text-white leading-relaxed">{type.description}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Select date and time */}
      <div className={step === 'datetime' ? 'block' : 'hidden'}>
        <div className="flex items-center justify-between gap-4 mb-7">
          <h2 className="heading-sm text-white">2. Select a date and time</h2>
          <button
            type="button"
            onClick={() => setStep('type')}
            className="text-sm text-white hover:text-[var(--accent)] transition-colors shrink-0"
          >
            ← Back to types
          </button>
        </div>

        {selectedType && (
          <p className="text-base text-white mb-5">
            Booking a <strong className="text-white">{selectedType.name}</strong> ({selectedType.duration} min)
          </p>
        )}

        <div className="mb-7">
          <label className="heading-sm text-white block mb-2.5" htmlFor="booking-date">
            Date
          </label>
          <input
            id="booking-date"
            type="date"
            value={selectedDate}
            min={formatDateInputValue(tomorrow)}
            max={formatDateInputValue(maxDate)}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full sm:w-auto bg-black border border-white/25 px-4 py-3.5 text-base text-white focus:outline-none focus:border-[var(--accent)] transition-colors [color-scheme:dark]"
          />
        </div>

        {isPendingSlots && <p className="text-base text-white">Loading available times…</p>}

        {slotError && !isPendingSlots && (
          <p className="text-base text-red-200 bg-red-400/10 border border-red-400/30 p-4 mb-5">{slotError}</p>
        )}

        {slots.length > 0 && !isPendingSlots && (
          <div>
            <p className="heading-sm text-white block mb-4">Available times</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {slots.map((slot) => (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => handleSlotSelect(slot)}
                  className="border border-white/15 bg-transparent hover:bg-white/5 hover:border-white/35 py-3.5 text-center transition-colors"
                >
                  <span className="text-base text-white">{slot.displayTime}</span>
                  <span className="text-sm text-white block">{slot.displayPeriod}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Contact details */}
      <div className={step === 'details' ? 'block' : 'hidden'}>
        <div className="flex items-center justify-between gap-4 mb-7">
          <h2 className="heading-sm text-white">3. Your details</h2>
          <button
            type="button"
            onClick={() => setStep('datetime')}
            className="text-sm text-white hover:text-[var(--accent)] transition-colors shrink-0"
          >
            ← Back to time
          </button>
        </div>

        {selectedSlot && (
          <div className="border border-white/15 bg-white/5 p-5 mb-7">
            <p className="text-base text-white">
              <span className="text-white">{selectedType?.name}</span> on{' '}
              <span className="text-white">
                {new Date(selectedSlot.startTime).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>{' '}
              at{' '}
              <span className="text-white">
                {selectedSlot.displayTime} {selectedSlot.displayPeriod}
              </span>{' '}
              {selectedSlot.timezone}
            </p>
          </div>
        )}

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="typeId" value={selectedType?.id || ''} />
          <input type="hidden" name="startTime" value={selectedSlot?.startTime || ''} />
          <input type="hidden" name="endTime" value={selectedSlot?.endTime || ''} />
          <input type="hidden" name="timezone" value={selectedSlot?.timezone || ''} />

          {/* Honeypot — off-screen; humans leave it blank, bots fill it. */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          {/* Marketing attribution (UTM/gclid) — hidden, first-touch. */}
          <AttributionFields />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="heading-sm text-white block mb-2.5" htmlFor="name">
                Your Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className={`w-full bg-transparent border px-4 py-3.5 text-base text-white placeholder:text-white focus:outline-none focus:border-[var(--accent)] transition-colors ${
                  hasError('name') ? 'border-red-400/60' : 'border-white/25'
                }`}
                placeholder="Your Name"
              />
              {fieldError('name')}
            </div>
            <div>
              <label className="heading-sm text-white block mb-2.5" htmlFor="email">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`w-full bg-transparent border px-4 py-3.5 text-base text-white placeholder:text-white focus:outline-none focus:border-[var(--accent)] transition-colors ${
                  hasError('email') ? 'border-red-400/60' : 'border-white/25'
                }`}
                placeholder="Email Address"
              />
              {fieldError('email')}
            </div>
            <div>
              <label className="heading-sm text-white block mb-2.5" htmlFor="company">
                Company / Organization
              </label>
              <input
                id="company"
                name="company"
                type="text"
                className="w-full bg-transparent border border-white/25 px-4 py-3.5 text-base text-white placeholder:text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="Company"
              />
            </div>
            <div>
              <label className="heading-sm text-white block mb-2.5" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="w-full bg-transparent border border-white/25 px-4 py-3.5 text-base text-white placeholder:text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="Phone Number"
              />
            </div>
          </div>

          <div>
            <label className="heading-sm text-white block mb-2.5" htmlFor="projectSummary">
              Tell Us About Your Project *
            </label>
            <textarea
              id="projectSummary"
              name="projectSummary"
              required
              rows={6}
              className={`w-full bg-transparent border px-4 py-3.5 text-base text-white placeholder:text-white focus:outline-none focus:border-[var(--accent)] transition-colors resize-none ${
                hasError('projectSummary') ? 'border-red-400/60' : 'border-white/25'
              }`}
              placeholder="Describe your vision, goals, and any specific requirements..."
            />
            {fieldError('projectSummary')}
          </div>

          {fieldError('typeId')}
          {fieldError('slot')}

          <button
            type="submit"
            disabled={pending}
            className="btn-primary btn-primary--accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Booking…' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}

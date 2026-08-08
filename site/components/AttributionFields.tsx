'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'beatrox_attribution'
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'gclid'] as const

type Attribution = Partial<Record<(typeof PARAMS)[number], string>>

function readStored(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

/**
 * Hidden form fields carrying marketing attribution (UTM params + gclid).
 * First-touch: URL params win when present; otherwise the values captured
 * earlier in the session are reused, so attribution survives navigation
 * from a landing page to the contact/booking form.
 */
export function AttributionFields() {
  const [values, setValues] = useState<Attribution>({})

  useEffect(() => {
    const current = new URLSearchParams(window.location.search)
    const fromUrl: Attribution = {}
    for (const key of PARAMS) {
      const value = current.get(key)?.trim()
      if (value) fromUrl[key] = value.slice(0, 200)
    }

    const merged = Object.keys(fromUrl).length > 0 ? { ...readStored(), ...fromUrl } : readStored()
    if (Object.keys(merged).length > 0) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      } catch {
        // Storage unavailable (private mode), fields just stay empty.
      }
    }
    setValues(merged)
  }, [])

  return (
    <>
      {PARAMS.map((key) => (
        <input key={key} type="hidden" name={key} value={values[key] || ''} />
      ))}
    </>
  )
}

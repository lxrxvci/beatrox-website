'use client'

import React, { useCallback, useState } from 'react'
import { useAdminEdit } from './AdminEditContext'

interface ServiceOption {
  id: string
  title: string
  slug: string
}

interface EditableServiceTagsProps {
  collection: string
  documentId: string
  allServices: ServiceOption[]
  selectedIds: string[]
  children: React.ReactNode
}

export default function EditableServiceTags({
  collection,
  documentId,
  allServices,
  selectedIds,
  children,
}: EditableServiceTagsProps) {
  const { editMode } = useAdminEdit()
  const [active, setActive] = useState(false)
  const [draft, setDraft] = useState<string[]>(selectedIds)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const toggleService = useCallback((id: string) => {
    setDraft((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      // Relationship fields store numeric IDs; drop anything that doesn't parse.
      const value = draft.map((id) => Number(id)).filter((n) => !Number.isNaN(n))
      const res = await fetch('/api/admin-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection,
          id: documentId,
          path: 'serviceTags',
          value,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Save failed')
      }
      window.location.reload()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }, [collection, documentId, draft])

  const handleCancel = useCallback(() => {
    setActive(false)
    setDraft(selectedIds)
    setSaveError(null)
  }, [selectedIds])

  if (!editMode) {
    return <>{children}</>
  }

  if (!active) {
    return (
      <div
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDraft(selectedIds)
          setActive(true)
        }}
        className="relative cursor-pointer rounded-sm hover:ring-1 hover:ring-[var(--accent)]/50 hover:ring-offset-1 hover:ring-offset-black transition-all"
        role="button"
        aria-label="Edit service tags"
      >
        <div className="pointer-events-none">{children}</div>
        <span className="absolute -top-3 -right-3 z-10">
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)] text-black rounded-sm shadow-lg">
            Edit
          </span>
        </span>
      </div>
    )
  }

  return (
    <div className="relative rounded-sm ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-black">
      <div className="pointer-events-none">{children}</div>
      <div className="absolute left-0 top-full mt-2 z-20 w-96 max-w-[90vw] border border-white/15 bg-neutral-950/95 backdrop-blur-sm p-3 shadow-xl">
        <p className="mono text-white/60 mb-2">Services used on this project</p>
        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto">
          {allServices.map((service) => {
            const selected = draft.includes(service.id)
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service.id)}
                disabled={isSaving}
                className={`px-2 py-1 text-xs uppercase tracking-wider border rounded-sm transition-colors disabled:opacity-50 ${
                  selected
                    ? 'bg-[var(--accent)] text-black border-[var(--accent)] font-bold'
                    : 'bg-white/5 text-white/75 border-white/20 hover:border-[var(--accent)]/60 hover:text-white'
                }`}
              >
                {service.title}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={(e) => { e.preventDefault(); handleSave() }}
            disabled={isSaving}
            className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)] text-black rounded-sm disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={(e) => { e.preventDefault(); handleCancel() }}
            disabled={isSaving}
            className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 rounded-sm disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {saveError && (
          <p className="mt-2 text-xs text-red-400">{saveError}</p>
        )}
      </div>
    </div>
  )
}

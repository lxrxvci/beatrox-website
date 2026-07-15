'use client'

import React, { useCallback, useState } from 'react'
import { useAdminEdit } from './AdminEditContext'

interface EditableTextProps {
  collection?: string
  documentId?: string
  fieldPath: string
  value?: string
  children: React.ReactNode
  multiline?: boolean
  inputClassName?: string
}

export default function EditableText({
  collection,
  documentId,
  fieldPath,
  value = '',
  children,
  multiline = false,
  inputClassName = '',
}: EditableTextProps) {
  const { editMode } = useAdminEdit()
  const [active, setActive] = useState(false)
  const [draft, setDraft] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = useCallback(async () => {
    if (!collection || !documentId) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/admin-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection,
          id: documentId,
          path: fieldPath,
          value: draft,
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
  }, [collection, documentId, draft, fieldPath])

  const handleCancel = useCallback(() => {
    setActive(false)
    setDraft(value)
    setSaveError(null)
  }, [value])

  if (!editMode || !collection || !documentId) {
    return <>{children}</>
  }

  if (!active) {
    return (
      <span
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setActive(true)
        }}
        className="relative inline-block cursor-pointer rounded-sm hover:ring-1 hover:ring-[var(--accent)]/50 hover:ring-offset-1 hover:ring-offset-black transition-all"
        role="button"
        aria-label={`Edit ${fieldPath}`}
      >
        <span className="pointer-events-none">{children}</span>
        <span className="absolute -top-3 -right-3 z-10">
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)] text-black rounded-sm shadow-lg">
            Edit
          </span>
        </span>
      </span>
    )
  }

  const inputClasses = `
    bg-black/80 text-white border border-[var(--accent)] rounded-sm px-2 py-1
    focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-w-[12rem]
    ${multiline ? 'block w-full' : ''}
    ${inputClassName}
  `.trim()

  return (
    <span className="relative inline-block align-baseline">
      {multiline ? (
        <textarea
          className={inputClasses}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          disabled={isSaving}
          autoFocus
        />
      ) : (
        <input
          type="text"
          className={inputClasses}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
          disabled={isSaving}
          autoFocus
        />
      )}
      <span className="absolute left-0 top-full mt-2 flex items-center gap-2 z-20">
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
      </span>
      {saveError && (
        <span className="absolute left-0 top-full mt-8 text-xs text-red-400 whitespace-nowrap">
          {saveError}
        </span>
      )}
    </span>
  )
}

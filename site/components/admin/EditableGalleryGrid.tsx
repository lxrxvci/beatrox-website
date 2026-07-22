'use client'

import React, { useCallback, useState } from 'react'
import { useAdminEdit } from './AdminEditContext'

export interface GalleryGridItem {
  label: string
  image?: string
  link?: string
  textPosition?: string
}

interface MediaOption {
  id: string
  url: string
  filename: string
}

interface EditableGalleryGridProps {
  collection?: string
  documentId?: string
  /** Global mode: target a global (e.g. 'capability-tiles') instead of a collection doc. */
  globalSlug?: string
  fieldPath: string
  items: GalleryGridItem[]
  mediaLibrary?: MediaOption[]
  children: React.ReactNode
}

const TEXT_POSITIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'below', label: 'Below' },
  { value: 'hidden', label: 'Hidden' },
] as const

const inputClasses =
  'bg-black/80 text-white border border-white/20 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-[var(--accent)] w-full'

export default function EditableGalleryGrid({
  collection,
  documentId,
  globalSlug,
  fieldPath,
  items,
  mediaLibrary = [],
  children,
}: EditableGalleryGridProps) {
  const { editMode } = useAdminEdit()
  const [active, setActive] = useState(false)
  const [draft, setDraft] = useState<GalleryGridItem[]>(items)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const canSave = Boolean(globalSlug) || Boolean(collection && documentId)

  const updateItem = useCallback((index: number, patch: Partial<GalleryGridItem>) => {
    setDraft((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }, [])

  const moveItem = useCallback((index: number, direction: -1 | 1) => {
    setDraft((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }, [])

  const removeItem = useCallback((index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addItem = useCallback(() => {
    setDraft((prev) => [...prev, { label: '', textPosition: 'center' }])
  }, [])

  const handleSave = useCallback(async () => {
    if (!canSave) return
    setIsSaving(true)
    setSaveError(null)
    try {
      // Omit empty optional keys; drop rows without a label.
      const value = draft
        .map((item) => {
          const clean: Record<string, string> = { label: item.label.trim() }
          const image = item.image?.trim()
          const link = item.link?.trim()
          if (image) clean.image = image
          if (link) clean.link = link
          if (item.textPosition) clean.textPosition = item.textPosition
          return clean
        })
        .filter((item) => item.label.length > 0)
      const body = globalSlug
        ? { global: globalSlug, path: fieldPath, value }
        : { collection, id: documentId, path: fieldPath, value }
      const res = await fetch('/api/admin-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    setDraft(items)
    setSaveError(null)
  }, [items])

  if (!editMode || !canSave) {
    return <>{children}</>
  }

  if (!active) {
    return (
      <div
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDraft(items)
          setActive(true)
        }}
        className="relative cursor-pointer rounded-sm hover:ring-1 hover:ring-[var(--accent)]/50 hover:ring-offset-1 hover:ring-offset-black transition-all"
        role="button"
        aria-label={`Edit ${fieldPath}`}
      >
        <div className="pointer-events-none">{children}</div>
        <span className="absolute -top-3 -right-3 z-10">
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)] text-black rounded-sm shadow-lg">
            Edit tiles
          </span>
        </span>
      </div>
    )
  }

  return (
    <div className="relative rounded-sm ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-black">
      <div className="pointer-events-none">{children}</div>
      <div className="mt-4 border border-white/15 bg-neutral-950/95 p-4 space-y-3">
        <p className="mono text-white/60">
          Edit tiles — the grid updates after saving.
        </p>
        {draft.map((item, index) => (
          <div key={index} className="border border-white/10 bg-white/[0.03] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="mono text-[var(--accent)] shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <input
                type="text"
                value={item.label}
                placeholder="Label"
                onChange={(e) => updateItem(index, { label: e.target.value })}
                disabled={isSaving}
                className={inputClasses}
              />
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={isSaving || index === 0}
                aria-label="Move tile up"
                className="px-2 py-1 text-xs font-bold bg-white/10 text-white border border-white/20 rounded-sm disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={isSaving || index === draft.length - 1}
                aria-label="Move tile down"
                className="px-2 py-1 text-xs font-bold bg-white/10 text-white border border-white/20 rounded-sm disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={isSaving}
                aria-label="Delete tile"
                className="px-2 py-1 text-xs font-bold bg-white/10 text-red-400 border border-white/20 rounded-sm disabled:opacity-30"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={item.image || ''}
                placeholder="/images/capabilities/foo.jpg"
                onChange={(e) => updateItem(index, { image: e.target.value })}
                disabled={isSaving}
                className={inputClasses}
              />
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) updateItem(index, { image: e.target.value })
                }}
                disabled={isSaving || mediaLibrary.length === 0}
                className="bg-black/80 text-white/70 border border-white/20 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-[var(--accent)] sm:w-48 shrink-0"
              >
                <option value="">Library…</option>
                {mediaLibrary.map((media) => (
                  <option key={media.id} value={media.url}>
                    {media.filename || media.url}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={item.link || ''}
              placeholder="/services/..."
              onChange={(e) => updateItem(index, { link: e.target.value })}
              disabled={isSaving}
              className={inputClasses}
            />
            <div className="flex flex-wrap gap-1">
              {TEXT_POSITIONS.map((pos) => {
                const current = item.textPosition || 'center'
                const selected = current === pos.value
                return (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => updateItem(index, { textPosition: pos.value })}
                    disabled={isSaving}
                    className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-sm transition-colors disabled:opacity-50 ${
                      selected
                        ? 'bg-[var(--accent)] text-black border-[var(--accent)]'
                        : 'bg-white/5 text-white/70 border-white/20 hover:border-[var(--accent)]/60 hover:text-white'
                    }`}
                  >
                    {pos.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addItem}
            disabled={isSaving}
            className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 rounded-sm disabled:opacity-50"
          >
            Add tile
          </button>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
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
          <p className="text-xs text-red-400">{saveError}</p>
        )}
      </div>
    </div>
  )
}

'use client'

import React, { useCallback, useState } from 'react'
import { useAdminEdit } from './AdminEditContext'

export interface MediaOption {
  id: string
  url: string
  filename: string
}

interface EditableImageProps {
  /** Collection mode: collection + documentId target a doc. */
  collection?: string
  documentId?: string
  /** Global mode: target a global instead (e.g. 'capability-tiles'). */
  globalSlug?: string
  /** Base path of the image group, WITHOUT .media/.legacyUrl/.alt suffix —
   *  e.g. 'media.heroImage', 'images.3', 'photo'. */
  fieldPath: string
  /** Set when the target is a BARE relationship field + sibling legacyUrl
   *  text field (e.g. media.heroImage / media.heroImageLegacyUrl) instead
   *  of a {media, legacyUrl} group: library pick writes fieldPath directly,
   *  manual path writes `${fieldPath}LegacyUrl`. */
  bareRelationship?: boolean
  /** Currently displayed (resolved) image URL. */
  value: string
  /** Current alt text. Pass undefined to hide the alt field. */
  alt?: string
  mediaLibrary: MediaOption[]
  children: React.ReactNode
}

/**
 * Inline image editor for the admin overlay. Wraps any rendered image; in
 * edit mode an "Image" badge opens a panel with a media-library picker,
 * a manual path input, and an alt field. Saves through /api/admin-update:
 * library pick → <fieldPath>.media (media doc id), manual path →
 * <fieldPath>.legacyUrl, alt → <fieldPath>.alt.
 */
export default function EditableImage({
  collection,
  documentId,
  globalSlug,
  fieldPath,
  bareRelationship = false,
  value,
  alt,
  mediaLibrary,
  children,
}: EditableImageProps) {
  const { editMode } = useAdminEdit()
  const [active, setActive] = useState(false)
  const [manualPath, setManualPath] = useState(value)
  const [selectedMediaId, setSelectedMediaId] = useState('')
  const [draftAlt, setDraftAlt] = useState(alt ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const canSave = Boolean(globalSlug) || Boolean(collection && documentId)

  const patch = useCallback(
    async (path: string, patchValue: unknown) => {
      const body = globalSlug
        ? { global: globalSlug, path, value: patchValue }
        : { collection, id: documentId, path, value: patchValue }
      const res = await fetch('/api/admin-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Save failed')
      }
    },
    [collection, documentId, globalSlug],
  )

  const handleSave = useCallback(async () => {
    if (!canSave) return
    setIsSaving(true)
    setSaveError(null)
    try {
      if (selectedMediaId) {
        await patch(bareRelationship ? fieldPath : `${fieldPath}.media`, Number(selectedMediaId))
      }
      if (manualPath.trim() && manualPath.trim() !== value) {
        await patch(bareRelationship ? `${fieldPath}LegacyUrl` : `${fieldPath}.legacyUrl`, manualPath.trim())
      }
      if (alt !== undefined && draftAlt !== alt) {
        await patch(`${fieldPath}.alt`, draftAlt)
      }
      window.location.reload()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }, [canSave, selectedMediaId, manualPath, value, alt, draftAlt, fieldPath, bareRelationship, patch])

  const handleCancel = useCallback(() => {
    setActive(false)
    setManualPath(value)
    setSelectedMediaId('')
    setDraftAlt(alt ?? '')
    setSaveError(null)
  }, [value, alt])

  if (!editMode || !canSave) {
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
        className="relative inline-block w-full cursor-pointer rounded-sm hover:ring-1 hover:ring-[var(--accent)]/50 transition-all"
        role="button"
        aria-label={`Edit image ${fieldPath}`}
      >
        <span className="pointer-events-none">{children}</span>
        <span className="absolute top-2 right-2 z-10">
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)] text-black rounded-sm shadow-lg">
            Image
          </span>
        </span>
      </span>
    )
  }

  return (
    <span className="relative inline-block w-full">
      <span className="pointer-events-none opacity-60">{children}</span>
      <span className="absolute left-0 right-0 top-0 z-20 mx-auto w-[min(26rem,92%)] bg-neutral-950/95 border border-[var(--accent)] rounded-sm p-4 space-y-3 shadow-2xl">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
          Edit image
        </span>

        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-white/50">From media library</span>
          <select
            className="w-full bg-black/80 text-white border border-white/20 rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            value={selectedMediaId}
            onChange={(e) => setSelectedMediaId(e.target.value)}
            disabled={isSaving}
          >
            <option value="">— keep current —</option>
            {mediaLibrary.map((media) => (
              <option key={media.id} value={media.id}>
                {media.filename || media.url}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-white/50">Or image path</span>
          <input
            type="text"
            className="w-full bg-black/80 text-white border border-white/20 rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            placeholder="/images/..."
            disabled={isSaving}
          />
        </label>

        {alt !== undefined && (
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white/50">Alt text</span>
            <input
              type="text"
              className="w-full bg-black/80 text-white border border-white/20 rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              value={draftAlt}
              onChange={(e) => setDraftAlt(e.target.value)}
              disabled={isSaving}
            />
          </label>
        )}

        <span className="flex items-center gap-2 pt-1">
          <button
            onClick={(e) => {
              e.preventDefault()
              handleSave()
            }}
            disabled={isSaving}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)] text-black rounded-sm disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              handleCancel()
            }}
            disabled={isSaving}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 rounded-sm disabled:opacity-50"
          >
            Cancel
          </button>
        </span>
        {saveError && <span className="block text-xs text-red-400">{saveError}</span>}
      </span>
    </span>
  )
}

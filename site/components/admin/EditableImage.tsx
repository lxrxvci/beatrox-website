'use client'

import React, { useCallback, useState } from 'react'
import { useAdminEdit } from './AdminEditContext'

export interface MediaOption {
  id: string
  url: string
  filename: string
}

export interface TagOption {
  id: string
  title: string
  slug: string
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
  /** Optional per-image tag pickers (project gallery images only). When
   *  present, the edit panel gains chip multi-selects that PATCH
   *  `<fieldPath>.serviceTags` / `<fieldPath>.techTags` with numeric ID
   *  arrays. Backend-only — never rendered publicly. */
  serviceOptions?: TagOption[]
  techOptions?: TagOption[]
  selectedServiceIds?: string[]
  selectedTechIds?: string[]
  children: React.ReactNode
}

/**
 * Inline image editor for the admin overlay. Wraps any rendered image; in
 * edit mode an "Image" badge opens a panel with a media-library picker,
 * a manual path input, and an alt field. Saves through /api/admin-update:
 * library pick → <fieldPath>.media (media doc id), manual path →
 * <fieldPath>.legacyUrl, alt → <fieldPath>.alt. The media library itself
 * comes from AdminEditContext (fetched lazily once edit mode turns on), so
 * anonymous renders never carry it.
 */
export default function EditableImage({
  collection,
  documentId,
  globalSlug,
  fieldPath,
  bareRelationship = false,
  value,
  alt,
  serviceOptions,
  techOptions,
  selectedServiceIds = [],
  selectedTechIds = [],
  children,
}: EditableImageProps) {
  const { editMode, mediaLibrary } = useAdminEdit()
  const [active, setActive] = useState(false)
  const [manualPath, setManualPath] = useState(value)
  const [selectedMediaId, setSelectedMediaId] = useState('')
  const [draftAlt, setDraftAlt] = useState(alt ?? '')
  const [draftServiceIds, setDraftServiceIds] = useState<string[]>(selectedServiceIds)
  const [draftTechIds, setDraftTechIds] = useState<string[]>(selectedTechIds)
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

  const toggleDraftId = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) => {
      setter((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
    },
    [],
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
      if (serviceOptions) {
        // Relationship fields store numeric IDs; drop anything that doesn't parse.
        const ids = draftServiceIds.map((id) => Number(id)).filter((n) => !Number.isNaN(n))
        const unchanged =
          ids.length === selectedServiceIds.length &&
          selectedServiceIds.every((id) => draftServiceIds.includes(id))
        if (!unchanged) await patch(`${fieldPath}.serviceTags`, ids)
      }
      if (techOptions) {
        const ids = draftTechIds.map((id) => Number(id)).filter((n) => !Number.isNaN(n))
        const unchanged =
          ids.length === selectedTechIds.length &&
          selectedTechIds.every((id) => draftTechIds.includes(id))
        if (!unchanged) await patch(`${fieldPath}.techTags`, ids)
      }
      window.location.reload()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }, [canSave, selectedMediaId, manualPath, value, alt, draftAlt, fieldPath, bareRelationship, serviceOptions, techOptions, selectedServiceIds, selectedTechIds, draftServiceIds, draftTechIds, patch])

  const handleCancel = useCallback(() => {
    setActive(false)
    setManualPath(value)
    setSelectedMediaId('')
    setDraftAlt(alt ?? '')
    setDraftServiceIds(selectedServiceIds)
    setDraftTechIds(selectedTechIds)
    setSaveError(null)
  }, [value, alt, selectedServiceIds, selectedTechIds])

  if (!editMode || !canSave) {
    return <>{children}</>
  }

  if (!active) {
    return (
      <span
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDraftServiceIds(selectedServiceIds)
          setDraftTechIds(selectedTechIds)
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
          <span className="text-[10px] uppercase tracking-wider text-white">From media library</span>
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
          <span className="text-[10px] uppercase tracking-wider text-white">Or image path</span>
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
            <span className="text-[10px] uppercase tracking-wider text-white">Alt text</span>
            <input
              type="text"
              className="w-full bg-black/80 text-white border border-white/20 rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              value={draftAlt}
              onChange={(e) => setDraftAlt(e.target.value)}
              disabled={isSaving}
            />
          </label>
        )}

        {serviceOptions && (
          <span className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white">Services in this photo</span>
            <span className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pt-1">
              {serviceOptions.map((option) => {
                const selected = draftServiceIds.includes(option.id)
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleDraftId(setDraftServiceIds)(option.id)}
                    disabled={isSaving}
                    className={`px-2 py-1 text-xs uppercase tracking-wider border rounded-sm transition-colors disabled:opacity-50 ${
                      selected
                        ? 'bg-[var(--accent)] text-black border-[var(--accent)] font-bold'
                        : 'bg-white/5 text-white border-white/20 hover:border-[var(--accent)]/60 hover:text-white'
                    }`}
                  >
                    {option.title}
                  </button>
                )
              })}
            </span>
          </span>
        )}

        {techOptions && (
          <span className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-white">Tech in this photo</span>
            <span className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pt-1">
              {techOptions.map((option) => {
                const selected = draftTechIds.includes(option.id)
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleDraftId(setDraftTechIds)(option.id)}
                    disabled={isSaving}
                    className={`px-2 py-1 text-xs uppercase tracking-wider border rounded-sm transition-colors disabled:opacity-50 ${
                      selected
                        ? 'bg-[var(--accent)] text-black border-[var(--accent)] font-bold'
                        : 'bg-white/5 text-white border-white/20 hover:border-[var(--accent)]/60 hover:text-white'
                    }`}
                  >
                    {option.title}
                  </button>
                )
              })}
            </span>
          </span>
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

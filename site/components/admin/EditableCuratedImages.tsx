'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useAdminEdit } from './AdminEditContext'

export interface CuratedImageItem {
  /** Payload project doc id (stringified number), written back as Number(). */
  projectId: string
  projectSlug: string
  projectTitle: string
  /** Index into the project doc's raw `images` array. */
  imageIndex: number
  url: string
  alt: string
}

interface EditableCuratedImagesProps {
  /** Service doc that owns the curatedImages array. */
  documentId: string
  /** The page's images in their current effective (merged) order, visible only. */
  entries: CuratedImageItem[]
  /** All tagged images in the automatic order (project → image order),
   *  including any currently hidden ones. Diff baseline for Save. */
  autoEntries: CuratedImageItem[]
}

function itemKey(item: CuratedImageItem): string {
  return `${item.projectSlug}#${item.imageIndex}`
}

/**
 * Per-page photo curation for /services|/tech landing pages. In edit mode an
 * "Arrange photos" badge opens a panel listing the page's tagged images in
 * their current effective order with ▲ ▼ move controls and a hide toggle.
 *
 * Pin-on-move save: the arranged order is diffed against the automatic order
 * and only images whose slot differs get a pinned curatedImages row
 * ({ project, imageIndex, position }); every hidden image gets a
 * { …, hidden: true } row. Untouched images stay automatic, so future tagged
 * images still fill the highest free slot. "Reset to automatic" clears the
 * whole array.
 */
export default function EditableCuratedImages({
  documentId,
  entries,
  autoEntries,
}: EditableCuratedImagesProps) {
  const { editMode } = useAdminEdit()
  const [active, setActive] = useState(false)
  const [draftVisible, setDraftVisible] = useState<CuratedImageItem[]>(entries)
  const [draftHidden, setDraftHidden] = useState<CuratedImageItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const autoByKey = useMemo(() => {
    const map = new Map<string, { item: CuratedImageItem; autoIndex: number }>()
    autoEntries.forEach((item, autoIndex) => map.set(itemKey(item), { item, autoIndex }))
    return map
  }, [autoEntries])

  const openPanel = useCallback(() => {
    const visibleKeys = new Set(entries.map(itemKey))
    setDraftVisible(entries)
    setDraftHidden(autoEntries.filter((item) => !visibleKeys.has(itemKey(item))))
    setSaveError(null)
    setActive(true)
  }, [entries, autoEntries])

  const move = useCallback((index: number, delta: -1 | 1) => {
    setDraftVisible((prev) => {
      const next = [...prev]
      const target = index + delta
      if (target < 0 || target >= next.length) return prev
      const [row] = next.splice(index, 1)
      next.splice(target, 0, row)
      return next
    })
  }, [])

  const hide = useCallback((index: number) => {
    setDraftVisible((prev) => {
      const next = [...prev]
      const [row] = next.splice(index, 1)
      if (row) setDraftHidden((hidden) => [...hidden, row])
      return next
    })
  }, [])

  const unhide = useCallback((index: number) => {
    setDraftHidden((prev) => {
      const next = [...prev]
      const [row] = next.splice(index, 1)
      if (row) setDraftVisible((visible) => [...visible, row])
      return next
    })
  }, [])

  const patchCurated = useCallback(
    async (rows: unknown[]) => {
      const res = await fetch('/api/admin-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: 'services',
          id: documentId,
          path: 'curatedImages',
          value: rows,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Save failed')
      }
    },
    [documentId],
  )

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const hiddenKeys = new Set(draftHidden.map(itemKey))
      // Baseline: automatic order with hidden images removed.
      const baseline = autoEntries.filter((item) => !hiddenKeys.has(itemKey(item)))
      const rows: Record<string, unknown>[] = []
      // Pin every image whose slot differs from automatic.
      draftVisible.forEach((item, position) => {
        if (itemKey(baseline[position] ?? item) !== itemKey(item)) {
          rows.push({
            project: Number(item.projectId),
            imageIndex: item.imageIndex,
            position,
          })
        }
      })
      // Plus a hidden row for every hidden image (position is schema-required;
      // the auto index keeps it stable/meaningless).
      draftHidden.forEach((item) => {
        rows.push({
          project: Number(item.projectId),
          imageIndex: item.imageIndex,
          position: autoByKey.get(itemKey(item))?.autoIndex ?? 0,
          hidden: true,
        })
      })
      await patchCurated(rows)
      window.location.reload()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }, [draftVisible, draftHidden, autoEntries, autoByKey, patchCurated])

  const handleReset = useCallback(async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await patchCurated([])
      window.location.reload()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setIsSaving(false)
    }
  }, [patchCurated])

  if (!editMode || autoEntries.length === 0) return null

  if (!active) {
    return (
      <div className="mb-8 flex justify-end">
        <button
          type="button"
          onClick={openPanel}
          className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)] text-black rounded-sm shadow-lg"
        >
          Arrange photos
        </button>
      </div>
    )
  }

  return (
    <div className="mb-8 border border-[var(--accent)] rounded-sm bg-neutral-950/95 p-4 space-y-3 shadow-2xl">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
        Arrange photos
      </p>
      <p className="mono text-white text-xs">
        Reorder or hide this page&apos;s photos. Untouched photos stay automatic. Newly tagged
        photos fill the highest free slot.
      </p>

      <ul className="space-y-2 max-h-96 overflow-y-auto">
        {draftVisible.map((item, index) => (
          <li
            key={itemKey(item)}
            className="flex items-center gap-3 border border-white/10 rounded-sm p-2 bg-white/[0.03]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt} className="w-16 h-10 object-cover rounded-sm shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block mono text-xs text-white truncate">{item.projectTitle}</span>
              <span className="block text-[10px] text-white">
                #{index + 1} · image {item.imageIndex + 1}
              </span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={isSaving || index === 0}
                aria-label={`Move ${item.projectTitle} photo up`}
                className="px-2 py-1 text-xs bg-white/10 text-white border border-white/20 rounded-sm disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={isSaving || index === draftVisible.length - 1}
                aria-label={`Move ${item.projectTitle} photo down`}
                className="px-2 py-1 text-xs bg-white/10 text-white border border-white/20 rounded-sm disabled:opacity-30"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => hide(index)}
                disabled={isSaving}
                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 rounded-sm disabled:opacity-50"
              >
                Hide
              </button>
            </span>
          </li>
        ))}
      </ul>

      {draftHidden.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-white">Hidden</p>
          <ul className="space-y-2">
            {draftHidden.map((item, index) => (
              <li
                key={itemKey(item)}
                className="flex items-center gap-3 border border-white/10 rounded-sm p-2 opacity-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt} className="w-16 h-10 object-cover rounded-sm shrink-0" />
                <span className="flex-1 min-w-0 mono text-xs text-white truncate">
                  {item.projectTitle}
                </span>
                <button
                  type="button"
                  onClick={() => unhide(index)}
                  disabled={isSaving}
                  className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 rounded-sm disabled:opacity-50 shrink-0"
                >
                  Show
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)] text-black rounded-sm disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isSaving}
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 rounded-sm disabled:opacity-50"
        >
          Reset to automatic
        </button>
        <button
          type="button"
          onClick={() => setActive(false)}
          disabled={isSaving}
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 rounded-sm disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {saveError && <p className="text-xs text-red-400">{saveError}</p>}
    </div>
  )
}

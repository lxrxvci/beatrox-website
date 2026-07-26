'use client'

import React, { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAdminEdit } from './AdminEditContext'
import type { LexicalNode } from './InlineLexicalEditor'

const InlineLexicalEditor = dynamic(() => import('./InlineLexicalEditor'), {
  ssr: false,
  loading: () => <div className="p-4 text-white">Loading editor…</div>,
})

interface EditableRichTextProps {
  collection: string
  documentId: string
  fieldPath: string
  value: unknown
  children: React.ReactNode
}

export default function EditableRichText({
  collection,
  documentId,
  fieldPath,
  value,
  children,
}: EditableRichTextProps) {
  const { editMode, activeField, setActiveField } = useAdminEdit()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const isActive =
    activeField?.collection === collection &&
    activeField?.id === documentId &&
    activeField?.path === fieldPath

  const handleClick = useCallback(() => {
    if (!editMode) return
    setActiveField({ collection, id: documentId, path: fieldPath })
    setSaveError(null)
  }, [editMode, collection, documentId, fieldPath, setActiveField])

  const handleSave = useCallback(
    async (newValue: { root: LexicalNode }) => {
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
            value: newValue,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Save failed')
        }
        setActiveField(null)
        window.location.reload()
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Save failed')
      } finally {
        setIsSaving(false)
      }
    },
    [collection, documentId, fieldPath, setActiveField],
  )

  const handleCancel = useCallback(() => {
    setActiveField(null)
    setSaveError(null)
  }, [setActiveField])

  if (!editMode) {
    return <>{children}</>
  }

  return (
    <div
      onClick={handleClick}
      className={`relative transition-all ${
        isActive
          ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-black'
          : 'hover:ring-1 hover:ring-[var(--accent)]/50 hover:ring-offset-1 hover:ring-offset-black cursor-pointer'
      }`}
      data-collection={collection}
      data-document-id={documentId}
      data-field-path={fieldPath}
    >
      {!isActive && (
        <div className="absolute -top-3 -right-3 z-10">
          <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)] text-black rounded-sm shadow-lg">
            Edit
          </span>
        </div>
      )}

      {isActive ? (
        <div className="relative z-20">
          <InlineLexicalEditor
            initialValue={value}
            onSave={handleSave}
            onCancel={handleCancel}
          />
          {saveError && (
            <p className="mt-2 text-sm text-red-400">{saveError}</p>
          )}
          {isSaving && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
              <span className="text-white">Saving…</span>
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

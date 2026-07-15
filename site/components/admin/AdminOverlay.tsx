'use client'

import React, { useEffect } from 'react'
import { useAdminEdit } from './AdminEditContext'

export default function AdminOverlay() {
  const { isAdmin, editMode, setEditMode } = useAdminEdit()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setEditMode(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setEditMode])

  if (isAdmin !== true) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <button
        onClick={() => setEditMode(!editMode)}
        className={`px-5 py-3 font-semibold text-sm uppercase tracking-wider rounded-sm shadow-2xl transition-all ${
          editMode
            ? 'bg-[var(--accent)] text-black'
            : 'bg-[var(--bg-elevated)] text-white border border-white/20 hover:border-[var(--accent)]'
        }`}
      >
        {editMode ? 'Exit Edit Mode' : 'Edit Page'}
      </button>
      {editMode && (
        <div className="absolute bottom-full right-0 mb-3 w-64 p-3 bg-[var(--bg-elevated)] border border-white/10 rounded-sm shadow-2xl">
          <p className="text-xs text-white/70">
            Click any highlighted block to edit it inline. Press Esc to exit.
          </p>
        </div>
      )}
    </div>
  )
}

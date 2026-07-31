'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

export interface AdminMediaItem {
  id: string
  url: string
  filename: string
}

interface AdminEditContextValue {
  isAdmin: boolean | null
  editMode: boolean
  setEditMode: (value: boolean) => void
  activeField: { collection: string; id: string; path: string } | null
  setActiveField: (field: { collection: string; id: string; path: string } | null) => void
  /** Media library for image pickers — loaded lazily from
   *  /api/admin/media-library the first time edit mode turns on, so
   *  anonymous renders neither fetch nor serialize it. */
  mediaLibrary: AdminMediaItem[]
}

const AdminEditContext = createContext<AdminEditContextValue | null>(null)

export function useAdminEdit() {
  const ctx = useContext(AdminEditContext)
  if (!ctx) {
    return {
      isAdmin: false,
      editMode: false,
      setEditMode: () => {},
      activeField: null,
      setActiveField: () => {},
      mediaLibrary: [],
    }
  }
  return ctx
}

interface Props {
  children: React.ReactNode
}

export function AdminEditProvider({ children }: Props) {
  // Admin status is always verified client-side against /api/admin-check so
  // the server layout stays free of cookies() and pages can prerender.
  // Anonymous visitors simply get isAdmin === false after hydration; actual
  // auth is still verified server-side on every write.
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [activeField, setActiveField] = useState<{ collection: string; id: string; path: string } | null>(null)
  const [mediaLibrary, setMediaLibrary] = useState<AdminMediaItem[]>([])
  const mediaLibraryRequested = useRef(false)

  useEffect(() => {
    fetch('/api/admin-check')
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.isAdmin === true))
      .catch(() => setIsAdmin(false))
  }, [])

  useEffect(() => {
    if (!editMode || mediaLibraryRequested.current) return
    mediaLibraryRequested.current = true
    fetch('/api/admin/media-library')
      .then((res) => (res.ok ? res.json() : { mediaLibrary: [] }))
      .then((data) => setMediaLibrary(Array.isArray(data.mediaLibrary) ? data.mediaLibrary : []))
      .catch(() => {})
  }, [editMode])

  const handleSetEditMode = useCallback((value: boolean) => {
    setEditMode(value)
    if (!value) setActiveField(null)
  }, [])

  return (
    <AdminEditContext.Provider
      value={{
        isAdmin,
        editMode,
        setEditMode: handleSetEditMode,
        activeField,
        setActiveField,
        mediaLibrary,
      }}
    >
      {children}
    </AdminEditContext.Provider>
  )
}

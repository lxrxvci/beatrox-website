'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface AdminEditContextValue {
  isAdmin: boolean | null
  editMode: boolean
  setEditMode: (value: boolean) => void
  activeField: { collection: string; id: string; path: string } | null
  setActiveField: (field: { collection: string; id: string; path: string } | null) => void
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
    }
  }
  return ctx
}

interface Props {
  children: React.ReactNode
  // Set server-side from the presence of the httpOnly `payload-token` cookie.
  // Anonymous visitors skip the /api/admin-check fetch entirely; actual auth
  // is still verified server-side on every write.
  maybeAdmin?: boolean
}

export function AdminEditProvider({ children, maybeAdmin = false }: Props) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(maybeAdmin ? null : false)
  const [editMode, setEditMode] = useState(false)
  const [activeField, setActiveField] = useState<{ collection: string; id: string; path: string } | null>(null)

  useEffect(() => {
    if (!maybeAdmin) return
    fetch('/api/admin-check')
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.isAdmin === true))
      .catch(() => setIsAdmin(false))
  }, [maybeAdmin])

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
      }}
    >
      {children}
    </AdminEditContext.Provider>
  )
}

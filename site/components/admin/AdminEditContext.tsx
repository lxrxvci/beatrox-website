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
  if (!ctx) throw new Error('useAdminEdit must be used within AdminEditProvider')
  return ctx
}

interface Props {
  children: React.ReactNode
}

export function AdminEditProvider({ children }: Props) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [activeField, setActiveField] = useState<{ collection: string; id: string; path: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin-check')
      .then((res) => res.json())
      .then((data) => setIsAdmin(data.isAdmin === true))
      .catch(() => setIsAdmin(false))
  }, [])

  const handleSetEditMode = useCallback((value: boolean) => {
    setEditMode(value)
    if (!value) setActiveField(null)
  }, [])

  if (isAdmin === false) return <>{children}</>

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

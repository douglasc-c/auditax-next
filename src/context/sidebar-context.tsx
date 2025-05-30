'use client'

import React, { createContext, useContext, useState } from 'react'

interface SidebarContextType {
  isMinimized: boolean
  setIsMinimized: (value: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <SidebarContext.Provider value={{ isMinimized, setIsMinimized }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

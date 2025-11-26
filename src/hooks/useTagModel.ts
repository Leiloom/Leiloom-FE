import { useState, useCallback } from 'react'

export function useTagModal<TContext = any>() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  
  // Armazena dados extras (ex: itemId no indexa.tsx)
  const [contextData, setContextData] = useState<TContext | null>(null)

  const openTagModal = useCallback((field: string, data?: TContext) => {
    setSelectedField(field)
    if (data !== undefined) setContextData(data)
    setIsOpen(true)
  }, [])

  const closeTagModal = useCallback(() => {
    setIsOpen(false)
    setSelectedField(null)
    setContextData(null)
  }, [])

  return {
    isOpen,
    selectedField,
    contextData,
    openTagModal,
    closeTagModal,
    setIsOpen
  }
}
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface RegisterClientData {
  clientId: string
  clientUserId: string
  companyName: string
  email: string
  password: string
  cpfCnpj: string
  phone: string
  address: string
  acceptTerms: boolean
  selectedPlan: string
}

interface RegisterClientContextProps {
  formData: RegisterClientData
  setFormData: (data: Partial<RegisterClientData>) => void
  clearFormData: () => void
}

const initialFormState: RegisterClientData = {
  clientId: '',
  clientUserId: '',
  companyName: '',
  password: '',
  email: '',
  cpfCnpj: '',
  phone: '',
  address: '',
  acceptTerms: false,
  selectedPlan: '',
}

const RegisterClientContext = createContext({} as RegisterClientContextProps)

export function RegisterClientProvider({ children }: { children: ReactNode }) {
  const [formData, setFormDataState] = useState<RegisterClientData>(initialFormState)

  function setFormData(data: Partial<RegisterClientData>) {
    setFormDataState((prev) => ({ ...prev, ...data }))
  }

  function clearFormData() {
    setFormDataState(initialFormState)
  }

  return (
    <RegisterClientContext.Provider value={{ formData, setFormData, clearFormData }}>
      {children}
    </RegisterClientContext.Provider>
  )
}

export function useRegisterClient() {
  const context = useContext(RegisterClientContext)
  if (!context) {
    throw new Error('useRegisterClient must be used within a RegisterClientProvider')
  }
  return context
}

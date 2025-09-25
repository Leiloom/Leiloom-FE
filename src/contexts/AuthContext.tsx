'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { decodeToken, TokenPayload } from '@/utils/jwtUtils'

type AuthContextType = {
  user: TokenPayload | null
  isLoading: boolean
  login: (token: string, context: 'CLIENT' | 'BACKOFFICE') => void
  logout: (context: 'CLIENT' | 'BACKOFFICE') => void
  updateUserInfo: (updates: Partial<Pick<TokenPayload, 'name' | 'email'>>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TokenPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('clientToken') || localStorage.getItem('backofficeToken')
        
        if (token) {
          const decoded = decodeToken(token)
          if (decoded && decoded.exp * 1000 > Date.now()) {
            setUser(decoded)
          } else {
            // Token expirado, remove do localStorage
            localStorage.removeItem('clientToken')
            localStorage.removeItem('backofficeToken')
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error)
        // Em caso de erro, limpa tokens potencialmente corrompidos
        localStorage.removeItem('clientToken')
        localStorage.removeItem('backofficeToken')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  function login(token: string, context: 'CLIENT' | 'BACKOFFICE') {
    const key = context === 'CLIENT' ? 'clientToken' : 'backofficeToken'
    
    // Remove o token do contexto oposto se existir
    const oppositeKey = context === 'CLIENT' ? 'backofficeToken' : 'clientToken'
    localStorage.removeItem(oppositeKey)
    
    localStorage.setItem(key, token)
    const decoded = decodeToken(token)
    setUser(decoded)
  }

  function logout(context: 'CLIENT' | 'BACKOFFICE') {
    localStorage.removeItem('clientToken')
    localStorage.removeItem('backofficeToken')
    setUser(null)
  }

  function updateUserInfo(updates: Partial<Pick<TokenPayload, 'name' | 'email'>>) {
    if (user) {
      setUser({ ...user, ...updates })
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext precisa estar dentro de AuthProvider')
  return ctx
}
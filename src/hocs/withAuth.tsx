'use client'

import { useEffect, useState, ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { decodeToken, TokenPayload } from '@/utils/jwtUtils'

export function useAuth(context: 'CLIENT' | 'BACKOFFICE') {
  const [user, setUser] = useState<TokenPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const storageKey = context === 'CLIENT' ? 'clientToken' : 'backofficeToken'
  const loginPath = context === 'CLIENT' ? '/login' : '/login-backoffice'

  useEffect(() => {
    const token = localStorage.getItem(storageKey)
    if (!token) {
      router.replace(loginPath)
      return setLoading(false)
    }

    const payload = decodeToken(token)
    if (!payload || payload.context !== context || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(storageKey)
      router.replace(loginPath)
      return setLoading(false)
    }

    setUser(payload)
    setLoading(false)
  }, [])

  return { user, loading }
}
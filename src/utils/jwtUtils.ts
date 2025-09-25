// src/utils/jwtUtils.ts
export interface TokenPayload {
    sub: string
    email: string
    role: string
    cpfCnpj: string
    name: string
    context: 'BACKOFFICE' | 'CLIENT'
    clientId?: string
    exp: number
  }
  
  export function decodeToken(token: string): TokenPayload | null {
    try {
      const [, base64] = token.split('.')
      const json = atob(
        base64
          .replace(/-/g, '+')
          .replace(/_/g, '/')
      )
      return JSON.parse(json) as TokenPayload
    } catch (err) {
      return null
    }
  }
  
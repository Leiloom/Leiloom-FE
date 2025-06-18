import jwtDecode from 'jwt-decode'

export function isTokenValid(token: string): boolean {
  try {
    const decoded: any = jwtDecode(token)
    const now = Math.floor(Date.now() / 1000)
    return decoded.exp > now
  } catch (err) {
    return false
  }
}

export function getPayload(token: string): any {
  try {
    return jwtDecode(token)
  } catch {
    return null
  }
}

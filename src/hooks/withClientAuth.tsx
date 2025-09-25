import { ComponentType } from 'react'
import { useAuth } from '@/hocs/withAuth'

/**
 * Higher Order Component to protect Backoffice routes
 * @param Wrapped - Component to be wrapped
 * @returns - Wrapped component with user prop
 */
export function withClientAuth<T extends object>(Wrapped: ComponentType<T & { user: any }>) {
  return function (props: T) {
    const { user, loading } = useAuth('CLIENT')
    if (loading || !user) return null
    return <Wrapped {...props} user={user} />
  }
}

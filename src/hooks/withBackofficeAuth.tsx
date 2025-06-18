import { ComponentType } from 'react'
import { useAuth } from '@/hocs/withAuth'

export function withBackofficeAuth<T extends object>(Wrapped: ComponentType<T & { user: any }>) {
  return function (props: T) {
    const { user, loading } = useAuth('BACKOFFICE')
    if (loading || !user) return null
    return <Wrapped {...props} user={user} />
  }
}

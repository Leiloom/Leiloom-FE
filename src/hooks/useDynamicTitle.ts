'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const titleMap: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Clientes',
  '/plans': 'Planos',
  '/login': 'Login',
  '/backoffice/clients': 'Gerenciamento de Clientes',
}

export function useDynamicTitle(baseTitle = 'Leiloom Backoffice') {
  const pathname = usePathname()

   useEffect(() => {
    const pageTitle = titleMap[pathname??''] || 'Página'
    document.title = `${pageTitle} | ${baseTitle}`
  }, [pathname, baseTitle])
}

'use client'

import Navbar from '@/components/shared/Navbar'
import { LockClosedIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { useAuthContext } from '@/contexts/AuthContext'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthContext()
  const isAuthenticated = !!user
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <footer className="bg-gray-100 p-4 text-gray-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm">
            © {new Date().getFullYear()} - Leiloom. Todos os direitos reservados.
          </div>
          {!isLoading && !isAuthenticated && (
            <Link 
              href="/login-backoffice" 
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition mt-2 md:mt-0"
            >
              <LockClosedIcon className="h-4 w-4" />
              Backoffice
            </Link>
          )}
          {isLoading && (
            <div className="animate-pulse mt-2 md:mt-0">
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
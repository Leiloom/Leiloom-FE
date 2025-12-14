'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { 
  ArrowRightIcon, 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  HomeIcon,
  UsersIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ScaleIcon,
  BuildingOfficeIcon,
  TruckIcon 
} from '@heroicons/react/20/solid'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  
  const { user, logout, isLoading } = useAuthContext()
  const isAuthenticated = !!user

  const handleLogout = () => {
    const context = user?.context || 'CLIENT'
    logout(context) 
    router.push('/')
  }

  return (
    <header className="bg-neutral-900 text-white text-sm font-medium">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo + Nome */}
        <div className="flex items-center gap-2">
          <Link href="/" aria-label="Leiloom">
            <Image src="/logo.png" alt="Logo Leiloom" width={150} height={150} priority />
          </Link>
        </div>

       {/* Menu Desktop */}
      <nav className="hidden md:flex items-center gap-6">    
          
          {/* Só mostra menus específicos após carregar e confirmar contexto */}
          {!isLoading && user?.context === 'CLIENT' && (
          <>
            <Link href="/dashboard-client" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <HomeIcon className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/auctions" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <ScaleIcon className="h-4 w-4" />
              Leilões
            </Link>
            <Link href="/auctions?itemType=IMOVEL" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <BuildingOfficeIcon className="h-4 w-4" />
              Imovéis
            </Link>
            <Link href="/auctions?itemType=VEICULO" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <TruckIcon className="h-4 w-4" />
              Veículos
            </Link>
            <Link href="/users" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <UsersIcon className="h-4 w-4" />
              Usuários
            </Link>
            <Link href="/installments-client" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <CreditCardIcon className="h-4 w-4" />
              Meus Pagamentos
            </Link>
            <Link href="/client-plan-control" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <CurrencyDollarIcon className="h-4 w-4" />
              Planos
            </Link>
          </>
        )}
          {!isLoading && user?.context === 'BACKOFFICE' && (
          <>
            <Link href="/dashboard-backoffice" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <HomeIcon className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/backoffice/auctions" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <ScaleIcon className="h-4 w-4" />
              Leilões
            </Link>
            <Link href="/backoffice/clients" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <UsersIcon  className="h-4 w-4" />
              Clientes
            </Link>
            <Link href="/backoffice/users" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <UserGroupIcon className="h-4 w-4" />
              Usuários
            </Link>
            <Link href="/backoffice/plans" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <CurrencyDollarIcon className="h-4 w-4" />
              Planos
            </Link>
            <Link href="/backoffice/terms" className="flex items-center gap-2 hover:text-yellow-400 transition">
              <DocumentTextIcon className="h-4 w-4" />
              Termos
            </Link>
          </>
        )}
        </nav>

        {/* Ações Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {isLoading ? (
            // Skeleton loading para ações do usuário
            <div className="flex items-center gap-4">
              <div className="animate-pulse flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-600 rounded-full"></div>
                <div className="h-3 w-20 bg-gray-600 rounded"></div>
              </div>
              <div className="animate-pulse h-7 w-16 bg-gray-600 rounded"></div>
            </div>
          ) : isAuthenticated ? (
            <>
              <Link
                href="/profile"
                className="flex items-center text-white hover:text-yellow-400 transition text-sm"
              >
                <UserCircleIcon className="h-5 w-5 mr-1" />
                Olá, {user?.name}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center text-white hover:text-yellow-400 transition text-sm"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center text-white hover:text-yellow-400 transition text-sm"
              >
                Acesse sua conta
                <ArrowRightIcon className="ml-1 h-4 w-4 text-white" />
              </Link>
              <Link
                href="/register-client"
                className="bg-yellow-400 text-black px-4 py-1.5 text-sm rounded hover:bg-yellow-300 transition min-w-[92px] h-[32px] flex items-center justify-center font-medium"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>

        {/* Botão Mobile */}
        <button onClick={() => setIsOpen(true)} className="md:hidden text-white">
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* Drawer Mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50">
          <div className="fixed left-0 top-0 w-64 h-full bg-white text-black p-6 flex flex-col gap-4 z-50">
            <button 
              onClick={() => setIsOpen(false)}
              className="self-end mb-4 text-neutral-500 hover:text-neutral-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Links específicos do contexto - só mostra após carregar */}
            {!isLoading && user?.context === 'CLIENT' && (
              <>
                <Link
                  href="/dashboard-client"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                >
                  <HomeIcon className="h-5 w-5" />
                  Dashboard
                </Link>
                <Link
                  href="/auctions"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                >
                  <ScaleIcon className="h-5 w-5" />
                  Leilões
                </Link>
                <Link
                  href="/auctions?itemType=IMOVEL"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                >
                  <BuildingOfficeIcon className="h-5 w-5" />
                  Imovéis
                </Link>
                <Link
                  href="/auctions?itemType=VEICULO"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                >
                  <TruckIcon className="h-5 w-5" />
                  Veículos
                </Link>
                <Link
                  href="/users"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                >
                  <UsersIcon className="h-5 w-5" />
                  Usuários
                </Link>
                <Link
                  href="/installments-client"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                >
                  <CreditCardIcon className="h-5 w-5" />
                  Meus Pagamentos
                </Link>
                <Link
                  href="/client-plan-control"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                >
                  <CreditCardIcon className="h-5 w-5" />
                  Meus Planos
                </Link>
              </>
            )}
            {!isLoading && user?.context === 'BACKOFFICE' && (
              <>
                <Link
                  href="/dashboard-backoffice"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                  >
                  <HomeIcon className="h-5 w-5" />
                  Dashboard
                </Link>
                <Link
                  href="/backoffice/auctions"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                >
                  <ScaleIcon className="h-5 w-5" />
                  Leilões
                </Link>
                <Link
                  href="/backoffice/clients"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                  >
                  <UsersIcon  className="h-5 w-5" />
                  Clientes
                </Link>
                <Link
                  href="/backoffice/users"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                  >
                  <UserGroupIcon className="h-5 w-5" />
                  Usuários
                </Link>
                <Link
                  href="/backoffice/plans"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                  >
                  <CurrencyDollarIcon className="h-5 w-5" />
                  Planos
                </Link>
                <Link
                  href="/backoffice/terms"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-yellow-600 text-base"
                  >
                  <DocumentTextIcon className="h-5 w-5" />
                  Termos
                </Link>
              </>
            )}
            <hr />

            {/* Ações Mobile */}
            {isLoading ? (
              // Loading skeleton para mobile
              <div className="space-y-3">
                <div className="animate-pulse flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
                  <div className="h-3 w-16 bg-gray-300 rounded"></div>
                </div>
                <div className="animate-pulse h-8 w-24 bg-gray-300 rounded"></div>
              </div>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-base text-neutral-700"
                >
                  <UserCircleIcon className="h-5 w-5" /> Perfil
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false) }}
                  className="flex items-center gap-2 text-base text-neutral-700"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" /> Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-base text-neutral-700 flex items-center gap-1"
                >
                  Acesse sua conta <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link
                  href="/register-client"
                  onClick={() => setIsOpen(false)}
                  className="bg-yellow-400 text-black px-4 py-2 rounded text-base text-center hover:bg-yellow-300 transition"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
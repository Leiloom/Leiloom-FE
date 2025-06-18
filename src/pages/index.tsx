'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/layouts/MainLayout'
import Hero from '@/components/landing/Hero'
import { useAuthContext } from '@/contexts/AuthContext'

export default function Home() {
  const { user, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (user) {
      if (user.context === 'CLIENT') {
        router.push('/dashboard-client')
      } else if (user.context === 'BACKOFFICE') {
        router.push('/dashboard-backoffice')
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecionando...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <Hero />
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Fale com a gente</h2>
        
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Para Clientes</h3>
            <p className="text-gray-600 mb-4">
              Acesse sua conta para gerenciar seus leilões e acompanhar suas atividades.
            </p>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors font-medium"
            >
              Acessar Conta Cliente
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Administração</h3>
            <p className="text-gray-600 mb-4">
              Área restrita para administradores e equipe de back office.
            </p>
            <a
              href="/login-backoffice"
              className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Acessar Back Office
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <div className="text-center mt-16 bg-gradient-to-r from-yellow-50 to-yellow-100 p-8 rounded-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Novo por aqui?</h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Crie sua conta e comece a participar dos melhores leilões online. 
            Processo rápido e seguro!
          </p>
          <a
            href="/register-client"
            className="inline-flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold text-lg"
          >
            Criar Conta Gratuita
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>
    </MainLayout>
  )
}
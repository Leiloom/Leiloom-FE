'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MainLayout from '@/layouts/MainLayout'
import { withClientAuth } from '@/hooks/withClientAuth'
import { TokenPayload } from '@/utils/jwtUtils'
import PaymentSetupModal from '@/components/PaymentSetupModal'
import { getClientDashboardData, ClientDashboardData } from '@/services/clientDashboardService'
import { toast } from 'react-toastify'

interface Props {
  user: TokenPayload
}

function DashboardClient({ user }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Carrega dados do dashboard
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)
        const data = await getClientDashboardData()
        setDashboardData(data)
      } catch (error: any) {
        toast.error(error?.message || 'Erro ao carregar dados do dashboard.')
        console.error('Erro ao carregar dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  useEffect(() => {
    // Verifica se é um novo plano que precisa de pagamento
    const newPlan = searchParams?.get('newPlan')
    if (newPlan === 'true') {
      setShowPaymentModal(true)
      // Remove o parâmetro da URL para não mostrar o modal novamente
      router.replace('/dashboard-client', { scroll: false })
    }
  }, [searchParams, router])

  const handlePaymentComplete = () => {
    setShowPaymentModal(false)
    // Recarrega dados após pagamento
    loadDashboardData()
  }

  const handlePaymentCancel = () => {
    setShowPaymentModal(false)
  }

  // Função para recarregar dados
  const loadDashboardData = async () => {
    try {
      const data = await getClientDashboardData()
      setDashboardData(data)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar dados.')
    }
  }

  // Função para formatar preço
  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  // Função para determinar status da conta
  const getAccountStatus = () => {
    if (!dashboardData?.currentPeriod) return { text: 'Inativo', color: 'text-red-600' }
    if (!dashboardData.currentPeriod.wasConfirmed && !dashboardData.currentPeriod.isTrial) {
      return { text: 'Pendente', color: 'text-yellow-600' }
    }
    if (dashboardData.currentPeriod.daysRemaining <= 0) {
      return { text: 'Expirado', color: 'text-red-600' }
    }
    return { text: 'Ativo', color: 'text-green-600' }
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex justify-center bg-gray-50">
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo, {user.name || user.email}!
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie sua conta e acompanhe suas atividades.
          </p>
        </div>

        {/* Cards do Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Plano Atual</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-24 mt-1"></div>
                  </div>
                ) : dashboardData?.currentPlan ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.currentPlan.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatPrice(dashboardData.currentPlan.price)}
                      {dashboardData.currentPlan.price > 0 && '/mês'}
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-gray-400">Nenhum plano</p>
                )}
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-2 0h4m-4 0c0-1.1-.9-2-2-2s-2 .9-2 2m0 0h2m-2 0h-4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-16 mt-1"></div>
                  </div>
                ) : (
                  <>
                    <p className={`text-2xl font-bold ${getAccountStatus().color}`}>
                      {getAccountStatus().text}
                    </p>
                    {dashboardData?.currentPeriod?.isTrial && (
                      <span className="inline-block mt-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Período Gratuito
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                loading ? 'bg-gray-100' : getAccountStatus().text === 'Ativo' ? 'bg-green-100' : 
                getAccountStatus().text === 'Pendente' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <svg className={`h-6 w-6 ${
                  loading ? 'text-gray-400' : getAccountStatus().text === 'Ativo' ? 'text-green-600' : 
                  getAccountStatus().text === 'Pendente' ? 'text-yellow-600' : 'text-red-600'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Próximo Vencimento</p>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-20 mt-1"></div>
                  </div>
                ) : dashboardData?.currentPeriod ? (
                  <>
                    <p className={`text-2xl font-bold ${
                      dashboardData.currentPeriod.daysRemaining <= 7 ? 'text-red-600' :
                      dashboardData.currentPeriod.daysRemaining <= 15 ? 'text-yellow-600' : 'text-gray-900'
                    }`}>
                      {dashboardData.currentPeriod.daysRemaining} dias
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {dashboardData.currentPeriod.expiresAt.toLocaleDateString('pt-BR')}
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-gray-400">--</p>
                )}
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                loading ? 'bg-gray-100' : 
                !dashboardData?.currentPeriod ? 'bg-gray-100' :
                dashboardData.currentPeriod.daysRemaining <= 7 ? 'bg-red-100' :
                dashboardData.currentPeriod.daysRemaining <= 15 ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                <svg className={`h-6 w-6 ${
                  loading ? 'text-gray-400' :
                  !dashboardData?.currentPeriod ? 'text-gray-400' :
                  dashboardData.currentPeriod.daysRemaining <= 7 ? 'text-red-600' :
                  dashboardData.currentPeriod.daysRemaining <= 15 ? 'text-yellow-600' : 'text-blue-600'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Seções do Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Gerenciar Plano</span>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mt-1">Alterar ou renovar seu plano</p>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Configurações</span>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mt-1">Editar informações da conta</p>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Suporte</span>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mt-1">Precisa de ajuda? Entre em contato</p>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h2>
            {loading ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Conta criada</p>
                    <p className="text-xs text-gray-600">
                      {dashboardData?.planHistory[0]?.startDate 
                        ? `Em ${dashboardData.planHistory[0].startDate.toLocaleDateString('pt-BR')}`
                        : 'Recentemente'
                      }
                    </p>
                  </div>
                </div>
                {dashboardData?.currentPlan && (
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Plano {dashboardData.currentPlan.name} ativo
                      </p>
                      <p className="text-xs text-gray-600">
                        {dashboardData.currentPeriod?.isTrial ? 'Período gratuito' : 'Assinatura confirmada'}
                      </p>
                    </div>
                  </div>
                )}
                {dashboardData?.currentPeriod && dashboardData.currentPeriod.daysRemaining <= 7 && (
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 bg-yellow-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Vencimento próximo</p>
                      <p className="text-xs text-gray-600">
                        Renove seu plano antes de {dashboardData.currentPeriod.expiresAt.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      </div>

      {/* Modal de Configuração de Pagamento */}
      <PaymentSetupModal
        isOpen={showPaymentModal}
        onClose={handlePaymentCancel}
        onComplete={handlePaymentComplete}
        user={user}
      />
    </MainLayout>
  )
}

export default withClientAuth(DashboardClient)
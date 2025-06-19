'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MainLayout from '@/layouts/MainLayout'
import { withClientAuth } from '@/hooks/withClientAuth'
import { TokenPayload } from '@/utils/jwtUtils'
import { getClientDashboardData, ClientDashboardData } from '@/services/clientDashboardService'
import { getDetailedPaymentSummary, DetailedPaymentSummary, getPendingInstallments, PendingInstallment } from '@/services/paymentService'
import { toast } from 'react-toastify'
import { CreditCard, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react'

interface Props {
  user: TokenPayload
}

function DashboardClient({ user }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null)
  const [paymentSummary, setPaymentSummary] = useState<DetailedPaymentSummary | null>(null)
  const [pendingInstallments, setPendingInstallments] = useState<PendingInstallment[]>([])
  const [loading, setLoading] = useState(true)
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false)

  // Carrega dados do dashboard
  useEffect(() => {
    loadAllData()
  }, [])

  // Verifica se é nova assinatura
  useEffect(() => {
    const newSubscription = searchParams?.get('newSubscription')
    if (newSubscription) {
      setShowWelcomeMessage(true)
      toast.success('Assinatura criada com sucesso! Bem-vindo ao Leiloom!')
      router.replace('/dashboard-client', { scroll: false })
    }
  }, [searchParams, router])

  async function loadAllData() {
    try {
      setLoading(true)
      
      // Carrega dados em paralelo
      const [dashboardResult, paymentResult, installmentsResult] = await Promise.allSettled([
        getClientDashboardData(),
        getDetailedPaymentSummary(),
        getPendingInstallments()
      ])
      console.log('effe',paymentResult)
      if (dashboardResult.status === 'fulfilled') {
        setDashboardData(dashboardResult.value)
      } else {
        console.error('Erro ao carregar dashboard:', dashboardResult.reason)
      }

      if (paymentResult.status === 'fulfilled') {
        console.log(paymentSummary);
        setPaymentSummary(paymentResult.value)
      } else {
        console.error('Erro ao carregar resumo de pagamentos:', paymentResult.reason)
      }

      if (installmentsResult.status === 'fulfilled') {
        console.log(installmentsResult.value);
        setPendingInstallments(installmentsResult.value)
      } else {
        console.error('Erro ao carregar parcelas pendentes:', installmentsResult.reason)
      }

    } catch (error: any) {
      toast.error('Erro ao carregar dados do dashboard.')
      console.error('Erro geral:', error)
    } finally {
      setLoading(false)
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

  // Função para formatar data
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR')
  }

  // Função para calcular dias até vencimento
  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getAccountStatus = () => {
    if (!paymentSummary?.currentPlan) return { text: 'Inativo', color: 'text-red-600' }
    
    if (paymentSummary.currentPlan.period?.isTrial) {
      return { text: 'Trial Ativo', color: 'text-blue-600' }
    }
    
    if (paymentSummary.overdueAmount > 0) {
      return { text: 'Em Atraso', color: 'text-red-600' }
    }
    
    if (paymentSummary.pendingAmount > 0) {
      return { text: 'Pendente', color: 'text-yellow-600' }
    }
    
    return { text: 'Ativo', color: 'text-green-600' }
  }

  const getPaymentAlert = () => {
    if ((paymentSummary?.overdueAmount??0) > 0) {
      return {
        type: 'error' as const,
        title: 'Pagamento em Atraso',
        message: `Você possui ${formatPrice(paymentSummary?.overdueAmount??0)} em atraso.`,
        action: 'Pagar Agora'
      }
    }
    
    if (pendingInstallments.length > 0) {
      const nextDue = pendingInstallments[0]
      const daysUntilDue = getDaysUntilDue(nextDue.dueDate)
      
      if (daysUntilDue <= 7) {
        return {
          type: 'warning' as const,
          title: 'Vencimento Próximo',
          message: `Parcela de ${formatPrice(nextDue.amount)} vence em ${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}.`,
          action: 'Ver Detalhes'
        }
      }
    }
    
    if (paymentSummary?.currentPlan?.period?.isTrial) {
      const expiresAt = paymentSummary.currentPlan.period.expiresAt
      const daysLeft = getDaysUntilDue(expiresAt)
      
      if (daysLeft <= 7) {
        return {
          type: 'info' as const,
          title: 'Trial Expirando',
          message: `Seu período gratuito expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}.`,
          action: 'Escolher Plano'
        }
      }
    }
    
    return null
  }

  const alert = getPaymentAlert()

  return (
    <MainLayout>
      <div className="min-h-screen flex justify-center bg-gray-50">
        <section className="py-16 px-4 max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Bem-vindo, {user.name || user.email}!
            </h1>
            <p className="text-gray-600 mt-2">
              Gerencie sua conta e acompanhe suas atividades.
            </p>
            
            {showWelcomeMessage && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-800">
                    Parabéns! Sua conta foi criada com sucesso e seu plano está ativo.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Alerta de Pagamento */}
          {alert && (
            <div className={`mb-6 rounded-lg p-4 ${
              alert.type === 'error' ? 'bg-red-50 border border-red-200' :
              alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />}
                  {alert.type === 'warning' && <Clock className="h-5 w-5 text-yellow-600 mr-2" />}
                  {alert.type === 'info' && <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />}
                  <div>
                    <h3 className={`font-medium ${
                      alert.type === 'error' ? 'text-red-800' :
                      alert.type === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>
                      {alert.title}
                    </h3>
                    <p className={`text-sm ${
                      alert.type === 'error' ? 'text-red-700' :
                      alert.type === 'warning' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
                <button className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  alert.type === 'error' ? 'bg-red-600 text-white hover:bg-red-700' :
                  alert.type === 'warning' ? 'bg-yellow-600 text-white hover:bg-yellow-700' :
                  'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                  {alert.action}
                </button>
              </div>
            </div>
          )}

          {/* Cards do Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Plano Atual */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Plano Atual</p>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-24 mt-1"></div>
                    </div>
                  ) : paymentSummary?.currentPlan ? (
                    <>
                      <p className="text-lg font-bold text-gray-900">{paymentSummary.currentPlan.planName}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatPrice(paymentSummary.currentPlan.totalAmount / paymentSummary.currentPlan.installments)}
                        {paymentSummary.currentPlan.totalAmount > 0 && '/mês'}
                      </p>
                      {paymentSummary.currentPlan.period?.isTrial && (
                        <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Trial
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-lg font-bold text-gray-400">Nenhum plano</p>
                  )}
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-16 mt-1"></div>
                    </div>
                  ) : (
                    <p className={`text-lg font-bold ${getAccountStatus().color}`}>
                      {getAccountStatus().text}
                    </p>
                  )}
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  loading ? 'bg-gray-100' : getAccountStatus().text === 'Ativo' || getAccountStatus().text === 'Trial Ativo' ? 'bg-green-100' : 
                  getAccountStatus().text === 'Pendente' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <CheckCircle className={`h-6 w-6 ${
                    loading ? 'text-gray-400' : getAccountStatus().text === 'Ativo' || getAccountStatus().text === 'Trial Ativo' ? 'text-green-600' : 
                    getAccountStatus().text === 'Pendente' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </div>

            {/* Valor Pendente */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Pendente</p>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-20 mt-1"></div>
                    </div>
                  ) : (
                    <>
                      <p className={`text-lg font-bold ${
                        (paymentSummary?.pendingAmount ?? 0) > 0 ? 'text-yellow-600' : 'text-gray-900'
                      }`}>
                        {formatPrice(paymentSummary?.pendingAmount || 0)}
                      </p>
                      {(paymentSummary?.pendingAmount ?? 0) > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {formatPrice((paymentSummary?.overdueAmount ?? 0))} em atraso
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Próximo Vencimento */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Próximo Vencimento</p>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-20 mt-1"></div>
                    </div>
                  ) : paymentSummary?.nextDueDate ? (
                    <>
                      <p className={`text-lg font-bold ${
                        getDaysUntilDue(paymentSummary.nextDueDate) <= 7 ? 'text-red-600' :
                        getDaysUntilDue(paymentSummary.nextDueDate) <= 15 ? 'text-yellow-600' : 'text-gray-900'
                      }`}>
                        {getDaysUntilDue(paymentSummary.nextDueDate)} dias
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatDate(paymentSummary.nextDueDate)}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-gray-400">--</p>
                  )}
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Seções do Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Parcelas Pendentes */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Parcelas Pendentes</h2>
              {loading ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                  </div>
                </div>
              ) : pendingInstallments.length > 0 ? (
                <div className="space-y-3">
                  {pendingInstallments.slice(0, 3).map((installment) => {
                    const daysUntilDue = getDaysUntilDue(installment.dueDate)
                    return (
                      <div key={installment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            Parcela {installment.installmentNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {installment.payment.clientPlan.plan.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Vence em {daysUntilDue} {daysUntilDue === 1 ? 'dia' : 'dias'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatPrice(installment.amount)}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            daysUntilDue < 0 ? 'bg-red-100 text-red-800' :
                            daysUntilDue <= 7 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {daysUntilDue < 0 ? 'Vencido' : 
                             daysUntilDue <= 7 ? 'Urgente' : 'Em dia'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {pendingInstallments.length > 3 && (
                    <button className="w-full text-center py-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Ver todas as parcelas ({pendingInstallments.length})
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma parcela pendente
                </p>
              )}
            </div>

            {/* Ações Rápidas */}
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
                    <span className="font-medium">Histórico de Pagamentos</span>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Ver todos os pagamentos realizados</p>
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
          </div>
        </section>
      </div>
    </MainLayout>
  )
}

export default withClientAuth(DashboardClient)
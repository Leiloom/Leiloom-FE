'use client'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MainLayout from '@/layouts/MainLayout'
import { withClientAuth } from '@/hooks/withClientAuth'
import { TokenPayload } from '@/utils/jwtUtils'
import { getClientDashboardData, ClientDashboardData } from '@/services/clientDashboardService'
import { getDetailedPaymentSummary, DetailedPaymentSummary, getPendingPayments, PendingPayment } from '@/services/paymentService'
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
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [])

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

      const [dashboardResult, paymentResult, paymentsResult] = await Promise.allSettled([
        getClientDashboardData(),
        getDetailedPaymentSummary(),
        getPendingPayments()
      ])

      if (dashboardResult.status === 'fulfilled') {
        setDashboardData(dashboardResult.value)
      } else {
        console.error('Erro ao carregar dashboard:', dashboardResult.reason)
      }

      if (paymentResult.status === 'fulfilled') {
        setPaymentSummary(paymentResult.value)
      } else {
        console.error('Erro ao carregar resumo de pagamentos:', paymentResult.reason)
      }

      if (paymentsResult.status === 'fulfilled') {
        setPendingPayments(paymentsResult.value)
      } else {
        console.error('Erro ao carregar pagamentos pendentes:', paymentsResult.reason)
      }

    } catch (error: any) {
      toast.error('Erro ao carregar dados do dashboard.')
      console.error('Erro geral:', error)
    } finally {
      setLoading(false)
    }
  }

  const isTrialUser = () => {
    return paymentSummary?.currentPlan?.period?.isTrial || false
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR')
  }

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getNextDueInfo = () => {
    if (loading) return { type: 'loading' }

    if (isTrialUser() && paymentSummary?.currentPlan?.period?.expiresAt) {
      const trialExpiresAt = paymentSummary.currentPlan.period.expiresAt
      const daysUntilExpiration = getDaysUntilDue(trialExpiresAt)

      return {
        type: 'trial',
        days: daysUntilExpiration,
        date: trialExpiresAt,
        message: 'Trial expira em'
      }
    }

    if (paymentSummary?.nextDueDate) {
      const daysUntilDue = getDaysUntilDue(paymentSummary.nextDueDate)

      return {
        type: 'payment',
        days: daysUntilDue,
        date: paymentSummary.nextDueDate,
        message: 'Próximo pagamento em'
      }
    }

    return { type: 'none' }
  }

  const getFilteredPendingPayments = () => {
    if (isTrialUser()) {
      return []
    }
    return pendingPayments
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
    if (isTrialUser() && paymentSummary?.currentPlan?.period?.expiresAt) {
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

      return null
    }

    if ((paymentSummary?.overdueAmount ?? 0) > 0) {
      return {
        type: 'error' as const,
        title: 'Pagamento em Atraso',
        message: `Você possui ${formatPrice(paymentSummary?.overdueAmount ?? 0)} em atraso.`,
        action: 'Pagar Agora'
      }
    }

    if (pendingPayments.length > 0) {
      const nextDue = pendingPayments[0]
      const daysUntilDue = getDaysUntilDue(nextDue.dueDate)

      if (daysUntilDue <= 7) {
        return {
          type: 'warning' as const,
          title: 'Vencimento Próximo',
          message: `Pagamento de ${formatPrice(nextDue.totalAmount)} vence em ${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}.`,
          action: 'Ver Detalhes'
        }
      }
    }

    return null
  }

  const alert = getPaymentAlert()
  const dueInfo = getNextDueInfo()
  const filteredPayments = getFilteredPendingPayments()

  return (
    <MainLayout>
      <Head>
        <title>Dashboard - Leiloom</title>
        <meta name="description" content="Gerencie sua conta e acompanhe suas atividades na plataforma Leiloom" />
      </Head>
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

          {alert && (
            <div className={`mb-6 rounded-lg p-4 ${alert.type === 'error' ? 'bg-red-50 border border-red-200' :
                alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />}
                  {alert.type === 'warning' && <Clock className="h-5 w-5 text-yellow-600 mr-2" />}
                  {alert.type === 'info' && <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />}
                  <div>
                    <h3 className={`font-medium ${alert.type === 'error' ? 'text-red-800' :
                        alert.type === 'warning' ? 'text-yellow-800' :
                          'text-blue-800'
                      }`}>
                      {alert.title}
                    </h3>
                    <p className={`text-sm ${alert.type === 'error' ? 'text-red-700' :
                        alert.type === 'warning' ? 'text-yellow-700' :
                          'text-blue-700'
                      }`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
                <button className={`px-4 py-2 rounded-lg text-sm font-medium transition ${alert.type === 'error' ? 'bg-red-600 text-white hover:bg-red-700' :
                    alert.type === 'warning' ? 'bg-yellow-600 text-white hover:bg-yellow-700' :
                      'bg-blue-600 text-white hover:bg-blue-700'
                  }`}>
                  {alert.action}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${loading ? 'bg-gray-100' : getAccountStatus().text === 'Ativo' || getAccountStatus().text === 'Trial Ativo' ? 'bg-green-100' :
                    getAccountStatus().text === 'Pendente' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                  <CheckCircle className={`h-6 w-6 ${loading ? 'text-gray-400' : getAccountStatus().text === 'Ativo' || getAccountStatus().text === 'Trial Ativo' ? 'text-green-600' :
                      getAccountStatus().text === 'Pendente' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                </div>
              </div>
            </div>

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
                      <p className={`text-lg font-bold ${(paymentSummary?.pendingAmount ?? 0) > 0 ? 'text-yellow-600' : 'text-gray-900'
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

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {dueInfo.type === 'trial' ? 'Trial Expira em' : 'Próximo Vencimento'}
                  </p>
                  {dueInfo.type === 'loading' ? (
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-20 mt-1"></div>
                    </div>
                  ) : dueInfo.type === 'none' ? (
                    <p className="text-lg font-bold text-gray-400">--</p>
                  ) : (
                    <>
                      <p className={`text-lg font-bold ${(dueInfo.days ?? 0) <= 7 ? 'text-red-600' :
                          (dueInfo.days ?? 0) <= 15 ? 'text-yellow-600' : 'text-gray-900'
                        }`}>
                        {dueInfo.days} dias
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatDate(dueInfo.date ?? new Date())}
                      </p>
                      {dueInfo.type === 'trial' && (dueInfo.days ?? 0) <= 7 && (
                        <p className="text-xs text-blue-600 mt-1">
                          Escolha um plano para continuar
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isTrialUser() ? 'Informações do Trial' : 'Pagamentos Pendentes'}
              </h2>

              {loading ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                  </div>
                </div>
              ) : isTrialUser() ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <p className="font-medium text-blue-900">
                          Período Trial Ativo
                        </p>
                        <p className="text-sm text-blue-700">
                          Aproveite todos os recursos gratuitamente
                        </p>
                        {paymentSummary?.currentPlan?.period?.expiresAt && (
                          <p className="text-xs text-blue-600 mt-1">
                            Expira em: {formatDate(paymentSummary.currentPlan.period.expiresAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button className="w-full text-center py-3 px-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition font-medium">
                      Escolher outro plano
                    </button>
                  </div>
                </div>
              ) : filteredPayments.length > 0 ? (
                <div className="space-y-3">
                  {filteredPayments.slice(0, 3).map((payment) => {
                    const daysUntilDue = getDaysUntilDue(payment.dueDate)
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.clientPlan.plan.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {payment.installments > 1 ? `${payment.installments}x parcelas` : 'Pagamento único'}
                            {payment.absorbTax && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                Taxa incluída
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            Vence em {daysUntilDue} {daysUntilDue === 1 ? 'dia' : 'dias'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatPrice(payment.totalAmount)}
                          </p>
                          {payment.installments > 1 && (
                            <p className="text-xs text-gray-600">
                              {payment.installments}x de {formatPrice(payment.totalAmount / payment.installments)}
                            </p>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${daysUntilDue < 0 ? 'bg-red-100 text-red-800' :
                              daysUntilDue <= 7 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                            }`}>
                            {daysUntilDue < 0 ? 'Vencido' :
                              daysUntilDue <= 7 ? 'Necessário pagamento' : 'Em dia'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {filteredPayments.length > 3 && (
                    <a
                      href="/payments-client"
                      className="w-full text-center py-2 text-blue-600 hover:text-blue-700 text-sm font-medium block"
                    >
                      Ver todos pagamentos ({filteredPayments.length})
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Nenhum pagamento pendente
                </p>
              )}
            </div>

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

                <button 
                  onClick={() => router.push('/payments-client')}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition"
                >
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
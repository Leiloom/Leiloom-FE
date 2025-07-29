'use client'

declare global {
  interface Window {
    MercadoPago: any
  }
}
import { activateClientPlan } from '@/services/clientPlanService'
import Head from 'next/head'
import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Dialog, Transition } from '@headlessui/react'
import MainLayout from '@/layouts/MainLayout'
import { withClientAuth } from '@/hooks/withClientAuth'
import { Button } from '@/components/shared/Button'
import { TokenPayload } from '@/utils/jwtUtils'
import {
  getDetailedPaymentSummary,
  createSubscriptionOnly,
  getPaymentDetails,
  getPendingPayments,
  cancelPayment,
  DetailedPaymentSummary,
  PendingPayment
} from '@/services/paymentService'
import { getActivePlans } from '@/services/planService'
import { getAllClientPlans } from '@/services/clientPlanService'
import { Plan } from '@/types/plan'
import {
  Calendar,
  CreditCard,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Crown,
  Users,
  Clock,
  Zap,
  ArrowUp,
  ExternalLink,
  Banknote,
  Gift
} from 'lucide-react'
import { getReactivatableClientPlans } from '@/services/clientPlanService'
interface Props {
  user: TokenPayload
}

function ClientPlanControlPage({ user }: Props) {
  const router = useRouter()
  const [paymentSummary, setPaymentSummary] = useState<DetailedPaymentSummary | null>(null)
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])
  const [clientPlans, setClientPlans] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [createdPaymentId, setCreatedPaymentId] = useState<string | null>(null)

  interface PlanPeriod {
    startsAt: string | Date
    expiresAt: string | Date
    isCurrent?: boolean
    isTrial?: boolean
  }

  interface ReactivatePlan {
    status: string
    period?: PlanPeriod
  }

  interface ClientPlanPeriod {
    startsAt: string | Date;
    expiresAt: string | Date;
    isCurrent?: boolean;
    isTrial?: boolean;
  }

  interface ClientPlan {
    periods?: ClientPlanPeriod[];
    [key: string]: any;
  }

  const canReactivatePlan = (clientPlan: ClientPlan): boolean => {
    if (!clientPlan.periods || !Array.isArray(clientPlan.periods)) return false;
    const now = new Date();

    // Pega o período vigente e não atual
    return clientPlan.periods.some((period: ClientPlanPeriod) =>
      period.isCurrent === false &&
      new Date(period.expiresAt) >= now
    );
  }



  useEffect(() => {
    loadData()
  }, [])

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!createdPaymentId) return

    const interval = setInterval(async () => {
      try {
        const paymentData = await getPaymentDetails(createdPaymentId)
        console.log('🔄 Verificando status do pagamento:', paymentData)

        if (paymentData.status === 'PAID') {
          clearInterval(interval)
          toast.success('Pagamento aprovado! Seu plano foi ativado.')
          setIsUpgradeModalOpen(false)
          setCreatedPaymentId(null)
          loadData() 
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [createdPaymentId])

  async function loadData() {
    setIsLoading(true)
    try {
      const [summaryData, plansData, clientPlansData, pendingPaymentsData] = await Promise.all([
  getDetailedPaymentSummary(),
  getActivePlans(),
  getReactivatableClientPlans(user.clientId ?? ''),
  getPendingPayments()
])
      setPaymentSummary(summaryData)
      setAvailablePlans(plansData)
      setClientPlans(clientPlansData)
      setPendingPayments(pendingPaymentsData)
    } catch (error) {
      toast.error('Erro ao carregar informações do plano')
      console.error('Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('pt-BR')
  }

  const getDaysUntilExpiration = () => {
    if (!paymentSummary?.currentPlan?.period?.expiresAt) return null

    const expirationDate = new Date(paymentSummary.currentPlan.period.expiresAt)
    const today = new Date()
    const diffTime = expirationDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const getPlanStatusInfo = () => {
    const currentPlan = paymentSummary?.currentPlan
    if (!currentPlan) {
      return {
        status: 'no-plan',
        message: 'Nenhum plano ativo',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: AlertTriangle
      }
    }

    if (currentPlan.period?.isTrial) {
      const daysLeft = getDaysUntilExpiration()
      if (daysLeft && daysLeft <= 0) {
        return {
          status: 'trial-expired',
          message: 'Trial expirado',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: AlertTriangle
        }
      }
      if (daysLeft && daysLeft <= 3) {
        return {
          status: 'trial-ending',
          message: `Trial expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: Clock
        }
      }
      return {
        status: 'trial-active',
        message: `Trial ativo - ${daysLeft} dias restantes`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: Gift
      }
    }

    const daysLeft = getDaysUntilExpiration()
    if (daysLeft && daysLeft <= 0) {
      return {
        status: 'expired',
        message: 'Plano expirado',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: AlertTriangle
      }
    }
    if (daysLeft && daysLeft <= 7) {
      return {
        status: 'expiring-soon',
        message: `Expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: Clock
      }
    }

    return {
      status: 'active',
      message: `Ativo até ${formatDate(currentPlan.period?.expiresAt || '')}`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle
    }
  }

  const generatePlanFeatures = (plan: Plan): string[] => {
    const features = []

    if (plan.numberOfUsers === 1) {
      features.push('1 usuário')
    } else if ((plan.numberOfUsers ?? 1) > 100) {
      features.push('Usuários ilimitados')
    } else {
      features.push(`${plan.numberOfUsers} usuários`)
    }

    features.push(`${plan.durationDays} dias de acesso`)

    if (plan.description) {
      features.push(plan.description)
    }

    return features
  }

  // ✅ FUNÇÃO MELHORADA para verificar se já teve trial
  const hasHadTrial = () => {
    // Verifica nos clientPlans e seus períodos
    const hadTrialFromPlans = clientPlans.some(cp =>
      cp.periods?.some((period: any) => period.isTrial) ||
      cp.plan?.isTrial
    )

    // Verifica nos pendingPayments
    const hadTrialFromPending = pendingPayments.some(payment =>
      payment.clientPlan.plan?.isTrial
    )

    // Verifica no plano atual
    const currentTrialActive = paymentSummary?.currentPlan?.period?.isTrial

    return hadTrialFromPlans || hadTrialFromPending || currentTrialActive
  }

  // ✅ FILTRAR planos disponíveis com validação mais robusta
  const getAvailablePlans = () => {
    const hadTrial = hasHadTrial()

    return availablePlans.filter(plan => {
      // Remove planos trial se já teve trial
      if (plan.isTrial && hadTrial) {
        return false
      }
      return true
    })
  }

  const isUpgradeAvailable = (plan: Plan) => {
    if (!paymentSummary?.currentPlan) return true
    if (paymentSummary.currentPlan.period?.isTrial) return !plan.isTrial

    // Considera upgrade se o preço for maior ou se tem mais recursos
    return plan.price > (paymentSummary.currentPlan.totalAmount || 0) ||
      (plan.numberOfUsers ?? 1) > (paymentSummary.currentPlan.numberOfUsers || 1)
  }

  // ✅ VALIDAÇÃO antes de selecionar plano
  const handleSelectPlan = async (plan: Plan) => {
    // ✅ VALIDAÇÃO ADICIONAL: Impedir selecionar trial se já teve
    if (plan.isTrial && hasHadTrial()) {
      toast.error('Você já utilizou um período trial anteriormente.')
      return
    }

    // Verificar se há pagamentos pendentes
    if (pendingPayments.length > 0) {
      const confirmCancel = window.confirm(
        `Você tem ${pendingPayments.length} pagamento(s) pendente(s). ` +
        'Ao selecionar um novo plano, os pagamentos pendentes serão cancelados. ' +
        'Deseja continuar?'
      )

      if (!confirmCancel) {
        return
      }

      // Cancelar todos os pagamentos pendentes
      try {
        setIsLoading(true)
        await Promise.all(
          pendingPayments.map(payment =>
            cancelPayment(payment.id, 'Cancelado para criação de novo plano')
          )
        )

        // Atualizar lista de pagamentos pendentes
        const updatedPendingPayments = await getPendingPayments()
        setPendingPayments(updatedPendingPayments)

        toast.success('Pagamentos pendentes cancelados com sucesso')
      } catch (error) {
        toast.error('Erro ao cancelar pagamentos pendentes')
        console.error('Erro:', error)
        return
      } finally {
        setIsLoading(false)
      }
    }

    setSelectedPlan(plan)
    setIsUpgradeModalOpen(true)
  }

  interface HandleReactivatePlanPeriod {
    startsAt: string | Date;
    expiresAt: string | Date;
  }

  interface HandleReactivatePlanClientPlan {
    id: string;
    [key: string]: any;
  }

  const handleReactivatePlan = async (
    clientPlan: HandleReactivatePlanClientPlan,
    period: HandleReactivatePlanPeriod
  ): Promise<void> => {
    setIsLoading(true)
    try {
      await activateClientPlan(clientPlan.id, {
        startsAt: typeof period.startsAt === 'string' ? period.startsAt : period.startsAt.toISOString(),
        expiresAt: typeof period.expiresAt === 'string' ? period.expiresAt : period.expiresAt.toISOString()
      })
      toast.success('Plano reativado com sucesso!')
      await loadData()
    } catch (err) {
      toast.error('Erro ao reativar o plano.')
    } finally {
      setIsLoading(false)
    }
  }


  // ✅ VALIDAÇÃO antes de criar assinatura
  const handleCreateSubscription = async () => {
    if (!selectedPlan || !user.clientId) return

    // ✅ VALIDAÇÃO DUPLA: Verificar trial novamente
    if (selectedPlan.isTrial && hasHadTrial()) {
      toast.error('Você já utilizou um período trial anteriormente.')
      setIsUpgradeModalOpen(false)
      return
    }


    setIsProcessingPayment(true)
    try {
      // Criar a assinatura - sempre com PIX por padrão, o MP vai gerenciar o parcelamento
      const subscriptionData = await createSubscriptionOnly({
        clientId: user.clientId,
        planId: selectedPlan.id!,
        installments: selectedPlan.maxInstallments || 1, // MP vai gerenciar as parcelas
        paymentMethod: 'PIX' // Valor padrão, o MP vai permitir escolher
      })

      if (subscriptionData.payment?.id) {
        setCreatedPaymentId(subscriptionData.payment.id)

        // Ir direto para pagamento
        await handleGoToPayment(subscriptionData.payment.id)
      }
    } catch (error: any) {
      // ✅ TRATAMENTO específico para erro de trial
      if (error.message?.includes('trial anteriormente')) {
        toast.error('Você já utilizou um período trial anteriormente.')
      } else {
        toast.error(error.message || 'Erro ao criar assinatura')
      }
      console.error('Erro:', error)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const loadMercadoPagoScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.MercadoPago) {
        resolve()
        return
      }

      const existingScript = document.querySelector('script[src*="mercadopago"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve())
        existingScript.addEventListener('error', () => reject(new Error('Erro ao carregar MercadoPago')))
        return
      }

      const script = document.createElement('script')
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Erro ao carregar MercadoPago'))
      document.head.appendChild(script)
    })
  }

  const handleGoToPayment = async (paymentId: string) => {
    if (!selectedPlan) return

    try {
      const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
      if (!mpPublicKey) {
        toast.error('Chave pública do Mercado Pago não configurada')
        return
      }

      await loadMercadoPagoScript()

      if (!window.MercadoPago) {
        toast.error('Mercado Pago não está disponível. Tente novamente.')
        return
      }

      const preferenceData = {
        items: [
          {
            title: `Assinatura - ${selectedPlan.name}`,
            quantity: 1,
            unit_price: selectedPlan.price,
            currency_id: 'BRL'
          }
        ],
        payer: {
          name: user.name?.split(' ')[0] || 'Cliente',
          surname: user.name?.split(' ').slice(1).join(' ') || 'Leiloom',
          email: user.email
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_MP_URL}/client/plan-control`,
          failure: `${process.env.NEXT_PUBLIC_MP_URL}/client/plan-control`,
          pending: `${process.env.NEXT_PUBLIC_MP_URL}/client/plan-control`
        },
        external_reference: `payment_${paymentId}`,
        notification_url: `${process.env.NEXT_PUBLIC_MP_URL}/api/mercadopago/webhook`,
        statement_descriptor: 'Leiloom',
        payment_methods: {
          excluded_payment_types: [],
          excluded_payment_methods: [],
          installments: selectedPlan.maxInstallments || 1
        },
        metadata: {
          plan_name: selectedPlan.name,
          user_email: user.email,
          payment_id: paymentId,
          client_id: user.clientId,
          installments: selectedPlan.maxInstallments,
          absorb_tax: selectedPlan.absorbTax
        }
      }
      console.log('Enviando para Mercado Pago:\n', JSON.stringify(preferenceData, null, 2))


      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(preferenceData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || `Erro HTTP: ${response.status}`)
      }

      const { id: preferenceId } = await response.json()

      if (!preferenceId) {
        throw new Error('ID da preferência não retornado')
      }

      const mp = new window.MercadoPago(mpPublicKey, {
        locale: 'pt-BR'
      })

      mp.checkout({
        preference: {
          id: preferenceId
        },
        autoOpen: true
      })

    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar pagamento. Tente novamente.')
      console.error('Erro no pagamento:', error)
    }
  }

  // Aplicar estilos para o Mercado Pago
  useEffect(() => {
    const applyHeightFix = () => {
      document.documentElement.style.height = '100%'
      document.body.style.height = '100%'

      const root = document.getElementById('root-app')
      if (root) {
        root.style.setProperty('height', '100%', 'important')
      }
    }

    const addMercadoPagoStyles = () => {
      const existingStyle = document.getElementById('mp-custom-styles')
      if (existingStyle) return

      const style = document.createElement('style')
      style.id = 'mp-custom-styles'
      style.innerHTML = `
        .layout--modal .layout-main, .layout--modal .layout-main .optimus{
          height: 200vh !important;
          min-height: 500px !important;
        }
      `
      document.head.appendChild(style)
    }

    applyHeightFix()
    addMercadoPagoStyles()

    return () => {
      document.getElementById('mp-custom-styles')?.remove()
    }
  }, [])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando informações do seu plano...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const statusInfo = getPlanStatusInfo()
  const StatusIcon = statusInfo.icon
  const currentPlan = paymentSummary?.currentPlan

  return (
    <MainLayout>
      <Head>
        <title>Controle de Plano - Leiloom</title>
        <meta name="description" content="Gerencie seu plano e assinatura na plataforma Leiloom" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-6xl">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Controle de Plano</h1>
            <p className="text-gray-600">Gerencie sua assinatura e faça upgrades quando necessário</p>
          </div>

          {/* Status do Plano Atual */}
          <div className={`border rounded-lg p-6 mb-8 ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${statusInfo.bgColor}`}>
                  <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {currentPlan ? currentPlan.planName : 'Nenhum Plano Ativo'}
                  </h2>
                  <p className={`text-sm font-medium ${statusInfo.color} mb-3`}>
                    {statusInfo.message}
                  </p>

                  {currentPlan && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Valor:</span>
                        <div className="font-semibold text-gray-900">
                          {formatPrice(currentPlan.totalAmount)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Usuários:</span>
                        <div className="font-semibold text-gray-900">
                          {currentPlan.numberOfUsers}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Parcelamento:</span>
                        <div className="font-semibold text-gray-900">
                          {currentPlan.installments > 1 ? `${currentPlan.installments}x` : 'À vista'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Método:</span>
                        <div className="font-semibold text-gray-900">
                          {currentPlan.paymentMethod === 'PIX' ? 'PIX' :
                            currentPlan.paymentMethod === 'CREDIT_CARD' ? 'Cartão' :
                              currentPlan.paymentMethod}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentPlan?.period && (
                    <div className="mt-4 p-3 bg-white/50 rounded border">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-gray-600">Período: </span>
                          <span className="font-medium text-gray-800">
                            {formatDate(currentPlan.period.startsAt)} - {formatDate(currentPlan.period.expiresAt)}
                          </span>
                        </div>
                        {currentPlan.period.isTrial && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Trial
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de ação baseado no status */}
              <div className="ml-4">
                {(statusInfo.status === 'no-plan' ||
                  statusInfo.status === 'trial-ending' ||
                  statusInfo.status === 'trial-expired' ||
                  statusInfo.status === 'expired' ||
                  statusInfo.status === 'expiring-soon') && (
                    <Button
                      onClick={() => {
                        const recommendedPlan = getAvailablePlans().find(p => !p.isTrial && p.price > 0)
                        if (recommendedPlan) {
                          handleSelectPlan(recommendedPlan)
                        }
                      }}
                      variant="primary"
                      className="whitespace-nowrap"
                    >
                      {statusInfo.status === 'no-plan' ? 'Escolher Plano' :
                        statusInfo.status.includes('trial') ? 'Fazer Upgrade' : 'Renovar Plano'}
                    </Button>
                  )}
              </div>
            </div>
          </div>

          {/* Planos Disponíveis */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Planos Disponíveis</h3>
                <p className="text-gray-600 text-sm">
                  {currentPlan?.period?.isTrial ? 'Faça upgrade do seu trial' : 'Upgrade ou troque seu plano atual'}
                </p>
              </div>
              {pendingPayments.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <p className="text-sm text-orange-700">
                    ⚠️ {pendingPayments.length} pagamento(s) pendente(s)
                  </p>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Planos Pagos e Vigentes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientPlans.map((clientPlan) => {
                    interface VigentePeriod {
                    startsAt: string | Date;
                    expiresAt: string | Date;
                    isCurrent?: boolean;
                    isTrial?: boolean;
                    }

                    const vigentePeriod: VigentePeriod | undefined = clientPlan.periods?.find(
                    (p: VigentePeriod) => !p.isCurrent && new Date(p.expiresAt) >= new Date()
                    )
                  if (!vigentePeriod) return null

                  return (
                    <div key={clientPlan.id} className="border rounded-lg p-6 relative bg-white">
                      <div className="mb-4">
                        <h4 className="text-lg font-bold text-gray-900">{clientPlan.plan?.name}</h4>
                        <p className="text-sm text-gray-600">
                          Período: {formatDate(vigentePeriod.startsAt)} até {formatDate(vigentePeriod.expiresAt)}
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => handleReactivatePlan(clientPlan, vigentePeriod)}
                        className="w-full"
                      >
                        Ativar Plano
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getAvailablePlans().map((plan) => {
                const isCurrentPlan = currentPlan?.planName === plan.name
                const canUpgrade = isUpgradeAvailable(plan)
                const isTrialBlocked = plan.isTrial && hasHadTrial()

                return (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-6 relative transition-all ${isTrialBlocked
                        ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                        : isCurrentPlan
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                  >
                    {/* ✅ INDICADOR de trial bloqueado */}
                    {isTrialBlocked && (
                      <div className="absolute -top-3 left-4">
                        <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                          Trial Usado
                        </span>
                      </div>
                    )}

                    {isCurrentPlan && !isTrialBlocked && (
                      <div className="absolute -top-3 left-4">
                        <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                          Plano Atual
                        </span>
                      </div>
                    )}

                    {canUpgrade && !isCurrentPlan && !plan.isTrial && !isTrialBlocked && (
                      <div className="absolute -top-3 right-4">
                        <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          Upgrade
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                        {plan.isTrial && !isTrialBlocked && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Trial Gratuito
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(plan.price)}
                        </div>
                        {plan.price > 0 && (
                          <div className="text-sm text-gray-600">/mês</div>
                        )}
                      </div>
                    </div>

                    <ul className="text-sm text-gray-600 space-y-2 mb-6">
                      {generatePlanFeatures(plan).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="space-y-2 mb-4">
                      {plan.allowInstallments && !plan.isTrial && (
                        <div className="flex items-center text-xs text-blue-600">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Até {plan.maxInstallments}x no cartão
                        </div>
                      )}
                      {plan.absorbTax && (
                        <div className="flex items-center text-xs text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Taxa inclusa no preço
                        </div>
                      )}
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {plan.durationDays} dias de acesso
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isCurrentPlan}
                      variant={isCurrentPlan ? "neutral" : canUpgrade ? "primary" : "neutral"}
                      className="w-full"
                    >
                      {isCurrentPlan ? 'Plano Atual' :
                        plan.isTrial ? 'Iniciar Trial' :
                          canUpgrade ? 'Fazer Upgrade' : 'Selecionar Plano'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Informações Importantes</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Upgrades são ativados imediatamente após confirmação do pagamento</p>
                  <p>• Downgrades entram em vigor no próximo ciclo de cobrança</p>
                  <p>• Trials podem ser convertidos em planos pagos a qualquer momento</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Upgrade/Seleção de Plano */}
      <Transition appear show={isUpgradeModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isProcessingPayment && setIsUpgradeModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {selectedPlan?.isTrial ? 'Iniciar Trial Gratuito' : 'Selecionar Plano'}
                    </Dialog.Title>
                  </div>

                  {selectedPlan && (
                    <div className="p-6 space-y-6">
                      {/* Resumo do Plano */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{selectedPlan.name}</h3>
                            {selectedPlan.description && (
                              <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {formatPrice(selectedPlan.price)}
                            </div>
                            {selectedPlan.price > 0 && (
                              <div className="text-sm text-gray-600">/mês</div>
                            )}
                          </div>
                        </div>

                        <ul className="text-sm text-gray-600 space-y-1 mb-4">
                          {generatePlanFeatures(selectedPlan).map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        {/* Informações de parcelamento e taxa */}
                        <div className="space-y-2">
                          {selectedPlan.allowInstallments && !selectedPlan.isTrial && (
                            <div className="flex items-center text-xs text-blue-600">
                              <CreditCard className="h-3 w-3 mr-1" />
                              Até {selectedPlan.maxInstallments}x no cartão (via Mercado Pago)
                            </div>
                          )}
                          {selectedPlan.absorbTax && (
                            <div className="flex items-center text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Taxa inclusa no preço
                            </div>
                          )}
                          {!selectedPlan.absorbTax && !selectedPlan.isTrial && (
                            <div className="flex items-center text-xs text-orange-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Taxa do Mercado Pago será adicionada
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status do pagamento em andamento */}
                      {createdPaymentId && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                            <div>
                              <p className="text-sm font-medium text-blue-800">
                                Aguardando confirmação do pagamento...
                              </p>
                              <p className="text-xs text-blue-600">
                                Seu plano será ativado automaticamente após a confirmação
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Botões de ação */}
                      <div className="flex space-x-3">
                        <Button
                          type="button"
                          onClick={() => setIsUpgradeModalOpen(false)}
                          variant="neutral"
                          className="flex-1"
                          disabled={isProcessingPayment}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={handleCreateSubscription}
                          variant="primary"
                          className="flex-1"
                          disabled={isProcessingPayment}
                        >
                          {isProcessingPayment ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Processando...</span>
                            </div>
                          ) : selectedPlan.isTrial ? (
                            'Iniciar Trial'
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span>Ir para Pagamento</span>
                              <ExternalLink className="h-4 w-4" />
                            </div>
                          )}
                        </Button>
                      </div>

                      {/* Informação adicional */}
                      <div className="text-xs text-gray-500 text-center">
                        {selectedPlan.isTrial ? (
                          'Seu trial será ativado imediatamente e você terá acesso completo por ' + selectedPlan.durationDays + ' dias'
                        ) : (
                          'Você será redirecionado para o Mercado Pago onde poderá escolher a forma de pagamento e parcelamento'
                        )}
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </MainLayout>
  )
}

export default withClientAuth(ClientPlanControlPage)
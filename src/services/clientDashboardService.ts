import { api } from './api'
import { handleAuthError } from './authService'
import { getDetailedPaymentSummary, DetailedPaymentSummary } from './paymentService'

export interface ClientDashboardData {
  currentPlan: {
    id: string
    name: string
    price: number
    description?: string
    isTrial: boolean
  } | null
  currentPeriod: {
    id: string
    startsAt: Date
    expiresAt: Date
    daysRemaining: number
    isTrial: boolean
    wasConfirmed: boolean
    isCurrent: boolean
  } | null
  planHistory: Array<{
    planName: string
    startDate: Date
    endDate: Date
    wasActive: boolean
  }>
  paymentSummary: DetailedPaymentSummary | null
  accountStatus: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'INACTIVE'
}

export async function getClientDashboardData(): Promise<ClientDashboardData> {
  try {
    const [
      currentPlanResponse,
      planHistoryResponse,
      paymentSummary
    ] = await Promise.allSettled([
      api.get('/client-plans/current'),
      api.get('/client-plans/history'),
      getDetailedPaymentSummary()
    ])

    const currentPlan = currentPlanResponse.status === 'fulfilled' ? currentPlanResponse.value.data : null

    const planHistory = planHistoryResponse.status === 'fulfilled' ? planHistoryResponse.value.data : []

    const paymentSummaryData = paymentSummary.status === 'fulfilled' ? paymentSummary.value : null

    let currentPeriod = null
    if (paymentSummaryData?.currentPlan?.period) {
      currentPeriod = {
        id: `period-${Date.now()}`,
        startsAt: paymentSummaryData.currentPlan.period.startsAt,
        expiresAt: paymentSummaryData.currentPlan.period.expiresAt,
        isTrial: paymentSummaryData.currentPlan.period.isTrial,
        wasConfirmed: true,
        isCurrent: true
      }
    }

    const processedCurrentPlan = currentPlan ? {
      id: currentPlan.id,
      name: currentPlan.plan.name,
      price: currentPlan.plan.price,
      description: currentPlan.plan.description,
      isTrial: currentPlan.plan.isTrial
    } : null

    const processedCurrentPeriod = currentPeriod ? {
      id: currentPeriod.id,
      startsAt: new Date(currentPeriod.startsAt),
      expiresAt: new Date(currentPeriod.expiresAt),
      daysRemaining: calculateDaysRemaining(new Date(currentPeriod.expiresAt)),
      isTrial: currentPeriod.isTrial,
      wasConfirmed: currentPeriod.wasConfirmed,
      isCurrent: currentPeriod.isCurrent
    } : null

    const processedPlanHistory = planHistory.map((item: any) => ({
      planName: item.plan.name,
      startDate: new Date(item.createdOn),
      endDate: item.periods?.[0] ? new Date(item.periods[0].expiresAt) : new Date(),
      wasActive: item.current
    }))

    const accountStatus = determineAccountStatus(
      processedCurrentPlan,
      processedCurrentPeriod,
      paymentSummaryData
    )

    return {
      currentPlan: processedCurrentPlan,
      currentPeriod: processedCurrentPeriod,
      planHistory: processedPlanHistory,
      paymentSummary: paymentSummaryData,
      accountStatus
    }
  } catch (error: any) {
    console.error('❌ Erro crítico ao carregar dashboard:', error)
    return handleAuthError(error, 'Erro ao carregar dados do dashboard.')
  }
}

export async function getCurrentClientPeriod() {
  try {
    const paymentSummary = await getDetailedPaymentSummary()
    if (paymentSummary?.currentPlan?.period) {
      const period = {
        id: `period-${Date.now()}`,
        startsAt: paymentSummary.currentPlan.period.startsAt,
        expiresAt: paymentSummary.currentPlan.period.expiresAt,
        daysRemaining: calculateDaysRemaining(paymentSummary.currentPlan.period.expiresAt),
        isTrial: paymentSummary.currentPlan.period.isTrial,
        wasConfirmed: true,
        isCurrent: true
      }
      return period
    }
    return null
  } catch (error: any) {
    console.error('❌ Erro ao buscar período atual:', error)
    return handleAuthError(error, 'Erro ao buscar período atual.')
  }
}

export async function getCurrentClientPlan() {
  try {
    const response = await api.get('/client-plans/current')
    const data = response.data
    
    if (!data) return null
    
    return {
      id: data.id,
      name: data.plan.name,
      price: data.plan.price,
      description: data.plan.description,
      isTrial: data.plan.isTrial,
      totalAmount: data.totalAmount,
      installments: data.installments,
      paymentMethod: data.paymentMethod,
      createdOn: new Date(data.createdOn)
    }
  } catch (error: any) {
    console.error('❌ Erro ao buscar plano atual:', error)
    return handleAuthError(error, 'Erro ao buscar plano atual.')
  }
}

export async function getClientPlanHistory() {
  try {
    const response = await api.get('/client-plans/history')
    return response.data.map((item: any) => ({
      id: item.id,
      planName: item.plan.name,
      planPrice: item.plan.price,
      totalAmount: item.totalAmount,
      installments: item.installments,
      paymentMethod: item.paymentMethod,
      startDate: new Date(item.createdOn),
      endDate: item.periods?.[0] ? new Date(item.periods[0].expiresAt) : null,
      wasActive: item.current,
      periods: item.periods?.map((period: any) => ({
        id: period.id,
        startsAt: new Date(period.startsAt),
        expiresAt: new Date(period.expiresAt),
        isTrial: period.isTrial,
        wasConfirmed: period.wasConfirmed,
        isCurrent: period.isCurrent
      })) || []
    }))
  } catch (error: any) {
    console.error('❌ Erro ao buscar histórico:', error)
    return handleAuthError(error, 'Erro ao buscar histórico de planos.')
  }
}

function calculateDaysRemaining(expirationDate: Date): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const expiry = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate())
  
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

function determineAccountStatus(
  currentPlan: any,
  currentPeriod: any,
  paymentSummary: DetailedPaymentSummary | null
): 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'INACTIVE' {
  if (!currentPlan) return 'INACTIVE'
  if (!currentPeriod) return 'ACTIVE'
  if (currentPeriod.daysRemaining < 0) return 'EXPIRED'
  if (paymentSummary && paymentSummary.overdueAmount > 0) return 'PENDING'
  if (!currentPeriod.wasConfirmed && !currentPeriod.isTrial) return 'PENDING'
  return 'ACTIVE'
}

export async function renewCurrentPeriod() {
  try {
    const response = await api.post('/client-period-plans/renew')
    return {
      ...response.data,
      startsAt: new Date(response.data.startsAt),
      expiresAt: new Date(response.data.expiresAt)
    }
  } catch (error: any) {
    return handleAuthError(error, 'Erro ao renovar período.')
  }
}

export async function confirmCurrentPeriod() {
  try {
    const currentPeriod = await getCurrentClientPeriod()
    if (!currentPeriod) {
      throw new Error('Nenhum período atual encontrado.')
    }

    const response = await api.patch(`/client-period-plans/${currentPeriod.id}`, {
      wasConfirmed: true
    })
    
    return {
      ...response.data,
      startsAt: new Date(response.data.startsAt),
      expiresAt: new Date(response.data.expiresAt)
    }
  } catch (error: any) {
    return handleAuthError(error, 'Erro ao confirmar período.')
  }
}

export async function getClientStats() {
  try {
    const dashboardData = await getClientDashboardData()
    
    return {
      hasActivePlan: !!dashboardData.currentPlan,
      isTrialUser: dashboardData.currentPeriod?.isTrial || false,
      daysUntilExpiration: dashboardData.currentPeriod?.daysRemaining || 0,
      totalPlansUsed: dashboardData.planHistory.length,
      accountStatus: dashboardData.accountStatus,
      needsPaymentAttention: (dashboardData.paymentSummary?.overdueAmount ?? 0) > 0,
      upcomingPaymentAmount: dashboardData.paymentSummary?.nextPaymentAmount || 0,
      nextPaymentDate: dashboardData.paymentSummary?.nextDueDate || null
    }
  } catch (error: any) {
    return handleAuthError(error, 'Erro ao buscar estatísticas.')
  }
}

export async function checkPremiumAccess(): Promise<boolean> {
  try {
    const stats = await getClientStats()
    return stats.hasActivePlan && 
           stats.accountStatus === 'ACTIVE' && 
           !stats.needsPaymentAttention
  } catch (error) {
    console.error('Erro ao verificar acesso premium:', error)
    return false
  }
}

export async function getDashboardAlerts() {
  try {
    const dashboardData = await getClientDashboardData()
    const alerts = []

    if (dashboardData.currentPeriod && 
        dashboardData.currentPeriod.daysRemaining <= 7 && 
        dashboardData.currentPeriod.daysRemaining > 0) {
      alerts.push({
        type: 'warning' as const,
        title: dashboardData.currentPeriod.isTrial ? 'Trial expirando' : 'Plano expirando em breve',
        message: `${dashboardData.currentPeriod.isTrial ? 'Seu trial' : 'Seu plano'} expira em ${dashboardData.currentPeriod.daysRemaining} ${dashboardData.currentPeriod.daysRemaining === 1 ? 'dia' : 'dias'}.`,
        action: dashboardData.currentPeriod.isTrial ? 'choose-plan' : 'renew',
        priority: dashboardData.currentPeriod.isTrial ? 1 : 2
      })
    }

    if (dashboardData.paymentSummary && dashboardData.paymentSummary.overdueAmount > 0) {
      alerts.push({
        type: 'error' as const,
        title: 'Pagamento em atraso',
        message: `Você possui ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.paymentSummary.overdueAmount)} em atraso.`,
        action: 'pay',
        priority: 0
      })
    }

    if (dashboardData.currentPeriod && 
        !dashboardData.currentPeriod.wasConfirmed && 
        !dashboardData.currentPeriod.isTrial) {
      alerts.push({
        type: 'info' as const,
        title: 'Confirme seu pagamento',
        message: 'Seu período está pendente de confirmação de pagamento.',
        action: 'confirm',
        priority: 2
      })
    }

    if (dashboardData.paymentSummary && 
        dashboardData.paymentSummary.nextDueDate && 
        dashboardData.paymentSummary.nextPaymentAmount > 0) {
      const daysUntilPayment = calculateDaysRemaining(dashboardData.paymentSummary.nextDueDate)
      if (daysUntilPayment <= 3 && daysUntilPayment > 0) {
        alerts.push({
          type: 'warning' as const,
          title: 'Próximo pagamento',
          message: `Pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.paymentSummary.nextPaymentAmount)} vence em ${daysUntilPayment} ${daysUntilPayment === 1 ? 'dia' : 'dias'}.`,
          action: 'view-payment',
          priority: 2
        })
      }
    }

    return alerts.sort((a, b) => a.priority - b.priority)
  } catch (error: any) {
    console.error('Erro ao buscar alertas:', error)
    return []
  }
}

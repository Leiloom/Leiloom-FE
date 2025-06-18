import { api } from './api'
import { Plan } from './planService'

export interface ClientDashboardData {
  currentPlan: Plan | null
  currentPeriod: {
    id: string
    startsAt: Date
    expiresAt: Date
    isTrial: boolean
    isCurrent: boolean
    wasConfirmed: boolean
    daysRemaining: number
  } | null
  planHistory: {
    planName: string
    startDate: Date
    endDate: Date
    status: 'active' | 'expired' | 'cancelled'
  }[]
}

/**
 * Busca dados do dashboard do cliente logado
 */
export async function getClientDashboardData(): Promise<ClientDashboardData> {
  try {
    // Aqui você pode fazer chamadas específicas ou criar um endpoint consolidado
    const [clientPlansResponse, plansResponse] = await Promise.all([
      api.get('/client-plans'), // Busca associações do cliente
      api.get('/plans?isActive=true') // Busca planos disponíveis
    ])

    const clientPlans = clientPlansResponse.data
    const availablePlans = plansResponse.data

    // Encontra o plano atual do cliente
    const currentClientPlan = clientPlans.find((cp: any) => cp.current === true)
    
    if (!currentClientPlan) {
      return {
        currentPlan: null,
        currentPeriod: null,
        planHistory: []
      }
    }

    // Busca o plano completo
    const currentPlan = availablePlans.find((plan: Plan) => plan.id === currentClientPlan.planId)

    // Busca períodos do plano atual
    const periodsResponse = await api.get('/client-period-plans')
    const allPeriods = periodsResponse.data
    console.log('All periods:', allPeriods)
    console.log('Current client plan:', currentClientPlan)
    // Encontra o período atual
    const currentPeriod = allPeriods.find((period: any) => 
      period.clientPlanId === currentClientPlan.id && period.isCurrent === true
    )

    let periodData = null
    if (currentPeriod) {
      const expiresAt = new Date(currentPeriod.expiresAt)
      const today = new Date()
      const daysRemaining = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      periodData = {
        id: currentPeriod.id,
        startsAt: new Date(currentPeriod.startsAt),
        expiresAt: expiresAt,
        isTrial: currentPeriod.isTrial,
        isCurrent: currentPeriod.isCurrent,
        wasConfirmed: currentPeriod.wasConfirmed,
        daysRemaining: Math.max(0, daysRemaining)
      }
    }

    // Monta histórico (simplified - você pode expandir isso)
    const planHistory = clientPlans.map((cp: any) => {
      const plan = availablePlans.find((p: Plan) => p.id === cp.planId)
      const periods = allPeriods.filter((period: any) => period.clientPlanId === cp.id)
      const latestPeriod = periods.sort((a: any, b: any) => 
        new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
      )[0]

      return {
        planName: plan?.name || 'Plano Desconhecido',
        startDate: new Date(cp.createdOn),
        endDate: latestPeriod ? new Date(latestPeriod.expiresAt) : new Date(),
        status: cp.current ? 'active' : 'expired'
      }
    })

    return {
      currentPlan,
      currentPeriod: periodData,
      planHistory
    }

  } catch (error: any) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return Promise.reject({ message: 'Erro ao carregar dados do dashboard.' })
  }
}

/**
 * Busca dados específicos do cliente atual
 */
export async function getCurrentClientPlan(): Promise<{plan: Plan, period: any} | null> {
  try {
    const response = await api.get('/client-plans')
    const clientPlans = response.data
    
    const currentClientPlan = clientPlans.find((cp: any) => cp.current === true)
    if (!currentClientPlan) return null

    // Busca detalhes completos do plano e período
    const [planResponse, periodsResponse] = await Promise.all([
      api.get(`/plans/${currentClientPlan.planId}`),
      api.get('/client-period-plans')
    ])

    const plan = planResponse.data
    const allPeriods = periodsResponse.data
    const currentPeriod = allPeriods.find((period: any) => 
      period.clientPlanId === currentClientPlan.id && period.isCurrent === true
    )

    return {
      plan,
      period: currentPeriod
    }
  } catch (error: any) {
    console.error('Erro ao buscar plano atual:', error)
    return null
  }
}
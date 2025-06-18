import { api } from './api'

export interface ClientPeriodPlan {
  id?: string
  clientPlanId: string
  startsAt: Date
  expiresAt: Date
  isTrial?: boolean
  isCurrent?: boolean
  wasConfirmed?: boolean
  createdOn?: string
}

export interface CreateClientPeriodPlanDto {
  clientPlanId: string
  startsAt: Date
  expiresAt: Date
  isTrial?: boolean
  isCurrent?: boolean
  wasConfirmed?: boolean
}

export interface UpdateClientPeriodPlanDto {
  startsAt?: Date
  expiresAt?: Date
  isTrial?: boolean
  isCurrent?: boolean
  wasConfirmed?: boolean
}

/**
 * Cria um período para uma associação cliente-plano
 */
export async function createClientPeriodPlan(data: CreateClientPeriodPlanDto): Promise<ClientPeriodPlan> {
  try {
    const response = await api.post('/client-period-plans', data)
    return response.data
  } catch (error: any) {
    console.error('Erro ao criar período do plano:', error)
    return Promise.reject({ message: 'Erro ao criar período do plano.' })
  }
}

/**
 * Lista todos os períodos de planos
 */
export async function getAllClientPeriodPlans(): Promise<ClientPeriodPlan[]> {
  try {
    const response = await api.get('/client-period-plans')
    return response?.data
  } catch (error: any) {
    console.error('Erro ao buscar períodos de planos:', error)
    return Promise.reject({ message: 'Erro ao listar períodos de planos.' })
  }
}

/**
 * Busca um período de plano por ID
 */
export async function getClientPeriodPlanById(id: string): Promise<ClientPeriodPlan> {
  try {
    const response = await api.get(`/client-period-plans/${id}`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao buscar período do plano:', error)
    return Promise.reject({ message: 'Erro ao buscar período do plano por ID.' })
  }
}

/**
 * Atualiza um período de plano
 */
export async function updateClientPeriodPlan(id: string, data: UpdateClientPeriodPlanDto): Promise<ClientPeriodPlan> {
  try {
    const response = await api.patch(`/client-period-plans/${id}`, data)
    return response.data
  } catch (error: any) {
    console.error('Erro ao atualizar período do plano:', error)
    return Promise.reject({ message: 'Erro ao atualizar período do plano.' })
  }
}

/**
 * Remove um período de plano
 */
export async function deleteClientPeriodPlan(id: string) {
  try {
    const response = await api.delete(`/client-period-plans/${id}`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao remover período do plano:', error)
    return Promise.reject({ message: 'Erro ao remover período do plano.' })
  }
}

/**
 * Helper para calcular data de expiração baseada na duração do plano
 */
export function calculateExpirationDate(startDate: Date, durationDays: number): Date {
  const expirationDate = new Date(startDate)
  expirationDate.setDate(expirationDate.getDate() + durationDays)
  return expirationDate
}
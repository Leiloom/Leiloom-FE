import { api } from './api'

export interface Plan {
  id?: string
  name: string
  description?: string
  price: number
  numberOfUsers: number
  durationDays: number
  isActive: boolean
  isTrial: boolean
}

/**
 * Cria um novo plano
 */
export async function createPlan(data: Plan) {
  try {
    const response = await api.post('/plans', data)
    return response.data
  } catch (error: any) {
    console.error('Erro ao criar plano:', error)
    return Promise.reject({ message: 'Erro ao criar plano.' })
  }
}

/**
 * Lista todos os planos
 */
export async function getAllPlans(): Promise<Plan[]> {
  try {
    const response = await api.get('/plans')
    return response?.data
  } catch (error: any) {
    console.error('Erro ao buscar planos:', error)
    return Promise.reject({ message: 'Erro ao listar os planos.' })
  }
}

/**
 * Lista apenas os planos ativos (para exibição no registro de clientes)
 */
export async function getActivePlans(): Promise<Plan[]> {
  try {
    const response = await api.get('/plans?isActive=true')
    return response?.data
  } catch (error: any) {
    console.error('Erro ao buscar planos ativos:', error)
    return Promise.reject({ message: 'Erro ao listar os planos ativos.' })
  }
}
/**
 * Busca um plano por ID
 */
export async function getPlanById(id: string): Promise<Plan> {
  try {
    const response = await api.get(`/plans/${id}`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao buscar plano:', error)
    return Promise.reject({ message: 'Erro ao buscar plano por ID.' })
  }
}

/**
 * Atualiza um plano existente
 */
export async function updatePlan(id: string, data: Partial<Plan>) {
  try {
    const response = await api.patch(`/plans/${id}`, data)
    return response.data
  } catch (error: any) {
    console.error('Erro ao atualizar plano:', error)
    return Promise.reject({ message: 'Erro ao atualizar plano.' })
  }
}

/**
 * Remove um plano
 */
export async function deletePlan(id: string) {
  try {
    const response = await api.delete(`/plans/${id}`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao remover plano:', error)
    return Promise.reject({ message: 'Erro ao remover plano.' })
  }
}

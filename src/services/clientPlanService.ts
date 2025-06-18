import { api } from './api'

export interface ClientPlan {
  id?: string
  clientId: string
  planId: string
  current?: boolean
  createdOn?: string
}

export interface CreateClientPlanDto {
  clientId: string
  planId: string
}

export interface UpdateClientPlanDto {
  current?: boolean
}

/**
 * Cria uma associação Cliente ↔ Plano
 */
export async function createClientPlan(data: CreateClientPlanDto): Promise<ClientPlan> {
  try {
    const response = await api.post('/client-plans', data)
    return response.data
  } catch (error: any) {
    console.error('Erro ao criar associação cliente-plano:', error)
    return Promise.reject({ message: 'Erro ao associar cliente ao plano.' })
  }
}

/**
 * Lista todas as associações cliente-plano
 */
export async function getAllClientPlans(): Promise<ClientPlan[]> {
  try {
    const response = await api.get('/client-plans')
    return response?.data
  } catch (error: any) {
    console.error('Erro ao buscar associações cliente-plano:', error)
    return Promise.reject({ message: 'Erro ao listar associações cliente-plano.' })
  }
}

/**
 * Busca uma associação cliente-plano por ID
 */
export async function getClientPlanById(id: string): Promise<ClientPlan> {
  try {
    const response = await api.get(`/client-plans/${id}`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao buscar associação cliente-plano:', error)
    return Promise.reject({ message: 'Erro ao buscar associação cliente-plano por ID.' })
  }
}

/**
 * Atualiza uma associação cliente-plano
 */
export async function updateClientPlan(id: string, data: UpdateClientPlanDto): Promise<ClientPlan> {
  try {
    const response = await api.patch(`/client-plans/${id}`, data)
    return response.data
  } catch (error: any) {
    console.error('Erro ao atualizar associação cliente-plano:', error)
    return Promise.reject({ message: 'Erro ao atualizar associação cliente-plano.' })
  }
}

/**
 * Remove uma associação cliente-plano
 */
export async function deleteClientPlan(id: string) {
  try {
    const response = await api.delete(`/client-plans/${id}`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao remover associação cliente-plano:', error)
    return Promise.reject({ message: 'Erro ao remover associação cliente-plano.' })
  }
}
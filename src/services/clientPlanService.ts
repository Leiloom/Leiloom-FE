import { api } from './api'

export interface ClientPlan {
  id?: string
  clientId: string
  planId: string
  current?: boolean
  createdOn?: string
  // Relacionamentos que podem vir do backend
  plan?: {
    id: string
    name: string
    price: number
    durationDays: number
    numberOfUsers: number
    isTrial: boolean
    allowInstallments: boolean
    maxInstallments: number
    absorbTax: boolean
  }
  periods?: {
    id: string
    startsAt: Date
    expiresAt: Date
    isTrial: boolean
    isCurrent: boolean
  }[]
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
 * Lista planos do usuário logado (front-office)
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
 * Lista TODOS os planos (admin back-office)
 */
export async function getAllClientPlansAdmin(): Promise<ClientPlan[]> {
  try {
    const response = await api.get('/client-plans/all')
    return response?.data
  } catch (error: any) {
    console.error('Erro ao buscar todas as associações cliente-plano:', error)
    return Promise.reject({ message: 'Erro ao listar todas as associações cliente-plano.' })
  }
}

/**
 * Busca plano atual do cliente logado
 */
export async function getCurrentClientPlan(): Promise<ClientPlan | null> {
  try {
    const response = await api.get('/client-plans/current')
    return response.data
  } catch (error: any) {
    console.error('Erro ao buscar plano atual:', error)
    return null
  }
}

/**
 * Busca histórico de planos do cliente logado
 */
export async function getClientPlanHistory(): Promise<ClientPlan[]> {
  try {
    const response = await api.get('/client-plans/history')
    return response?.data || []
  } catch (error: any) {
    console.error('Erro ao buscar histórico de planos:', error)
    return []
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
 * Ativa um plano manualmente (admin) - CORRIGIDO
 */
export async function activateClientPlan(
  id: string,
  body: { startsAt: string; expiresAt: string }
): Promise<ClientPlan> {
  try {
    const response = await api.patch(`/client-plans/${id}/activate`, body)
    return response.data
  } catch (error: any) {
    console.error('Erro ao ativar plano:', error)
    return Promise.reject({ message: 'Erro ao ativar plano.' })
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

/**
 * ✅ CORRIGIDO: Usar endpoint correto do backend
 */
export async function getClientPlansByClientId(clientId: string): Promise<ClientPlan[]> {
  try {
    const response = await api.get(`/client-plans/client/${clientId}`)
    return response?.data || []
  } catch (error: any) {
    console.error('Erro ao buscar planos por cliente:', error)
    return []
  }
}

/**
 * Lista apenas planos pagos e vigentes, aptos a reativação
 */
export async function getReactivatableClientPlans(clientId: string): Promise<ClientPlan[]> {
  try {
    const response = await api.get(`/client-plans/client/${clientId}/reactivatable`);
    return response?.data || [];
  } catch (error: any) {
    console.error('Erro ao buscar planos reativáveis:', error);
    return [];
  }
}

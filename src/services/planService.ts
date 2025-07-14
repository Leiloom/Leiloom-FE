import { api } from './api'
import { Plan } from '@/types/plan'

export async function createPlan(data: Omit<Plan, 'id'>) {
  try {
    const response = await api.post('/plans', data)
    return response.data
  } catch (error: any) {
    console.error('Erro ao criar plano:', error)
    return Promise.reject({ message: 'Erro ao criar plano.' })
  }
}

export async function getAllPlans(): Promise<Plan[]> {
  try {
    const response = await api.get('/plans')
    return response?.data
  } catch (error: any) {
    console.error('Erro ao buscar planos:', error)
    return Promise.reject({ message: 'Erro ao listar os planos.' })
  }
}

export async function getActivePlans(): Promise<Plan[]> {
  try {
    const response = await api.get('/plans/active')
    return response?.data
  } catch (error: any) {
    console.error('Erro ao buscar planos ativos:', error)
    return Promise.reject({ message: 'Erro ao listar os planos ativos.' })
  }
}

export async function getPlanById(id: string): Promise<Plan> {
  try {
    const response = await api.get(`/plans/${id}`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao buscar plano:', error)
    return Promise.reject({ message: 'Erro ao buscar plano por ID.' })
  }
}

export async function updatePlan(id: string, data: Partial<Plan>) {
  try {
    const response = await api.patch(`/plans/${id}`, data)
    return response.data
  } catch (error: any) {
    console.error('Erro ao atualizar plano:', error)
    return Promise.reject({ message: 'Erro ao atualizar plano.' })
  }
}

export async function deletePlan(id: string) {
  try {
    const response = await api.delete(`/plans/${id}`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao remover plano:', error)
    return Promise.reject({ message: 'Erro ao remover plano.' })
  }
}

export async function activatePlan(id: string) {
  try {
    const response = await api.patch(`/plans/${id}/activate`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao ativar plano:', error)
    return Promise.reject({ message: 'Erro ao ativar plano.' })
  }
}

export async function deactivatePlan(id: string) {
  try {
    const response = await api.patch(`/plans/${id}/deactivate`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao desativar plano:', error)
    return Promise.reject({ message: 'Erro ao desativar plano.' })
  }
}

export async function getPlanStats() {
  try {
    const response = await api.get('/plans/stats')
    return response.data
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error)
    return Promise.reject({ message: 'Erro ao buscar estatísticas dos planos.' })
  }
}
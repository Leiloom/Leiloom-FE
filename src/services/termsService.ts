import { api } from './api'
import { AxiosError } from 'axios'

/**
 * Registra o aceite de termos de um usuário
 * @param payload Objeto contendo clientUserId e termsId
 * @param payload.clientUserId ID do usuário que aceitou os termos
 * @param payload.termsId ID do termo que foi aceito
 * @returns Dados do registro de aceite
 * @throws Erro em caso de falha na requisição
 */
export async function acceptTerms(payload: { clientUserId: string; termsId: string }) {
  try {
    const response = await api.post('/terms/accept', payload)
    return response.data
  } catch (error) {
    console.error('Erro ao aceitar os termos:', error)
    throw error 
  }
}

/**
 * Busca o termo de uso atual/vigente
 * @returns Objeto contendo id e URL do arquivo do termo atual, ou null se não encontrado
 */
export async function getCurrentTerms(): Promise<{ id: string, fileUrl: string } | null> {
  try {
    const response = await api.get('/terms/current')
    return response.data
  } catch (err) {
    const error = err as AxiosError

    if (error.response?.status === 404) {
      console.warn('Termo de uso atual não encontrado (404).')
      return null
    }

    console.error('Erro inesperado ao buscar termo de uso atual:', error)
    return null
  }
}

/**
 * Recupera a lista de todos os termos de uso
 * @returns Lista de termos de uso
 * @throws Erro em caso de falha na requisição
 */
export async function getTerms() {
  try {
    const response = await api.get('/terms/all')
    return response.data
  } catch (error) {
    console.error('Erro ao buscar lista de termos:', error)
    throw error 
  }
}

/**
 * Faz upload de um novo termo de uso
 * @param data Dados do novo termo a ser criado
 * @returns Dados do termo criado
 * @throws Erro em caso de falha na requisição
 */
export async function uploadTerm(data: any) {
  try {
    const response = await api.post('/terms/upload', data)
    return response.data
  } catch (error) {
    console.error('Erro ao fazer upload do termo:', error)
    throw error 
  }
}

/**
 * Atualiza um termo de uso existente
 * @param id ID do termo a ser atualizado
 * @param data Novos dados do termo
 * @returns Dados do termo atualizado
 * @throws Erro em caso de falha na requisição
 */
export async function updateTerm(id: string, data: any) {
  try {
    const response = await api.put(`/terms/${id}`, data)
    return response.data
  } catch (error) {
    console.error(`Erro ao atualizar o termo de ID ${id}:`, error)
    throw error 
  }
}
import { api } from '@/services/api'
import { AxiosError } from 'axios'
import ClientUser from '@/services/Interfaces' 

/**
 * Lista usuários de um cliente
 */
export async function getClientUsers(clientId: string): Promise<ClientUser[]> {
  try {
    const response = await api.get(`/client-users?clientId=${clientId}`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error)
    throw error
  }
}

/**
 * Cria usuário via ADM
 */
export async function createClientUserAdm(payload: Omit<ClientUser, 'id'>) {
  try {
    const response = await api.post('/client-users/adm', payload)
    return response.data
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error)
    throw error
  }
}

/**
 * Atualiza usuário
 */
export async function updateClientUser(id: string, payload: Partial<ClientUser> & { password?: string }) {
  try {
    const response = await api.patch(`/client-users/${id}`, payload)
    return response.data
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error)
    throw error
  }
}
/**
 * Busca um clientUser por ID
 */
export async function getClientUserById(id: string): Promise<ClientUser> {
  try {
    const response = await api.get(`/client-users/${id}`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao buscar client user:', error)
    return Promise.reject({ message: 'Erro ao buscar client user por ID.' })
  }
}

/**
 * Lista todos os clientUsers
 */
export async function getAllClientUsers(): Promise<ClientUser[]> {
  try {
    const response = await api.get('/client-users')
    return response.data
  } catch (error: any) {
    console.error('Erro ao buscar client users:', error)
    return Promise.reject({ message: 'Erro ao listar client users.' })
  }
}
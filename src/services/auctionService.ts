import { api } from './api'
import { AxiosError } from 'axios'

/**
 * Cria um novo leilão
 * @param data Dados do leilão (name, type, location, url, openingDate, closingDate, createdBy)
 * @returns Dados do leilão criado
 * @throws Erro em caso de falha na requisição
 */
export async function createAuction(data: any) {
  try {
    const response = await api.post('/auctions', data)
    return response.data
  } catch (error) {
    console.error('Erro ao criar leilão:', error)
    throw error
  }
}

/**
 * Lista todos os leilões
 * @returns Lista de leilões com seus lotes e itens
 */
export async function getAuctions() {
  try {
    const response = await api.get('/auctions')
    return response.data
  } catch (error) {
    console.error('Erro ao buscar leilões:', error)
    throw error
  }
}

/**
 * Busca um leilão pelo ID
 * @param id ID do leilão
 * @returns Dados do leilão com lotes e itens
 */
export async function getAuctionById(id: string) {
  try {
    console.log('ID do leilão:', id) // Log do ID recebido
    const response = await api.get(`/auctions/${id}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao buscar leilão ID ${id}:`, error)
    throw error
  }
}

/**
 * Atualiza um leilão
 * @param id ID do leilão
 * @param data Novos dados
 */
export async function updateAuction(id: string, data: any) {
  try {
    const response = await api.patch(`/auctions/${id}`, data)
    return response.data
  } catch (error) {
    console.error(`Erro ao atualizar leilão ID ${id}:`, error)
    throw error
  }
}

/**
 * Remove (inativa) um leilão
 * @param id ID do leilão
 */
export async function deleteAuction(id: string) {
  try {
    const response = await api.delete(`/auctions/${id}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao excluir leilão ID ${id}:`, error)
    throw error
  }
}
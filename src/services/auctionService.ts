import { api } from './api'
import { AxiosError } from 'axios'
import { Auction, CreateAuctionData, UpdateAuctionData } from '@/types/auction'

/**
 * Cria um novo leilão
 * @param data Dados do leilão (name, type, url, openingDate, closingDate, createdBy)
 * @returns Dados do leilão criado
 */
export async function createAuction(data: CreateAuctionData) {
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
    return response.data as Auction[]
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
    console.log('ID do leilão:', id)
    const response = await api.get(`/auctions/${id}`)
    return response.data as Auction
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
export async function updateAuction(id: string, data: UpdateAuctionData) {
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

/**
 * Obtém todos os itens de leilão
 * @returns Lista de itens de leilão
 */

export async function getAuctionItems() {
  const response = await api.get('/auctions/items/all')
  return response.data
}


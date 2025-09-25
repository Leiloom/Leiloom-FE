import { api } from './api'
import { AxiosError } from 'axios'

/**
 * Cria um novo lote
 * @param data Dados do lote (auctionId, identification)
 * @returns Dados do lote criado
 */
export async function createLot(data: { auctionId: string; identification: string }) {
  try {
    const response = await api.post('/lots', data)
    return response.data
  } catch (error) {
    console.error('Erro ao criar lote:', error)
    throw error
  }
}

/**
 * Lista todos os lotes ou filtra por leilão
 * @param auctionId ID do leilão (opcional)
 * @returns Lista de lotes
 */
export async function getLots(auctionId?: string) {
  try {
    const url = auctionId ? `/lots?auctionId=${auctionId}` : '/lots'
    const response = await api.get(url)
    return response.data
  } catch (error) {
    console.error('Erro ao buscar lotes:', error)
    throw error
  }
}

/**
 * Busca lotes de um leilão específico
 * @param auctionId ID do leilão
 * @returns Lista de lotes do leilão
 */
export async function getLotsByAuction(auctionId: string) {
  try {
    const response = await api.get(`/lots?auctionId=${auctionId}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao buscar lotes do leilão ID ${auctionId}:`, error)
    throw error
  }
}

/**
 * Busca um lote pelo ID
 * @param id ID do lote
 * @returns Dados do lote com seus itens
 */
export async function getLotById(id: string) {
  try {
    const response = await api.get(`/lots/${id}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao buscar lote ID ${id}:`, error)
    throw error
  }
}

/**
 * Atualiza um lote
 * @param id ID do lote
 * @param data Novos dados (auctionId?, identification?)
 */
export async function updateLot(id: string, data: Partial<{ auctionId: string; identification: string }>) {
  try {
    const response = await api.patch(`/lots/${id}`, data)
    return response.data
  } catch (error) {
    console.error(`Erro ao atualizar lote ID ${id}:`, error)
    throw error
  }
}

/**
 * Remove um lote (apenas se não houver itens vinculados)
 * @param id ID do lote
 */
export async function deleteLot(id: string) {
  try {
    const response = await api.delete(`/lots/${id}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao excluir lote ID ${id}:`, error)
    throw error
  }
}
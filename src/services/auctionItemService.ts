import { api } from './api'
import { AxiosError } from 'axios'

/**
 * Cria um novo item de leilão (vinculado a um lote)
 * Pode incluir detalhes de imóvel (propertyDetails)
 * @param data Dados do item (deve incluir lotId)
 */
export async function createAuctionItem(data: any) {
  try {
    const response = await api.post('/auction-items', data)
    return response.data
  } catch (error) {
    console.error('Erro ao criar item de leilão:', error)
    throw error
  }
}

/**
 * Lista todos os itens de leilão ou filtra por lote/leilão
 * @param lotId ID do lote (opcional)
 * @param auctionId ID do leilão (opcional)
 * @returns Lista de itens
 */
export async function getAuctionItems(lotId?: string, auctionId?: string) {
  try {
    let url = '/auction-items'
    const params = new URLSearchParams()
    
    if (lotId) params.append('lotId', lotId)
    if (auctionId) params.append('auctionId', auctionId)
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    
    const response = await api.get(url)
    return response.data
  } catch (error) {
    console.error('Erro ao buscar itens de leilão:', error)
    throw error
  }
}

/**
 * Busca itens de um lote específico
 * @param lotId ID do lote
 * @returns Lista de itens do lote
 */
export async function getAuctionItemsByLot(lotId: string) {
  try {
    const response = await api.get(`/auction-items?lotId=${lotId}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao buscar itens do lote ID ${lotId}:`, error)
    throw error
  }
}

/**
 * Busca itens de um leilão específico
 * @param auctionId ID do leilão
 * @returns Lista de itens do leilão
 */
export async function getAuctionItemsByAuction(auctionId: string) {
  try {
    const response = await api.get(`/auction-items?auctionId=${auctionId}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao buscar itens do leilão ID ${auctionId}:`, error)
    throw error
  }
}

/**
 * Busca um item pelo ID
 * @param id ID do item
 */
export async function getAuctionItemById(id: string) {
  try {
    const response = await api.get(`/auction-items/${id}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao buscar item de leilão ID ${id}:`, error)
    throw error
  }
}

/**
 * Atualiza um item de leilão
 * @param id ID do item
 * @param data Novos dados (incluindo propertyDetails se for imóvel e lotId se mudar de lote)
 */
export async function updateAuctionItem(id: string, data: any) {
  try {
    const response = await api.patch(`/auction-items/${id}`, data)
    return response.data
  } catch (error) {
    console.error(`Erro ao atualizar item de leilão ID ${id}:`, error)
    throw error
  }
}

/**
 * Remove (cancela) um item de leilão
 * @param id ID do item
 */
export async function deleteAuctionItem(id: string) {
  try {
    const response = await api.delete(`/auction-items/${id}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao excluir item de leilão ID ${id}:`, error)
    throw error
  }
}
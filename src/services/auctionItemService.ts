import { api } from './api'
import { AxiosError } from 'axios'
import {
  AuctionItem,
  CreateAuctionItemData,
  UpdateAuctionItemData,
} from '@/types/auction'

/**
 * Cria um novo item de leilão (vinculado a um lote)
 * Pode incluir detalhes de imóvel (propertyDetails)
 * @param data Dados do item (deve incluir lotId e auctionId)
 */
export async function createAuctionItem(data: CreateAuctionItemData): Promise<AuctionItem> {
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
export async function getAuctionItems(lotId?: string, auctionId?: string): Promise<AuctionItem[]> {
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
export async function getAuctionItemsByLot(lotId: string): Promise<AuctionItem[]> {
  try {
    const response = await api.get(`/auction-items/by-lot/${lotId}`)
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
export async function getAuctionItemsByAuction(auctionId: string): Promise<AuctionItem[]> {
  try {
    const response = await api.get(`/auction-items/by-auction/${auctionId}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao buscar itens do leilão ID ${auctionId}:`, error)
    throw error
  }
}

/**
 * Busca um item pelo ID
 * @param id ID do item
 * @returns Dados completos do item (com propertyDetails, lot e auction)
 */
export async function getAuctionItemById(id: string): Promise<AuctionItem> {
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
export async function updateAuctionItem(
  id: string,
  data: UpdateAuctionItemData
): Promise<AuctionItem> {
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
export async function deleteAuctionItem(id: string): Promise<AuctionItem> {
  try {
    const response = await api.delete(`/auction-items/${id}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao excluir item de leilão ID ${id}:`, error)
    throw error
  }
}

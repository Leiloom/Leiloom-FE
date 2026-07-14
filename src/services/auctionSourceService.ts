import { api } from './api'
import { AuctionSource } from '@/types/auction'

export async function createAuctionSource(data: Omit<AuctionSource, 'id'>) {
  try {
    const response = await api.post('/auction-sources', data)
    return response.data
  } catch (error) {
    console.error('Erro ao criar fonte de leilão:', error)
    throw error
  }
}

export async function getAuctionSources(): Promise<AuctionSource[]> {
  try {
    const response = await api.get('/auction-sources')
    return response.data
  } catch (error) {
    console.error('Erro ao buscar fontes de leilão:', error)
    throw error
  }
}

export async function getAuctionSourceById(id: string): Promise<AuctionSource> {
  try {
    const response = await api.get(`/auction-sources/${id}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao buscar fonte de leilão ID ${id}:`, error)
    throw error
  }
}

export async function updateAuctionSource(id: string, data: Partial<AuctionSource>) {
  try {
    const response = await api.patch(`/auction-sources/${id}`, data)
    return response.data
  } catch (error) {
    console.error(`Erro ao atualizar fonte de leilão ID ${id}:`, error)
    throw error
  }
}

export async function deleteAuctionSource(id: string) {
  try {
    const response = await api.delete(`/auction-sources/${id}`)
    return response.data
  } catch (error) {
    console.error(`Erro ao excluir fonte de leilão ID ${id}:`, error)
    throw error
  }
}

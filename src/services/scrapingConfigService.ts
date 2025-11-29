import { api } from './api'
import { CreateScrapingConfigDto, ScrapingConfigResponse } from '@/types/scraping-config'

export async function saveScrapingConfig(
  data: CreateScrapingConfigDto
): Promise<ScrapingConfigResponse> {
  const response = await api.post('/scraping-configs', data)
  return response.data
}

export async function getScrapingConfigs(
  auctionId: string,
  itemId?: string
): Promise<ScrapingConfigResponse[]> {
  const params: any = { auctionId }
  if (itemId) params.itemId = itemId

  const response = await api.get('/scraping-configs', { params })
  return response.data
}

export async function getAllScrapingConfigs(
  auctionId: string
): Promise<ScrapingConfigResponse[]> {
  const response = await api.get('/scraping-configs/all', {
    params: { auctionId },
  })
  return response.data
}

export async function updateScrapingConfig(
  id: string,
  selector: string
): Promise<ScrapingConfigResponse> {
  const response = await api.put(`/scraping-configs/${id}`, { selector })
  return response.data
}

export async function deleteScrapingConfig(id: string): Promise<void> {
  await api.delete(`/scraping-configs/${id}`)
}

export async function deleteScrapingConfigsByItem(itemId: string): Promise<void> {
  await api.delete(`/scraping-configs/by-item/${itemId}`)
}

export async function deleteScrapingConfigsByAuction(auctionId: string): Promise<void> {
  await api.delete(`/scraping-configs/by-auction/${auctionId}`)
}
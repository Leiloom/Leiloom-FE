// src/lib/maps/mapHelpers.ts

import { AuctionItem } from '@/types/auction'
import { geocodeAddress } from './geocodeUtils'

export async function enrichItemsWithCoords(items: AuctionItem[]) {
  return Promise.all(
    items.map(async (item) => {
      if (item.lat && item.lng) return { ...item, coords: { lat: item.lat, lng: item.lng } }

      const addressParts = [
        item.location || '',
        item.city || '',
        item.state || '',
        'Brasil'
      ].filter(Boolean)

      const fullAddress = addressParts.join(', ')
      const coords = await geocodeAddress(fullAddress)
      return coords ? { ...item, coords } : null
    })
  ).then((r) => r.filter(Boolean))
}

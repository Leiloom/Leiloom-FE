// src/lib/maps/geocodeUtils.ts

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&limit=1'

export async function geocodeAddress(rawAddress: string): Promise<{ lat: number; lng: number } | null> {
  if (!rawAddress) return null

  const normalized = rawAddress
    .replace(/\s+/g, ' ')
    .replace(/[,;]+/g, ',')
    .replace(/-+/g, ' ')
    .replace(/ nº/g, '')
    .trim()

  // 🔹 cache local para evitar reconsultar o mesmo endereço
  const cacheKey = `geo_${normalized.toLowerCase()}`
  const cached = sessionStorage.getItem(cacheKey)
  if (cached) return JSON.parse(cached)

  const tries = [
    normalized,
    normalized.replace(/\d{1,4}/g, ''), // remove números
    normalized.split(',')[0]
  ]

  for (const query of tries) {
    try {
      const response = await fetch(`${NOMINATIM_URL}&q=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': 'Leiloom-App' }
      })
      const data = await response.json()
      if (data && data.length > 0) {
        const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
        sessionStorage.setItem(cacheKey, JSON.stringify(result))
        return result
      }
    } catch (err) {
      console.error('Erro ao geocodificar', query, err)
    }
  }

  return null
}

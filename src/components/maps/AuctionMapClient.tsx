'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Auction, AuctionItem } from '@/types/auction'
import { useRouter } from 'next/navigation'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface AuctionMapProps {
  auctions: Auction[]
}

type ItemWithCoords = AuctionItem & {
  coords?: { lat: number; lng: number } | null
  auctionName?: string
}

// ⚙️ Hook auxiliar para ajustar o zoom dinamicamente
function FitToBounds({ items }: { items: ItemWithCoords[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || items.length === 0) return

    const validCoords = items
      .map((item) => item.coords)
      .filter((c) => c && c.lat && c.lng)

    if (validCoords.length === 0) return

    const group = L.featureGroup(
      validCoords.map((c) => L.marker([c!.lat, c!.lng]))
    )

    if (group.getLayers().length > 0) {
      map.fitBounds(group.getBounds().pad(0.2))
    }
  }, [items, map])

  return null
}

export default function AuctionMapClient({ auctions }: AuctionMapProps) {
  const [geoItems, setGeoItems] = useState<ItemWithCoords[]>([])
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT || '-14.235004')
  const DEFAULT_LNG = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG || '-51.92528')
  const DEFAULT_ZOOM = parseInt(process.env.NEXT_PUBLIC_DEFAULT_ZOOM || '4', 10)

  // ⚙️ Garantir que estamos no cliente
  useEffect(() => {
    setIsClient(true)

    // Ajusta ícone padrão para evitar bug do marker
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowAnchor: [12, 41],
    })

    L.Marker.prototype.options.icon = DefaultIcon
  }, [])

  // 🔍 Função para obter coordenadas via Nominatim
  async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Leiloom-App',
          },
        }
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      }
      return null
    } catch (error) {
      console.error('Erro ao geocodificar:', error)
      return null
    }
  }

  useEffect(() => {
    async function processItems() {
      if (!auctions || auctions.length === 0) {
        setGeoItems([])
        setLoading(false)
        return
      }

      setLoading(true)

      // Extrair todos os itens de todos os leilões
      const allItems: ItemWithCoords[] = []
      
      auctions.forEach((auction) => {
        auction.lots?.forEach((lot) => {
          lot.items?.forEach((item) => {
            allItems.push({
              ...item,
              auctionName: auction.name
            })
          })
        })
      })

      // Geocodificar apenas itens que têm localização mas não têm coordenadas
      const results = await Promise.all(
        allItems.map(async (item) => {
          // Se já tem coordenadas lat/lng no banco, usa elas
          if (item.lat && item.lng) {
            return {
              ...item,
              coords: { lat: item.lat, lng: item.lng }
            }
          }

          // Senão, tenta geocodificar com cidade e estado
          if (item.city && item.state) {
            const address = `${item.city}, ${item.state}, Brasil`
            const coords = await geocode(address)
            return { ...item, coords }
          }

          return { ...item, coords: null }
        })
      )

      setGeoItems(results.filter(item => item.coords !== null))
      setLoading(false)
    }

    if (isClient) {
      processItems()
    }
  }, [auctions, isClient])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-lg text-gray-500">
        Inicializando mapa...
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-lg text-gray-500">
        Carregando localizações...
      </div>
    )
  }

  if (geoItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-lg text-gray-500">
        Nenhum item com localização encontrado
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg overflow-hidden shadow-sm">
      <MapContainer
        center={[DEFAULT_LAT, DEFAULT_LNG]}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contribuidores'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToBounds items={geoItems} />

        {geoItems.map((item) => (
          <Marker key={item.id} position={[item.coords!.lat, item.coords!.lng]}>
            <Popup>
              <div className="text-sm min-w-[200px]">
                <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                <p className="text-xs text-gray-500 mb-2">{item.auctionName}</p>
                <p className="text-gray-700 text-xs mb-2">
                  {item.location && `${item.location}, `}
                  {item.city}/{item.state}
                </p>
                <p className="text-sm font-semibold text-green-700 mb-2">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(item.basePrice)}
                </p>
                <button
                  onClick={() => router.push(`/auctions/${item.auctionId}`)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                  Ver leilão →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
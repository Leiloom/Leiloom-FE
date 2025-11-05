'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { AuctionItem } from '@/types/auction'
import { enrichItemsWithCoords } from '@/lib/maps/mapHelpers'
import { createCustomIcon } from '@/lib/maps/mapIcons'

interface ItemWithCoords extends AuctionItem {
  coords: { lat: number; lng: number }
}

interface AuctionDetailMapProps {
  items: AuctionItem[]
  selectedItem: AuctionItem | null
  onItemSelect: React.Dispatch<React.SetStateAction<AuctionItem | null>>
}

// Ajusta o foco dinamicamente
function MapController({ items, selectedItem }: { items: ItemWithCoords[]; selectedItem: AuctionItem | null }) {
  const map = useMap()

  useEffect(() => {
    if (items.length === 0) return

    if (selectedItem) {
      const selected = items.find((item) => item.id === selectedItem.id)
      if (selected) {
        map.setView([selected.coords.lat, selected.coords.lng], 15, { animate: true })
      }
    } else {
      const bounds = L.latLngBounds(items.map((item) => [item.coords.lat, item.coords.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [items, selectedItem, map])

  return null
}

export default function AuctionDetailMap({ items, selectedItem, onItemSelect }: AuctionDetailMapProps) {
  const [geoItems, setGeoItems] = useState<ItemWithCoords[]>([])
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT || '-14.235004')
  const DEFAULT_LNG = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG || '-51.92528')

  useEffect(() => {
    setIsClient(true)

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

  useEffect(() => {
    async function processItems() {
      if (!items || items.length === 0) {
        setGeoItems([])
        setLoading(false)
        return
      }

      setLoading(true)
      const enriched = await enrichItemsWithCoords(items)
      setGeoItems(enriched as ItemWithCoords[])
      setLoading(false)
    }

    if (isClient) processItems()
  }, [items, isClient])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

  if (!isClient)
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Inicializando mapa...</p>
      </div>
    )

  if (loading)
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando localizações...</p>
        </div>
      </div>
    )

  if (geoItems.length === 0)
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Nenhum item com localização válida</p>
      </div>
    )

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[DEFAULT_LAT, DEFAULT_LNG]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController items={geoItems} selectedItem={selectedItem} />

        {geoItems.map((item) => {
          const isSelected = selectedItem?.id === item.id
          return (
            <Marker
              key={item.id}
              position={[item.coords.lat, item.coords.lng]}
              icon={createCustomIcon(item.type, isSelected)}
              eventHandlers={{
                click: () => onItemSelect(item),
              }}
            >
              <Popup>
                <div className="text-sm min-w-[200px]">
                  <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                  {item.description && <p className="text-xs text-gray-600 mb-2">{item.description}</p>}
                  <p className="text-xs text-gray-500 mb-2">
                    {item.location && `${item.location}, `}
                    {item.city}/{item.state}
                  </p>
                  <p className="text-sm font-semibold text-blue-600 mb-2">{formatPrice(item.basePrice)}</p>

                  {item.type === 'IMOVEL' && item.propertyDetails && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {item.propertyDetails.bedrooms && <div>🛏️ {item.propertyDetails.bedrooms} quartos</div>}
                      {item.propertyDetails.parkingSpots && <div>🚗 {item.propertyDetails.parkingSpots} vagas</div>}
                      {item.propertyDetails.area && <div>📏 {item.propertyDetails.area}m²</div>}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

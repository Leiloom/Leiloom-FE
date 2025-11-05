'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useRouter } from 'next/navigation'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { Auction, AuctionItem } from '@/types/auction'
import { enrichItemsWithCoords } from '@/lib/maps/mapHelpers'
import { clusterIcon } from '@/lib/maps/mapIcons'

interface AuctionMapProps {
  auctions: Auction[]
}

type ItemWithCoords = AuctionItem & {
  coords?: { lat: number; lng: number } | null
  auctionName?: string
}

// Ajuste automático de bounds
function FitToBounds({ items }: { items: ItemWithCoords[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || items.length === 0) return

    const validCoords = items
      .map((item) => item.coords)
      .filter((c) => c && c.lat && c.lng)

    if (validCoords.length === 0) return

    const group = L.featureGroup(validCoords.map((c) => L.marker([c!.lat, c!.lng])))
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

  useEffect(() => {
    setIsClient(true)

    const DefaultIcon = L.icon({
      iconUrl: new URL('/leaflet/marker-icon.png', window.location.origin).href,
      shadowUrl: new URL('/leaflet/marker-shadow.png', window.location.origin).href,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowAnchor: [12, 41],
    })

    L.Marker.prototype.options.icon = DefaultIcon
  }, [])

  useEffect(() => {
    async function processItems() {
      if (!auctions || auctions.length === 0) {
        setGeoItems([])
        setLoading(false)
        return
      }

      setLoading(true)

      const allItems: ItemWithCoords[] = []
      auctions.forEach((auction) => {
        auction.lots?.forEach((lot) => {
          lot.items?.forEach((item) => {
            allItems.push({ ...item, auctionName: auction.name })
          })
        })
      })

      const enriched = await enrichItemsWithCoords(allItems)
      setGeoItems(enriched as ItemWithCoords[])
      setLoading(false)
    }

    if (isClient) processItems()
  }, [auctions, isClient])

  if (!isClient)
    return <div className="flex items-center justify-center h-[500px] bg-gray-100">Inicializando mapa...</div>

  if (loading)
    return <div className="flex items-center justify-center h-[500px] bg-gray-100">Carregando localizações...</div>

  if (geoItems.length === 0)
    return <div className="flex items-center justify-center h-[500px] bg-gray-100">Nenhum item com localização</div>

  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg overflow-hidden shadow-sm">
      <MapContainer
        center={[DEFAULT_LAT, DEFAULT_LNG]}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToBounds items={geoItems} />

        <MarkerClusterGroup
          chunkedLoading
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          maxClusterRadius={60}
          iconCreateFunction={(cluster: any) => {
            const markers = cluster.getAllChildMarkers()
            const values = markers
              .map((m: any) => m.options?.itemData?.basePrice ?? 0)
              .filter((v: number) => typeof v === 'number' && v > 0)

            const min = values.length > 0 ? Math.min(...values) : 0
            const max = values.length > 0 ? Math.max(...values) : 0
            const count = cluster.getChildCount()

            let size = 'small'
            if (count > 20) size = 'large'
            else if (count > 10) size = 'medium'

            const formatter = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            })

            const minStr = min > 0 ? formatter.format(min) : '-'
            const maxStr = max > 0 ? formatter.format(max) : '-'

            return L.divIcon({
              html: `
      <div class="cluster-marker ${size}">
        <div class="count">${count}</div>
        <div class="range">
          <div>De ${minStr}</div>
          <div>Até ${maxStr}</div>
        </div>
      </div>
    `,
              className: 'custom-cluster-icon',
              iconSize: L.point(55, 55, true),
            })
          }}


        >
          {geoItems.map((item) => (
            <Marker
              key={item.id}
              position={[item.coords!.lat, item.coords!.lng]}
              ref={(marker) => {
                if (marker) {
                  (marker as any).options.itemData = item

                  // ✅ Tooltip (hover) com o valor formatado
                  const price = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(item.basePrice)

                  marker.bindTooltip(
                    `<div class="item-tooltip">${price}</div>`,
                    { permanent: false, direction: 'bottom', opacity: 1, className: 'item-tooltip' }
                  )
                }
              }}
            >
              <Popup>
                <div className="text-sm min-w-[200px]">
                  <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500 mb-2">{item.auctionName}</p>
                  <p className="text-gray-700 text-xs mb-2">
                    {item.location && `${item.location}, `}
                    {item.city}/{item.state}
                  </p>
                  <p className="text-sm font-semibold text-green-700 mb-2">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.basePrice)}
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

        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}

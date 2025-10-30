'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AuctionItem } from '@/types/auction'

interface ItemWithCoords extends AuctionItem {
    coords: { lat: number; lng: number }
}

interface AuctionDetailMapProps {
  items: AuctionItem[]
  selectedItem: AuctionItem | null
  onItemSelect: React.Dispatch<React.SetStateAction<AuctionItem | null>>
}


// Hook para ajustar bounds e zoom
function MapController({ items, selectedItem }: { items: ItemWithCoords[]; selectedItem: AuctionItem | null }) {
    const map = useMap()

    useEffect(() => {
        if (items.length === 0) return

        if (selectedItem) {
            // Se tem item selecionado, centraliza nele
            const selected = items.find(item => item.id === selectedItem.id)
            if (selected) {
                map.setView([selected.coords.lat, selected.coords.lng], 15, { animate: true })
            }
        } else {
            // Senão, mostra todos os itens
            const bounds = L.latLngBounds(items.map(item => [item.coords.lat, item.coords.lng]))
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

        // Configurar ícones do Leaflet
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

    // Geocodificar endereços
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
            if (!items || items.length === 0) {
                setGeoItems([])
                setLoading(false)
                return
            }

            setLoading(true)

            const results = await Promise.all(
                items.map(async (item) => {
                    // Se já tem coordenadas, usa elas
                    if (item.lat && item.lng) {
                        return {
                            ...item,
                            coords: { lat: item.lat, lng: item.lng }
                        } as ItemWithCoords
                    }

                    // Senão, tenta geocodificar
                    if (item.city && item.state) {
                        const address = item.location 
                            ? `${item.location}, ${item.city}, ${item.state}, Brasil`
                            : `${item.city}, ${item.state}, Brasil`
                        
                        const coords = await geocode(address)
                        if (coords) {
                            return {
                                ...item,
                                coords
                            } as ItemWithCoords
                        }
                    }

                    return null
                })
            )

            setGeoItems(results.filter((item): item is ItemWithCoords => item !== null))
            setLoading(false)
        }

        if (isClient) {
            processItems()
        }
    }, [items, isClient])

    // Criar ícone customizado baseado no tipo e seleção
    const createCustomIcon = (type: string, isSelected: boolean) => {
        const colors: { [key: string]: string } = {
            IMOVEL: '#3b82f6',
            VEICULO: '#10b981',
            OUTROS: '#8b5cf6'
        }

        const color = colors[type] || colors.OUTROS
        const size = isSelected ? 35 : 25

        return L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background-color: ${color};
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: 3px solid white;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    ${isSelected ? 'animation: pulse 1.5s infinite;' : ''}
                ">
                    <div style="
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transform: rotate(45deg);
                        color: white;
                        font-size: ${size > 25 ? '16px' : '12px'};
                        font-weight: bold;
                    ">
                        ${type === 'IMOVEL' ? '🏠' : type === 'VEICULO' ? '🚗' : '📦'}
                    </div>
                </div>
                <style>
                    @keyframes pulse {
                        0%, 100% { transform: rotate(-45deg) scale(1); }
                        50% { transform: rotate(-45deg) scale(1.1); }
                    }
                </style>
            `,
            iconSize: [size, size],
            iconAnchor: [size / 2, size],
            popupAnchor: [0, -size]
        })
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    if (!isClient) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">Inicializando mapa...</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando localizações...</p>
                </div>
            </div>
        )
    }

    if (geoItems.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">Nenhum item com localização válida</p>
            </div>
        )
    }

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
                                click: () => onItemSelect(item)
                            }}
                        >
                            <Popup>
                                <div className="text-sm min-w-[200px]">
                                    <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                                    {item.description && (
                                        <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mb-2">
                                        {item.location && `${item.location}, `}
                                        {item.city}/{item.state}
                                    </p>
                                    <p className="text-sm font-semibold text-blue-600 mb-2">
                                        {formatPrice(item.basePrice)}
                                    </p>
                                    {item.type === 'IMOVEL' && item.propertyDetails && (
                                        <div className="text-xs text-gray-600 space-y-1">
                                            {item.propertyDetails.bedrooms && (
                                                <div>🛏️ {item.propertyDetails.bedrooms} quartos</div>
                                            )}
                                            {item.propertyDetails.parkingSpots && (
                                                <div>🚗 {item.propertyDetails.parkingSpots} vagas</div>
                                            )}
                                            {item.propertyDetails.area && (
                                                <div>📏 {item.propertyDetails.area}m²</div>
                                            )}
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
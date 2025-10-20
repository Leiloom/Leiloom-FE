'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Head from 'next/head'
import MainLayout from '@/layouts/MainLayout'
import { withClientAuth } from '@/hooks/withClientAuth'
import { TokenPayload } from '@/utils/jwtUtils'
import { getAuctionById } from '@/services/auctionService'
import { toast } from 'react-toastify'
import {
    MapPin,
    Calendar,
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    Building,
    Car,
    Package,
    AlertTriangle,
    Eye
} from 'lucide-react'

interface Props {
    user: TokenPayload
}

interface PropertyDetails {
    id: string
    type: string
    bedrooms?: number
    parkingSpots?: number
    area?: number
}

interface AuctionItem {
    id: string
    title: string
    description?: string
    type: 'IMOVEL' | 'VEICULO' | 'OUTROS'
    basePrice: number
    status: 'AVAILABLE' | 'SOLD' | 'CANCELLED'
    propertyDetails?: PropertyDetails
    address?: string
    hasValidAddress?: boolean
}

interface Lot {
    id: string
    identification: string
    items: AuctionItem[]
}

interface Auction {
    id: string
    name: string
    type: 'ONLINE' | 'LOCAL'
    location?: string
    url?: string
    openingDate: Date | string
    closingDate: Date | string
    isActive: boolean
    lots: Lot[]
}

function AuctionDetailPage({ user }: Props) {
    const router = useRouter()
    const params = useParams<{ auctionId: string }>()
    const auctionId = params?.auctionId as string
    
    const [auction, setAuction] = useState<Auction | null>(null)
    const [loading, setLoading] = useState(true)
    const [expandedLots, setExpandedLots] = useState<{ [key: string]: boolean }>({})
    const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null)
    const [mapLoaded, setMapLoaded] = useState(false)
    
    const mapRef = useRef<HTMLDivElement>(null)
    const googleMapRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])
    const infoWindowRef = useRef<any>(null)

    useEffect(() => {
        if (auctionId) {
            loadAuctionDetail()
        }
    }, [auctionId])

    useEffect(() => {
        loadGoogleMaps()
    }, [])

    useEffect(() => {
        if (mapLoaded && auction && mapRef.current && !googleMapRef.current) {
            initializeMap()
        }
    }, [mapLoaded, auction])

    useEffect(() => {
        if (googleMapRef.current && auction) {
            updateMarkers()
        }
    }, [auction, selectedItem])

    const loadGoogleMaps = () => {
        if (window.google && window.google.maps) {
            setMapLoaded(true)
            return
        }

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => setMapLoaded(true)
        script.onerror = () => {
            console.error('Erro ao carregar Google Maps')
            toast.error('Erro ao carregar mapa')
        }
        document.head.appendChild(script)
    }

    async function loadAuctionDetail() {
        try {
            setLoading(true)
            const auctionData = await getAuctionById(auctionId)
            
            if (auctionData) {
                const processedAuction = {
                    ...auctionData,
                    lots: auctionData.lots?.map((lot: any) => ({
                        ...lot,
                        items: lot.items?.map((item: any) => ({
                            ...item,
                            address: generateMockAddress(item),
                            hasValidAddress: shouldHaveAddress(item)
                        })) || []
                    })) || []
                }
                
                setAuction(processedAuction)
                
                const expanded: { [key: string]: boolean } = {}
                processedAuction.lots.forEach((lot: any) => {
                    expanded[lot.id] = true
                })
                setExpandedLots(expanded)
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do leilão:', error)
            toast.error('Erro ao carregar detalhes do leilão')
        } finally {
            setLoading(false)
        }
    }

    const generateMockAddress = (item: AuctionItem) => {
        if (item.type === 'IMOVEL') {
            const streets = ['Rua Harmonia', 'Rua Augusta', 'Av. Paulista', 'Rua Oscar Freire']
            const neighborhoods = ['Vila Madalena', 'Jardins', 'Itaim Bibi', 'Vila Olímpia']
            const street = streets[Math.floor(Math.random() * streets.length)]
            const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)]
            const number = Math.floor(Math.random() * 9999) + 1
            return `${street}, ${number} - ${neighborhood}, São Paulo/SP`
        }
        if (item.type === 'VEICULO') {
            return 'Av. Paulista, 1000 - Bela Vista, São Paulo/SP'
        }
        return Math.random() > 0.5 ? 'Rua das Flores, 789 - Vila Olímpia, São Paulo/SP' : undefined
    }

    const shouldHaveAddress = (item: AuctionItem) => {
        if (item.type === 'IMOVEL' || item.type === 'VEICULO') return true
        return Math.random() > 0.3
    }

    const initializeMap = () => {
        if (!mapRef.current) return

        const map = new google.maps.Map(mapRef.current, {
            zoom: 12,
            center: { lat: -23.5505, lng: -46.6333 },
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
        })

        googleMapRef.current = map
        infoWindowRef.current = new google.maps.InfoWindow()
        updateMarkers()
    }

    const updateMarkers = async () => {
        if (!googleMapRef.current || !auction) return

        markersRef.current.forEach(marker => marker.setMap(null))
        markersRef.current = []

        const itemsWithAddress = getItemsWithValidAddress()
        if (itemsWithAddress.length === 0) return

        const bounds = new google.maps.LatLngBounds()
        const geocoder = new google.maps.Geocoder()

        for (const item of itemsWithAddress) {
            if (!item.address) continue

            try {
                const result = await geocodeAddress(geocoder, item.address)
                if (result) {
                    const isSelected = selectedItem?.id === item.id
                    
                    const marker = new google.maps.Marker({
                        position: result,
                        map: googleMapRef.current,
                        title: item.title,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: isSelected ? 12 : 8,
                            fillColor: getMarkerColor(item.type),
                            fillOpacity: isSelected ? 1 : 0.8,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        },
                    })

                    marker.addListener('click', () => {
                        setSelectedItem(item)
                        if (infoWindowRef.current) {
                            infoWindowRef.current.setContent(`
                                <div style="padding: 8px; max-width: 250px;">
                                    <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${item.title}</h3>
                                    <p style="margin: 4px 0; font-size: 12px; color: #666;">${item.address}</p>
                                    <p style="margin: 4px 0; font-size: 14px; font-weight: 600; color: #2563eb;">
                                        ${formatPrice(item.basePrice)}
                                    </p>
                                </div>
                            `)
                            infoWindowRef.current.open(googleMapRef.current, marker)
                        }
                    })

                    markersRef.current.push(marker)
                    bounds.extend(result)
                }
            } catch (error) {
                console.error(`Erro ao geocodificar: ${item.address}`, error)
            }
        }

        if (markersRef.current.length > 0) {
            googleMapRef.current.fitBounds(bounds)
        }
    }

    const geocodeAddress = (
        geocoder: google.maps.Geocoder,
        address: string
    ): Promise<google.maps.LatLng | null> => {
        return new Promise((resolve) => {
            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    resolve(results[0].geometry.location)
                } else {
                    resolve(null)
                }
            })
        })
    }

    const getMarkerColor = (type: string) => {
        switch (type) {
            case 'IMOVEL': return '#3b82f6'
            case 'VEICULO': return '#10b981'
            default: return '#8b5cf6'
        }
    }

    const toggleLot = (lotId: string) => {
        setExpandedLots(prev => ({
            ...prev,
            [lotId]: !prev[lotId]
        }))
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const formatDate = (date: Date | string) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        return dateObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getItemTypeIcon = (type: string) => {
        switch (type) {
            case 'IMOVEL': return <Building className="h-4 w-4" />
            case 'VEICULO': return <Car className="h-4 w-4" />
            default: return <Package className="h-4 w-4" />
        }
    }

    const getItemsWithValidAddress = () => {
        if (!auction) return []
        return auction.lots.flatMap(lot =>
            lot.items.filter(item => item.hasValidAddress)
        )
    }

    const getItemsWithoutAddress = () => {
        if (!auction) return []
        return auction.lots.flatMap(lot =>
            lot.items.filter(item => !item.hasValidAddress)
        )
    }

    const getTotalItems = () => {
        if (!auction) return 0
        return auction.lots.reduce((total, lot) => total + lot.items.length, 0)
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando detalhes do leilão...</p>
                    </div>
                </div>
            </MainLayout>
        )
    }

    if (!auction) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Leilão não encontrado</h2>
                        <button
                            onClick={() => router.push('/auctions')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Voltar para leilões
                        </button>
                    </div>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <Head>
                <title>{auction.name}</title>
                <meta name="description" content={`Detalhes e gestão do leilão ${auction.name}`} />
            </Head>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => router.push('/auctions')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{auction.name}</h1>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        {auction.type === 'ONLINE' ? <Eye className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                        {auction.type === 'ONLINE' ? 'Online' : 'Presencial'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(auction.openingDate)} - {formatDate(auction.closingDate)}
                                    </div>
                                    {auction.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {auction.location}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-blue-600">{getTotalItems()}</div>
                                <div className="text-sm text-blue-800">Total de itens</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-green-600">{getItemsWithValidAddress().length}</div>
                                <div className="text-sm text-green-800">No mapa</div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-yellow-600">{getItemsWithoutAddress().length}</div>
                                <div className="text-sm text-yellow-800">Sem endereço</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-purple-600">{auction.lots.length}</div>
                                <div className="text-sm text-purple-800">Lotes</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar */}
                        <div className="lg:w-1/3">
                            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lotes e Itens</h2>

                                <div className="space-y-2">
                                    {auction.lots.map((lot) => (
                                        <div key={lot.id} className="border rounded-lg">
                                            <button
                                                onClick={() => toggleLot(lot.id)}
                                                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {expandedLots[lot.id] ? (
                                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                                    )}
                                                    <span className="font-medium text-gray-900">{lot.identification}</span>
                                                </div>
                                                <span className="text-sm text-gray-500">{lot.items.length} itens</span>
                                            </button>

                                            {expandedLots[lot.id] && (
                                                <div className="border-t">
                                                    {lot.items.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition cursor-pointer border-l-4 ${
                                                                selectedItem?.id === item.id 
                                                                    ? 'border-blue-500 bg-blue-50' 
                                                                    : 'border-transparent'
                                                            }`}
                                                            onClick={() => setSelectedItem(item)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {getItemTypeIcon(item.type)}
                                                                {!item.hasValidAddress && (
                                                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                                    {item.title}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {formatPrice(item.basePrice)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {getItemsWithoutAddress().length > 0 && (
                                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                            <h3 className="font-medium text-yellow-800">Atenção</h3>
                                        </div>
                                        <p className="text-sm text-yellow-700">
                                            {getItemsWithoutAddress().length} {getItemsWithoutAddress().length === 1 ? 'item não possui' : 'itens não possuem'} endereço válido.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mapa */}
                        <div className="lg:w-2/3">
                            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                <div className="p-6 border-b">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            Localização dos Itens
                                        </h3>
                                        <div className="text-sm text-gray-600">
                                            {getItemsWithValidAddress().length} {getItemsWithValidAddress().length === 1 ? 'item no mapa' : 'itens no mapa'}
                                        </div>
                                    </div>
                                </div>

                                <div className="aspect-video bg-gray-100 relative">
                                    {!mapLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                                <p className="text-gray-600">Carregando mapa...</p>
                                            </div>
                                        </div>
                                    )}
                                    {mapLoaded && getItemsWithValidAddress().length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center text-gray-500">
                                                <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                                <p className="font-medium text-lg">Nenhum item com endereço</p>
                                                <p className="text-sm mt-1">Adicione endereços para visualizar no mapa</p>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={mapRef} className="w-full h-full" />
                                </div>

                                {selectedItem && (
                                    <div className="p-6 border-t bg-gray-50">
                                        <h4 className="font-medium text-gray-900 mb-2">Item Selecionado</h4>
                                        <div className="flex items-start gap-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                {getItemTypeIcon(selectedItem.type)}
                                                {!selectedItem.hasValidAddress && (
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="font-medium text-gray-900">{selectedItem.title}</h5>
                                                {selectedItem.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{selectedItem.description}</p>
                                                )}
                                                
                                                {selectedItem.type === 'IMOVEL' && selectedItem.propertyDetails && (
                                                    <div className="mt-2 text-sm text-gray-600">
                                                        <div className="flex gap-4">
                                                            {selectedItem.propertyDetails.bedrooms && (
                                                                <span>{selectedItem.propertyDetails.bedrooms} quartos</span>
                                                            )}
                                                            {selectedItem.propertyDetails.parkingSpots && (
                                                                <span>{selectedItem.propertyDetails.parkingSpots} vagas</span>
                                                            )}
                                                            {selectedItem.propertyDetails.area && (
                                                                <span>{selectedItem.propertyDetails.area}m²</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-lg font-semibold text-blue-600">
                                                        {formatPrice(selectedItem.basePrice)}
                                                    </span>
                                                    {selectedItem.hasValidAddress ? (
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                            No mapa
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                            Sem endereço
                                                        </span>
                                                    )}
                                                </div>
                                                {selectedItem.address && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        📍 {selectedItem.address}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}

export default withClientAuth(AuctionDetailPage)
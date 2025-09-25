'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Head from 'next/head'
import MainLayout from '@/layouts/MainLayout'
import { withClientAuth } from '@/hooks/withClientAuth'
import { TokenPayload } from '@/utils/jwtUtils'
import {
    MapPin,
    Calendar,
    Clock,
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    Building,
    Car,
    Package,
    AlertTriangle,
    DollarSign,
    Eye,
    Info
} from 'lucide-react'

interface Props {
    user: TokenPayload
}

interface AuctionItem {
    id: string
    title: string
    description?: string
    type: 'IMOVEL' | 'VEICULO' | 'OUTROS'
    basePrice: number
    status: 'AVAILABLE' | 'SOLD' | 'CANCELLED'
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
    openingDate: Date
    closingDate: Date
    isActive: boolean
    lots: Lot[]
}

// Mock data para os 3 leilões
const mockAuctionsDetail: { [key: string]: Auction } = {
    '1': {
        id: '1',
        name: 'Leilão de Imóveis Residenciais - Centro SP',
        type: 'ONLINE',
        url: 'https://leilao.exemplo.com/jan2025',
        openingDate: new Date('2025-01-15T09:00:00'),
        closingDate: new Date('2025-01-15T18:00:00'),
        isActive: true,
        lots: [
            {
                id: 'lot1',
                identification: 'Lote 001',
                items: [
                    {
                        id: 'item1',
                        title: 'Apartamento 2 quartos - Vila Madalena',
                        description: 'Apartamento com 65m², 2 quartos, 1 banheiro, sala e cozinha',
                        type: 'IMOVEL',
                        basePrice: 250000,
                        status: 'AVAILABLE',
                        address: 'Rua Harmonia, 123 - Vila Madalena, São Paulo/SP',
                        hasValidAddress: true
                    },
                    {
                        id: 'item2',
                        title: 'Casa 3 quartos - Jardins',
                        description: 'Casa térrea com 120m², 3 quartos, 2 banheiros, garagem',
                        type: 'IMOVEL',
                        basePrice: 450000,
                        status: 'AVAILABLE',
                        address: 'Rua Augusta, 456 - Jardins, São Paulo/SP',
                        hasValidAddress: true
                    }
                ]
            },
            {
                id: 'lot2',
                identification: 'Lote 002',
                items: [
                    {
                        id: 'item3',
                        title: 'Apartamento Cobertura - Itaim',
                        description: 'Cobertura duplex com 180m², 4 quartos, 3 banheiros, terraço',
                        type: 'IMOVEL',
                        basePrice: 850000,
                        status: 'AVAILABLE',
                        address: undefined,
                        hasValidAddress: false
                    }
                ]
            }
        ]
    },
    '2': {
        id: '2',
        name: 'Leilão Presencial - Veículos Nacionais',
        type: 'LOCAL',
        location: 'Av. Paulista, 1000 - São Paulo/SP',
        openingDate: new Date('2025-01-20T14:00:00'),
        closingDate: new Date('2025-01-20T17:00:00'),
        isActive: true,
        lots: [
            {
                id: 'lot3',
                identification: 'Lote 001',
                items: [
                    {
                        id: 'item4',
                        title: 'Honda Civic 2020 - Branco',
                        description: 'Sedan automático, 1.5 turbo, 45.000 km',
                        type: 'VEICULO',
                        basePrice: 85000,
                        status: 'AVAILABLE',
                        address: 'Av. Paulista, 1000 - Bela Vista, São Paulo/SP',
                        hasValidAddress: true
                    },
                    {
                        id: 'item5',
                        title: 'Toyota Corolla 2019 - Prata',
                        description: 'Sedan automático, 2.0, 38.000 km',
                        type: 'VEICULO',
                        basePrice: 75000,
                        status: 'AVAILABLE',
                        address: 'Av. Paulista, 1000 - Bela Vista, São Paulo/SP',
                        hasValidAddress: true
                    }
                ]
            }
        ]
    },
    '3': {
        id: '3',
        name: 'Leilão Online - Equipamentos e Móveis',
        type: 'ONLINE',
        url: 'https://leilao.exemplo.com/equipamentos',
        openingDate: new Date('2025-01-25T10:00:00'),
        closingDate: new Date('2025-01-25T16:00:00'),
        isActive: true,
        lots: [
            {
                id: 'lot4',
                identification: 'Lote 001',
                items: [
                    {
                        id: 'item6',
                        title: 'Mesa Executiva de Madeira',
                        description: 'Mesa para escritório, 1,60x0,80m, madeira maciça',
                        type: 'OUTROS',
                        basePrice: 1200,
                        status: 'AVAILABLE',
                        address: 'Rua das Flores, 789 - Vila Olímpia, São Paulo/SP',
                        hasValidAddress: true
                    },
                    {
                        id: 'item7',
                        title: 'Cadeira Ergonômica Presidente',
                        description: 'Cadeira giratória com apoio lombar, couro sintético',
                        type: 'OUTROS',
                        basePrice: 800,
                        status: 'AVAILABLE',
                        address: undefined,
                        hasValidAddress: false
                    }
                ]
            },
            {
                id: 'lot5',
                identification: 'Lote 002',
                items: [
                    {
                        id: 'item8',
                        title: 'Equipamento de Som Profissional',
                        description: 'Mesa de som digital 32 canais, marca Yamaha',
                        type: 'OUTROS',
                        basePrice: 15000,
                        status: 'AVAILABLE',
                        address: 'Av. Brigadeiro Faria Lima, 321 - Itaim Bibi, São Paulo/SP',
                        hasValidAddress: true
                    }
                ]
            }
        ]
    }
}

function AuctionDetailPage({ user }: Props) {
    const router = useRouter()
    const params = useParams<{ auctionId: string }>()
    const auctionId = params?.auctionId as string
    const [auction, setAuction] = useState<Auction | null>(null)
    const [loading, setLoading] = useState(true)
    const [expandedLots, setExpandedLots] = useState<{ [key: string]: boolean }>({})
    const [selectedItem, setSelectedItem] = useState<AuctionItem | null>(null)

    useEffect(() => {
        loadAuctionDetail()
    }, [auctionId])

    async function loadAuctionDetail() {
        try {
            setLoading(true)
            // Simular carregamento
            await new Promise(resolve => setTimeout(resolve, 800))

            const auctionData = mockAuctionsDetail[auctionId]
            if (auctionData) {
                setAuction(auctionData)
                // Expandir todos os lotes por padrão
                const expanded: { [key: string]: boolean } = {}
                auctionData.lots.forEach(lot => {
                    expanded[lot.id] = true
                })
                setExpandedLots(expanded)
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do leilão:', error)
        } finally {
            setLoading(false)
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

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
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
                        {/* Sidebar com Lotes e Itens */}
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
                                                            className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition cursor-pointer border-l-4 ${selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50' : 'border-transparent'
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
                                            {getItemsWithoutAddress().length} {getItemsWithoutAddress().length === 1 ? 'item não possui' : 'itens não possuem'} endereço válido e não {getItemsWithoutAddress().length === 1 ? 'está sendo exibido' : 'estão sendo exibidos'} no mapa.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Área Principal - Mapa */}
                        <div className="lg:w-2/3">
                            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
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

                                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                        <p className="font-medium text-lg">Mapa do Google Maps</p>
                                        <p className="text-sm mt-1">
                                            Mostrando {getItemsWithValidAddress().length} {getItemsWithValidAddress().length === 1 ? 'item' : 'itens'} com endereço válido
                                        </p>
                                        {selectedItem && selectedItem.hasValidAddress && (
                                            <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border max-w-sm mx-auto">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {getItemTypeIcon(selectedItem.type)}
                                                    <span className="font-medium text-gray-900">{selectedItem.title}</span>
                                                </div>
                                                <p className="text-sm text-gray-600">{selectedItem.address}</p>
                                                <p className="text-sm font-medium text-blue-600 mt-1">
                                                    {formatPrice(selectedItem.basePrice)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedItem && (
                                    <div className="p-6 border-t border-gray-200 bg-gray-50">
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
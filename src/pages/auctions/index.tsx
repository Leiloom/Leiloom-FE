'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Head from 'next/head'
import MainLayout from '@/layouts/MainLayout'
import { withClientAuth } from '@/hooks/withClientAuth'
import { TokenPayload } from '@/utils/jwtUtils'
import { Auction, AuctionItem, Lot } from '@/types/auction'
import { getAuctions } from '@/services/auctionService'
import { toast } from 'react-toastify'
import { MapPin, Filter, Search, Grid, List, Calendar, DollarSign } from 'lucide-react'

interface Props {
    user: TokenPayload
}

interface Filters {
    search: string
    auctionType: string
    minPrice: number | null
    maxPrice: number | null
    location: string
    dateRange: {
        start: Date | null
        end: Date | null
    }
}

// Mock data com 3 leilões
const mockAuctions = [
    {
        id: '1',
        name: 'Leilão de Imóveis Residenciais - Centro SP',
        type: 'ONLINE',
        location: 'São Paulo/SP',
        openingDate: new Date('2025-01-15T09:00:00'),
        closingDate: new Date('2025-01-15T18:00:00'),
        lots: [
            {
                id: 'lot1',
                items: [
                    { id: 'item1', title: 'Apartamento 2 quartos', basePrice: 250000, description: 'Apartamento no centro' },
                    { id: 'item2', title: 'Casa 3 quartos', basePrice: 450000, description: 'Casa em bairro residencial' }
                ]
            }
        ]
    },
    {
        id: '2',
        name: 'Leilão Presencial - Veículos Nacionais',
        type: 'LOCAL',
        location: 'Av. Paulista, 1000 - São Paulo/SP',
        openingDate: new Date('2025-01-20T14:00:00'),
        closingDate: new Date('2025-01-20T17:00:00'),
        lots: [
            {
                id: 'lot2',
                items: [
                    { id: 'item3', title: 'Honda Civic 2020', basePrice: 85000, description: 'Veículo em excelente estado' },
                    { id: 'item4', title: 'Toyota Corolla 2019', basePrice: 75000, description: 'Baixa quilometragem' }
                ]
            }
        ]
    },
    {
        id: '3',
        name: 'Leilão Online - Equipamentos e Móveis',
        type: 'ONLINE',
        location: 'São Paulo/SP',
        openingDate: new Date('2025-01-25T10:00:00'),
        closingDate: new Date('2025-01-25T16:00:00'),
        lots: [
            {
                id: 'lot3',
                items: [
                    { id: 'item5', title: 'Mesa de escritório', basePrice: 1200, description: 'Mesa executiva em madeira' },
                    { id: 'item6', title: 'Cadeira ergonômica', basePrice: 800, description: 'Cadeira para escritório' }
                ]
            }
        ]
    }
]

function AuctionsPage({ user }: Props) {
    const router = useRouter()
    const [auctions, setAuctions] = useState<Auction[]>([])
    const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
    const [showFilters, setShowFilters] = useState(false)
    const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)

    const [filters, setFilters] = useState<Filters>({
        search: '',
        auctionType: 'all',
        minPrice: null,
        maxPrice: null,
        location: '',
        dateRange: {
            start: null,
            end: null
        }
    })

    useEffect(() => {
        loadAuctions()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [filters, auctions])

    useEffect(() => {
        if (selectedAuction) {
            router.push(`/auctions/${selectedAuction.id}`)
        }
    }, [selectedAuction, router])

    async function loadAuctions() {
        try {
            setLoading(true)
            await new Promise(resolve => setTimeout(resolve, 1000))
            setAuctions(mockAuctions as any)
        } catch (error: any) {
            toast.error('Erro ao carregar leilões.')
            console.error('Erro ao carregar leilões:', error)
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let result = [...auctions]

        if (filters.search) {
            const searchLower = filters.search.toLowerCase()
            result = result.filter(auction =>
                auction.name.toLowerCase().includes(searchLower) ||
                auction.lots?.some(lot =>
                    lot.items?.some(item =>
                        item.title.toLowerCase().includes(searchLower) ||
                        item.description?.toLowerCase().includes(searchLower)
                    )
                )
            )
        }

        if (filters.auctionType !== 'all') {
            result = result.filter(auction => auction.type === filters.auctionType)
        }

        // Filtro por preço
        if (filters.minPrice !== null) {
            result = result.filter(auction =>
                auction.lots?.some(lot =>
                    lot.items?.some(item => item.basePrice >= filters.minPrice!)
                )
            )
        }

        if (filters.maxPrice !== null) {
            result = result.filter(auction =>
                auction.lots?.some(lot =>
                    lot.items?.some(item => item.basePrice <= filters.maxPrice!)
                )
            )
        }

        // Filtro por localização
        if (filters.location) {
            const locationLower = filters.location.toLowerCase()
            result = result.filter(auction =>
                auction.location?.toLowerCase().includes(locationLower)
            )
        }

        // Filtro por data
        if (filters.dateRange.start) {
            result = result.filter(auction =>
                new Date(auction.openingDate) >= filters.dateRange.start!
            )
        }

        if (filters.dateRange.end) {
            result = result.filter(auction =>
                new Date(auction.closingDate) <= filters.dateRange.end!
            )
        }

        setFilteredAuctions(result)
    }

    const handleFilterChange = (key: keyof Filters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const handleDateRangeChange = (key: 'start' | 'end', value: Date | null) => {
        setFilters(prev => ({
            ...prev,
            dateRange: { ...prev.dateRange, [key]: value }
        }))
    }

    const resetFilters = () => {
        setFilters({
            search: '',
            auctionType: 'all',
            minPrice: null,
            maxPrice: null,
            location: '',
            dateRange: {
                start: null,
                end: null
            }
        })
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR').format(date)
    }

    const getAuctionItemsCount = (auction: Auction) => {
        return auction.lots?.reduce((total, lot) => total + (lot.items?.length || 0), 0) || 0
    }

    const getAuctionTotalValue = (auction: Auction) => {
        return auction.lots?.reduce((total, lot) => {
            return total + (lot.items?.reduce((lotTotal, item) => lotTotal + item.basePrice, 0) || 0)
        }, 0) || 0
    }

    return (
        <MainLayout>
            <Head>
                <title>Leiloom - Listagem de leilões</title>
                <meta name="description" content={`Listagem de leilões`} />
            </Head>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Leilões Disponíveis</h1>
                                <p className="text-gray-600 mt-2">
                                    Explore e participe dos melhores leilões online e presenciais
                                </p>
                            </div>

                            <div className="flex items-center mt-4 md:mt-0 space-x-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center text-gray-700 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filtros
                                </button>

                                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                                    >
                                        <Grid className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                                    >
                                        <List className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Filtros Sidebar */}
                        <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                                    <button
                                        onClick={resetFilters}
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        Limpar tudo
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Busca */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Buscar
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar leilões ou itens..."
                                                value={filters.search}
                                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-300"
                                            />
                                        </div>
                                    </div>

                                    {/* Tipo de Leilão */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tipo de Leilão
                                        </label>
                                        <select
                                            value={filters.auctionType}
                                            onChange={(e) => handleFilterChange('auctionType', e.target.value)}
                                            className="w-full text-gray-700 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">Todos os tipos</option>
                                            <option value="ONLINE">Online</option>
                                            <option value="LOCAL">Presencial</option>
                                        </select>
                                    </div>

                                    {/* Faixa de Preço */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Faixa de Preço
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <input
                                                    type="number"
                                                    placeholder="Mínimo"
                                                    value={filters.minPrice || ''}
                                                    onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : null)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-300"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="number"
                                                    placeholder="Máximo"
                                                    value={filters.maxPrice || ''}
                                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : null)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-300"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Localização */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Localização
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Cidade, estado ou endereço"
                                                value={filters.location}
                                                onChange={(e) => handleFilterChange('location', e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-300"
                                            />
                                        </div>
                                    </div>

                                    {/* Período */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Período do Leilão
                                        </label>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs text-gray-500">Data de início</label>
                                                <input
                                                    type="date"
                                                    value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                                                    onChange={(e) => handleDateRangeChange('start', e.target.value ? new Date(e.target.value) : null)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Data de término</label>
                                                <input
                                                    type="date"
                                                    value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                                                    onChange={(e) => handleDateRangeChange('end', e.target.value ? new Date(e.target.value) : null)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conteúdo Principal */}
                        <div className="lg:w-3/4">
                            {/* Resultados */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Leilões Disponíveis ({filteredAuctions.length})
                                    </h2>

                                    {filteredAuctions.length > 0 && (
                                        <p className="text-sm text-gray-600">
                                            Mostrando {Math.min(filteredAuctions.length, viewMode === 'grid' ? 6 : 10)} de {filteredAuctions.length} leilões
                                        </p>
                                    )}
                                </div>

                                {loading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
                                                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredAuctions.length === 0 ? (
                                    <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            Nenhum leilão encontrado
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            Tente ajustar os filtros ou buscar por termos diferentes.
                                        </p>
                                        <button
                                            onClick={resetFilters}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Limpar filtros
                                        </button>
                                    </div>
                                ) : viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredAuctions.map((auction) => (
                                            <div
                                                key={auction.id}
                                                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                                                onClick={() => setSelectedAuction(auction)}
                                            >
                                                <div className="h-40 bg-gray-200 rounded-t-lg flex items-center justify-center">
                                                    <div className="text-center text-gray-500">
                                                        <DollarSign className="h-10 w-10 mx-auto mb-2" />
                                                        <p>Imagem do Leilão</p>
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                                                            {auction.name}
                                                        </h3>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${auction.type === 'ONLINE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                            {auction.type === 'ONLINE' ? 'Online' : 'Presencial'}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                        {'Leilão de diversos itens com ótimas oportunidades.'}
                                                    </p>

                                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                                        <div className="flex items-center">
                                                            <Calendar className="h-4 w-4 mr-1" />
                                                            <span>
                                                                {formatDate(new Date(auction.openingDate))}
                                                            </span>
                                                        </div>
                                                        <span>{getAuctionItemsCount(auction)} itens</span>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            Valor total: {formatPrice(getAuctionTotalValue(auction))}
                                                        </span>
                                                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                                            Ver detalhes
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredAuctions.map((auction) => (
                                            <div
                                                key={auction.id}
                                                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6 cursor-pointer"
                                                onClick={() => setSelectedAuction(auction)}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center">
                                                    <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                                                        <div className="h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                                                            <DollarSign className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                    </div>

                                                    <div className="flex-grow">
                                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                                                            <h3 className="font-semibold text-gray-900 text-lg">
                                                                {auction.name}
                                                            </h3>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${auction.type === 'ONLINE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} mt-2 md:mt-0`}>
                                                                {auction.type === 'ONLINE' ? 'Online' : 'Presencial'}
                                                            </span>
                                                        </div>

                                                        <p className="text-gray-600 mb-4">
                                                            {'Leilão de diversos itens com ótimas oportunidades.'}
                                                        </p>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                            <div className="flex items-center  text-gray-600">
                                                                <Calendar className="h-4 w-4 mr-2 text-gray-700" />
                                                                <span>
                                                                    Início: {formatDate(new Date(auction.openingDate))}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <Calendar className="h-4 w-4 mr-2 text-gray-700" />
                                                                <span>
                                                                    Término: {formatDate(new Date(auction.closingDate))}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <MapPin className="h-4 w-4 mr-2 text-gray-700" />
                                                                <span className="truncate">
                                                                    {auction.location || 'Local não especificado'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 md:mt-0 md:ml-6 md:text-right">
                                                        <div className="mb-2">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {getAuctionItemsCount(auction)} itens
                                                            </span>
                                                        </div>
                                                        <div className="mb-4">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {formatPrice(getAuctionTotalValue(auction))}
                                                            </span>
                                                        </div>
                                                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                                            Ver detalhes
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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

export default withClientAuth(AuctionsPage)
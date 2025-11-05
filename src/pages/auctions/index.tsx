'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Head from 'next/head'
import MainLayout from '@/layouts/MainLayout'
import { withClientAuth } from '@/hooks/withClientAuth'
import { TokenPayload } from '@/utils/jwtUtils'
import { Auction } from '@/types/auction'
import { getAuctions } from '@/services/auctionService'
import { toast } from 'react-toastify'
import { MapPin, Search, Grid, List } from 'lucide-react'
import { MultiSelectDropdown } from '@/components/shared/MultiSelectDropdown'
import { Button } from '@/components/shared/Button'
import AuctionMap from '@/components/maps/AuctionMap'
import { getDetailedPaymentSummary } from '@/services/paymentService'


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
    states?: string[]
    cities?: string[]
}

function AuctionsPage({ user }: Props) {
    const router = useRouter()
    const [auctions, setAuctions] = useState<Auction[]>([])
    const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)
    const [filters, setFilters] = useState<Filters>({
        search: '',
        auctionType: 'all',
        minPrice: null,
        maxPrice: null,
        location: '',
        dateRange: { start: null, end: null },
        states: [],
        cities: []
    })
    const [pendingFilters, setPendingFilters] = useState<Filters>({ ...filters })
    const [states, setStates] = useState<{ id: number; sigla: string; nome: string }[]>([])
    const [cities, setCities] = useState<{ id: number; nome: string }[]>([])
    const [selectedStates, setSelectedStates] = useState<string[]>([])
    const [selectedCities, setSelectedCities] = useState<string[]>([])
    const [hasActivePlan, setHasActivePlan] = useState<boolean | null>(null)

    useEffect(() => {
        validateActivePlan()
    }, [])

    useEffect(() => {
        loadAuctions()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [filters, auctions])

    useEffect(() => {
        if (selectedAuction) router.push(`/auctions/${selectedAuction.id}`)
    }, [selectedAuction, router])

    useEffect(() => {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then((res) => res.json())
            .then((data) => setStates(data))
            .catch(() => toast.error('Erro ao carregar estados do IBGE'))
    }, [])

    useEffect(() => {
        if (selectedStates.length === 0) {
            setCities([])
            setSelectedCities([])
            return
        }

        Promise.all(
            selectedStates.map((uf) =>
                fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
                    .then((res) => res.json())
                    .catch(() => [])
            )
        ).then((responses) => {
            const allCities = responses.flat()
            setCities(allCities)
        })
    }, [selectedStates])

    async function validateActivePlan() {
        try {
            const paymentSummary = await getDetailedPaymentSummary()
            console.log('Resumo de pagamento:', paymentSummary)
            if (!paymentSummary) {
                toast.warning('Você precisa ter um plano ativo para acessar os leilões.')
                router.push('/no-plan')
                return
            }
            if (!paymentSummary?.currentPlan?.period?.expiresAt || new Date(paymentSummary.currentPlan.period.expiresAt) < new Date()) {
                toast.warning('Você precisa ter um plano ativo para acessar os leilões.')
                router.push('/no-plan')
                return
            }
            setHasActivePlan(true)
            loadAuctions()
            
        } catch (error) {
            console.error('Erro ao verificar plano:', error)
            toast.error('Erro ao validar o plano do cliente.')
            router.push('/no-plan')
        }
    }

    async function loadAuctions() {
        try {
            setLoading(true)
            const data = await getAuctions()
            setAuctions(data)
        } catch (error: any) {
            toast.error('Erro ao carregar leilões.')
            console.error('Erro ao carregar leilões:', error)
        } finally {
            setLoading(false)
        }
    }

    const applyManualFilters = () => {
        setFilters({
            ...pendingFilters,
            states: selectedStates,
            cities: selectedCities
        })
        toast.success('Filtros aplicados com sucesso!')
    }

    const applyFilters = () => {
        let result = auctions.map((auction) => {
            const filteredLots = auction.lots?.map((lot) => {
                let filteredItems = lot.items || []

                if (filters.search) {
                    const searchLower = filters.search.toLowerCase()
                    filteredItems = filteredItems.filter(
                        (item) =>
                            item.title.toLowerCase().includes(searchLower) ||
                            item.description?.toLowerCase().includes(searchLower)
                    )
                }

                if (filters.minPrice !== null && filters.minPrice !== 0) {
                    filteredItems = filteredItems.filter(
                        (item) => item.basePrice >= filters.minPrice!
                    )
                }
                if (filters.maxPrice !== null && filters.maxPrice !== 0) {
                    filteredItems = filteredItems.filter(
                        (item) => item.basePrice <= filters.maxPrice!
                    )
                }

                if (filters.states && filters.states.length > 0) {
                    filteredItems = filteredItems.filter((item) =>
                        filters.states!.some((uf) =>
                            item.state?.toUpperCase().includes(uf.toUpperCase())
                        )
                    )
                }

                if (filters.cities && filters.cities.length > 0) {
                    filteredItems = filteredItems.filter((item) =>
                        filters.cities!.some((city) =>
                            item.city?.toLowerCase().includes(city.toLowerCase())
                        )
                    )
                }

                return { ...lot, items: filteredItems }
            }) || []

            return { ...auction, lots: filteredLots }
        })

        result = result
            .filter((auction) => {
                if (filters.auctionType !== 'all' && auction.type !== filters.auctionType) {
                    return false
                }
                if (filters.dateRange.start && new Date(auction.openingDate) < filters.dateRange.start) {
                    return false
                }
                if (filters.dateRange.end && new Date(auction.closingDate) > filters.dateRange.end) {
                    return false
                }

                const totalItems =
                    auction.lots?.reduce((sum, lot) => sum + (lot.items?.length || 0), 0) || 0
                return totalItems > 0
            })
            .map((auction) => ({
                ...auction,
                lots: auction.lots?.filter((lot) => (lot.items?.length || 0) > 0)
            }))

        setFilteredAuctions(result)
    }


    const getAuctionLocation = (auction: Auction): { city?: string; state?: string } => {
        for (const lot of auction.lots || []) {
            for (const item of lot.items || []) {
                if (item.city || item.state) {
                    return { city: item.city, state: item.state }
                }
            }
        }
        return {}
    }

    const handleFilterChange = (key: keyof Filters, value: any) => {
        setPendingFilters((prev) => ({ ...prev, [key]: value }))
    }

    const handleDateRangeChange = (key: 'start' | 'end', value: Date | null) => {
        setPendingFilters((prev) => ({
            ...prev,
            dateRange: { ...prev.dateRange, [key]: value }
        }))
    }

    const resetFilters = () => {
        setPendingFilters({
            search: '',
            auctionType: 'all',
            minPrice: null,
            maxPrice: null,
            location: '',
            dateRange: { start: null, end: null },
            states: [],
            cities: []
        })
        setSelectedStates([])
        setSelectedCities([])
        setFilters({
            search: '',
            auctionType: 'all',
            minPrice: null,
            maxPrice: null,
            location: '',
            dateRange: { start: null, end: null },
            states: [],
            cities: []
        })
    }

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)

    const getAuctionItemsCount = (auction: Auction) =>
        auction.lots?.reduce((total, lot) => total + (lot.items?.length || 0), 0) || 0

    const AuctionAccordion = ({ auction }: { auction: Auction }) => {
        const [isOpen, setIsOpen] = useState(true)
        const location = getAuctionLocation(auction)
        if (getAuctionItemsCount(auction) === 0) return null

    if (hasActivePlan === null) {
    return (
        <MainLayout>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">Verificando seu plano...</p>
            </div>
        </MainLayout>
    )
}


        return (
            <div className="bg-white rounded-lg shadow-sm border transition-shadow">
                <div
                    className="p-4 cursor-pointer flex justify-between items-center hover:bg-gray-50"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div>
                        <div className="font-semibold text-gray-900 line-clamp-1">
                            {auction.name}
                        </div>
                    </div>
                    <div className="text-gray-400">{isOpen ? '▾' : '▸'}</div>
                </div>

                {isOpen && (
                    <div className="border-t p-3 space-y-2 bg-gray-50">
                        {auction.lots?.flatMap((lot) =>
                            lot.items?.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-2 rounded-md bg-white border hover:shadow-sm cursor-pointer"
                                    onClick={() => setSelectedAuction(auction)}
                                >
                                    <div className="text-sm font-medium text-gray-800">
                                        {item.title}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {item.city && item.state
                                            ? `${item.city}/${item.state}`
                                            : 'Localização não informada'}
                                    </div>
                                    <div className="text-xs text-gray-500 line-clamp-1">
                                        {item.description || 'Sem descrição'}
                                    </div>
                                    <div className="text-sm text-blue-700 font-semibold mt-1">
                                        {formatPrice(item.basePrice)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <MainLayout>
            <Head>
                <title>Leiloom - Listagem de leilões</title>
                <meta name="description" content="Listagem de leilões" />
            </Head>

            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Leilões Disponíveis</h1>
                                <p className="text-gray-600 mt-2">
                                    Explore e participe dos melhores leilões online e presenciais
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Filtros */}
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
                                                value={pendingFilters.search}
                                                onChange={(e) =>
                                                    handleFilterChange('search', e.target.value)
                                                }
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                                            />
                                        </div>
                                    </div>

                                    {/* Tipo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tipo de Leilão
                                        </label>
                                        <select
                                            value={pendingFilters.auctionType}
                                            onChange={(e) =>
                                                handleFilterChange('auctionType', e.target.value)
                                            }
                                            className="w-full text-gray-700 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">Todos os tipos</option>
                                            <option value="ONLINE">Online</option>
                                            <option value="LOCAL">Presencial</option>
                                        </select>
                                    </div>

                                    {/* Faixa de preço */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Faixa de Preço
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="number"
                                                placeholder="Mínimo"
                                                value={pendingFilters.minPrice || ''}
                                                onChange={(e) =>
                                                    handleFilterChange(
                                                        'minPrice',
                                                        e.target.value ? Number(e.target.value) : null
                                                    )
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Máximo"
                                                value={pendingFilters.maxPrice || ''}
                                                onChange={(e) =>
                                                    handleFilterChange(
                                                        'maxPrice',
                                                        e.target.value ? Number(e.target.value) : null
                                                    )
                                                }
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                                            />
                                        </div>
                                    </div>

                                    {/* Estado */}
                                    <MultiSelectDropdown
                                        label="Estados"
                                        options={states.map((s) => ({
                                            label: `${s.nome} (${s.sigla})`,
                                            value: s.sigla
                                        }))}
                                        selected={selectedStates}
                                        onChange={setSelectedStates}
                                    />

                                    {/* Cidade */}
                                    {selectedStates.length > 0 && (
                                        <MultiSelectDropdown
                                            label="Cidades"
                                            options={cities.map((c) => ({
                                                label: c.nome,
                                                value: c.nome
                                            }))}
                                            selected={selectedCities}
                                            onChange={setSelectedCities}
                                        />
                                    )}

                                    {/* Datas */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Período do Leilão
                                        </label>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-xs text-gray-500">
                                                    Data de início
                                                </label>
                                                <input
                                                    type="date"
                                                    value={
                                                        pendingFilters.dateRange.start
                                                            ? pendingFilters.dateRange.start
                                                                .toISOString()
                                                                .split('T')[0]
                                                            : ''
                                                    }
                                                    onChange={(e) =>
                                                        handleDateRangeChange(
                                                            'start',
                                                            e.target.value ? new Date(e.target.value) : null
                                                        )
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">
                                                    Data de término
                                                </label>
                                                <input
                                                    type="date"
                                                    value={
                                                        pendingFilters.dateRange.end
                                                            ? pendingFilters.dateRange.end
                                                                .toISOString()
                                                                .split('T')[0]
                                                            : ''
                                                    }
                                                    onChange={(e) =>
                                                        handleDateRangeChange(
                                                            'end',
                                                            e.target.value ? new Date(e.target.value) : null
                                                        )
                                                    }
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botão Aplicar */}


                                    <div className="pt-4">
                                        <Button
                                            variant="primary"
                                            className="w-full"
                                            onClick={applyManualFilters}
                                        >
                                            Buscar
                                        </Button>

                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mapa */}
                        <div className="lg:w-2/4 w-full order-last lg:order-none">
                            <div className="bg-white rounded-lg shadow-sm border p-4">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Mapa dos Leilões
                                </h2>
                                <AuctionMap auctions={filteredAuctions} />
                            </div>
                        </div>

                        {/* Lista */}
                        <div className="lg:w-1/4 w-full">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Leilões ({filteredAuctions.filter(a => getAuctionItemsCount(a) > 0).length})
                                </h2>
                            </div>

                            {loading ? (
                                <p className="text-center text-gray-500">Carregando...</p>
                            ) : filteredAuctions.filter(a => getAuctionItemsCount(a) > 0).length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Nenhum leilão com itens encontrado
                                    </h3>
                                    <button
                                        onClick={resetFilters}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Limpar filtros
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
                                    {filteredAuctions.map((auction) => (
                                        <AuctionAccordion key={auction.id} auction={auction} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
        
    )
    
}

export default withClientAuth(AuctionsPage)

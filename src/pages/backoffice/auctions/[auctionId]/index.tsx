'use client'
import Head from 'next/head'
import { useEffect, useState, useCallback, Fragment } from 'react'
import { toast } from 'react-toastify'
import { getAuctionById, updateAuction, deleteAuction } from '@/services/auctionService'
import { getLotsByAuction, createLot, updateLot, deleteLot } from '@/services/lotService'
import { createAuctionItem, updateAuctionItem, deleteAuctionItem } from '@/services/auctionItemService'
import { saveScrapingConfig, getAllScrapingConfigs, deleteScrapingConfig } from '@/services/scrapingConfigService'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { useRouter, useParams } from 'next/navigation'
import MainLayout from '@/layouts/MainLayout'
import { withBackofficeAuth } from '@/hooks/withBackofficeAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import AuctionEditModal from '../../../../components/backoffice/auctions/AuctionEditModal'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { Dialog, Transition } from '@headlessui/react'
import { useTagModal } from '../../../../hooks/useTagModel'
import TagConfigModal from '@/components/shared/TagConfigModal'

import {
  CheckCircle,
  AlertTriangle,
  MapPin,
  Globe,
  Cog,
  Edit3,
  Trash2,
  Home,
  Car,
  Package,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Check,
  X as XIcon
} from 'lucide-react'

import { AuctionItem, AuctionType } from '@/types/auction'

// --- CONSTANTES E TYPES ---

// Mapa de Labels para o Modal de Tag
const ITEM_FIELD_LABELS: Record<string, string> = {
  title: 'Título do Item',
  itemType: 'Tipo do Item',
  description: 'Descrição',
  basePrice: 'Preço Base',
  increment: 'Incremento',
  state: 'Estado',
  city: 'Cidade',
  location: 'Endereço',
  zipCode: 'CEP',
  propertyType: 'Tipo de Imóvel',
  area: 'Área',
  bedrooms: 'Quartos',
  parkingSpots: 'Vagas',
  status: 'Status do Item',
  images: 'Links das Imagens'
}

// Mapa De/Para: Nome do campo no Frontend -> Enum no Banco
const ITEM_FIELD_ENUM_MAP: Record<string, string> = {
  title: 'ITEM_TITLE',
  itemType: 'ITEM_TYPE',
  description: 'ITEM_DESCRIPTION',
  basePrice: 'ITEM_BASE_PRICE',
  increment: 'ITEM_INCREMENT',
  state: 'ITEM_STATE',
  city: 'ITEM_CITY',
  location: 'ITEM_LOCATION',
  zipCode: 'ITEM_ZIP_CODE',
  status: 'ITEM_STATUS',
  images: 'ITEM_IMAGES',
  propertyType: 'PROPERTY_TYPE',
  area: 'PROPERTY_AREA',
  bedrooms: 'PROPERTY_BEDROOMS',
  parkingSpots: 'PROPERTY_PARKING_SPOTS',
}

interface Lot {
  id: string
  auctionId: string
  identification: string
  createdOn: string
  updatedOn: string
  items?: AuctionItem[]
}

interface Auction {
  id: string
  name: string
  type: 'ONLINE' | 'LOCAL'
  url?: string
  openingDate: string
  closingDate: string
  isActive: boolean
  createdBy: string
  createdOn: string
  updatedBy?: string
  updatedOn?: string
  lots?: Lot[]
  items?: AuctionItem[]
}

function AuctionDetailPage() {
  const params = useParams<{ auctionId: string }>()
  const router = useRouter()
  const auctionId = params?.auctionId

  // --- ESTADOS PRINCIPAIS ---
  const [auction, setAuction] = useState<Auction | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set())
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)

  // --- ESTADOS DOS MODAIS DE CRUD ---
  const [isLotModalOpen, setIsLotModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  
  // --- CONFIGURAÇÕES DE SCRAPING ---
  const [scrapingConfigs, setScrapingConfigs] = useState<any[]>([])
  const [pendingItemTags, setPendingItemTags] = useState<Record<string, string>>({})

  // --- ESTADO DO MODAL DE TAG ---
  const { 
    isOpen: isTagModalOpen, 
    selectedField: selectedTagField, 
    contextData: selectedTagItemId, 
    openTagModal: openTagModalHook, 
    closeTagModal 
  } = useTagModal<string>()
  
  const [lotAction, setLotAction] = useState<'create' | 'edit'>('create')
  const [itemAction, setItemAction] = useState<'create' | 'edit'>('create')
  const [editingLot, setEditingLot] = useState<Lot | null>(null)
  const [editingItem, setEditingItem] = useState<AuctionItem | null>(null)
  const [selectedLotId, setSelectedLotId] = useState<string>('')
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false)

  const [states, setStates] = useState<{ id: number; sigla: string; nome: string }[]>([])
  const [cities, setCities] = useState<{ id: number; nome: string }[]>([])
  const [selectedState, setSelectedState] = useState(editingItem?.state || '')
  const [selectedCity, setSelectedCity] = useState(editingItem?.city || '')

  // --- EFEITOS (Data Fetching) ---
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setStates(data))
      .catch(() => toast.error('Erro ao carregar estados do IBGE'))
  }, [])

  useEffect(() => {
    if (!selectedState) {
      setCities([])
      return
    }

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`)
      .then(res => res.json())
      .then(data => setCities(data))
      .catch(() => toast.error('Erro ao carregar cidades do IBGE'))
  }, [selectedState])

  // Resetar ao abrir modal
  useEffect(() => {
    if (itemAction === 'create') {
      setSelectedState('')
      setSelectedCity('')
    } else if (editingItem) {
      setSelectedState(editingItem.state || '')
      setSelectedCity(editingItem.city || '')
    }
  }, [isItemModalOpen, editingItem, itemAction])

  // Fechar modals com ESC
  useEffect(() => {
    if (!isLotModalOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !isLoading) setIsLotModalOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isLotModalOpen, isLoading])

  useEffect(() => {
    if (!isItemModalOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !isLoading) setIsItemModalOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isItemModalOpen, isLoading])

  // --- BUSCA DE CONFIGS DE SCRAPING ---
  const fetchScrapingConfigs = useCallback(async () => {
    if (!auctionId) return
    try {
        const configs = await getAllScrapingConfigs(auctionId)
        setScrapingConfigs(configs)
    } catch (err) {
        console.error('Erro ao buscar configs de scraping:', err)
    }
  }, [auctionId])

  useEffect(() => {
    fetchScrapingConfigs()
  }, [fetchScrapingConfigs])

  // --- HANDLERS PRINCIPAIS ---

  const handleEditAuction = () => { setIsEditModalOpen(true) }

  const handleSaveAuctionEdit = async (auctionData: any) => {
    if (!auctionId) return
    setIsLoading(true)
    try {
      const updatedAuction = await updateAuction(auctionId, auctionData)
      setAuction(updatedAuction)
      toast.success('Leilão atualizado com sucesso!')
      setIsEditModalOpen(false)
      await fetchData()
    } catch (error) {
      toast.error('Erro ao atualizar leilão')
      console.error('Erro ao atualizar leilão:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmToggleStatus = async () => {
    if (!auctionId || !auction) return
    setIsLoading(true)
    try {
      if (auction.isActive) {
        await deleteAuction(auctionId)
        toast.success('Leilão desativado com sucesso!')
      } else {
        await updateAuction(auctionId, { isActive: true })
        toast.success('Leilão ativado com sucesso!')
      }
      setIsDeactivateModalOpen(false)
      setIsActivateModalOpen(false)
      await fetchData()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || `Erro ao ${auction.isActive ? 'desativar' : 'ativar'} leilão`
      toast.error(errorMessage)
      setIsDeactivateModalOpen(false)
      setIsActivateModalOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchData = useCallback(async () => {
    if (!auctionId) return
    setIsLoading(true)
    try {
      const [auctionData, lotsData] = await Promise.all([
        getAuctionById(auctionId),
        getLotsByAuction(auctionId)
      ])
      
      const normalizeImages = (items?: any[]) =>
        (items || []).map(item => ({
          ...item,
          images: (item.images || []).map((img: any) =>
            typeof img === 'string'
              ? { id: crypto.randomUUID?.() ?? Math.random().toString(), url: img }
              : { id: img.id ?? crypto.randomUUID?.() ?? Math.random().toString(), url: img.url }
          ),
        }))

      const normalizedLots = (lotsData || []).map((lot: any) => ({
        ...lot,
        items: normalizeImages(lot.items),
      }))

      const normalizedAuction = {
        ...auctionData,
        lots: (auctionData.lots || []).map((lot: any) => ({
          ...lot,
          items: normalizeImages(lot.items),
        })),
        items: normalizeImages(auctionData.items),
      }

      setAuction(normalizedAuction)
      setLots(normalizedLots)
      const lotIds = normalizedLots.map((lot: Lot) => lot.id)
      setExpandedLots(new Set(lotIds))
    } catch (error) {
      toast.error('Erro ao carregar detalhes do leilão')
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }, [auctionId])

  useEffect(() => { fetchData() }, [fetchData])

  // --- HELPERS DE FORMATAÇÃO ---
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
  }

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const getAuctionStatus = () => {
    if (!auction) return { status: 'unknown', label: 'Carregando...', color: 'gray' }
    if (!auction.isActive) return { status: 'inactive', label: 'Inativo', color: 'red' }

    const now = new Date()
    const opening = new Date(auction.openingDate)
    const closing = new Date(auction.closingDate)

    if (now < opening) return { status: 'scheduled', label: 'Programado', color: 'blue' }
    if (now >= opening && now <= closing) return { status: 'active', label: 'Em Andamento', color: 'green' }
    return { status: 'closed', label: 'Encerrado', color: 'gray' }
  }

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'IMOVEL': return <Home className="h-4 w-4" />
      case 'VEICULO': return <Car className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'IMOVEL': return 'Imóvel'
      case 'VEICULO': return 'Veículo'
      default: return 'Outros'
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      AVAILABLE: { label: 'Disponível', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      SOLD: { label: 'Vendido', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    }
    const config = configs[status as keyof typeof configs] || configs.AVAILABLE
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const toggleLotExpansion = (lotId: string) => {
    setExpandedLots(prev => {
      const newSet = new Set(prev)
      if (newSet.has(lotId)) newSet.delete(lotId)
      else newSet.add(lotId)
      return newSet
    })
  }

  // --- HANDLERS DE LOTES ---
  const handleAddLot = () => {
    setEditingLot(null)
    setLotAction('create')
    setIsLotModalOpen(true)
  }

  const handleEditLot = (lot: Lot) => {
    setEditingLot(lot)
    setLotAction('edit')
    setIsLotModalOpen(true)
  }

  const handleSaveLot = async (formData: FormData) => {
    if (!auctionId) return
    setIsLoading(true)
    try {
      const lotData = { auctionId, identification: formData.get('identification') as string }
      if (lotAction === 'edit' && editingLot) {
        await updateLot(editingLot.id, lotData)
        toast.success('Lote atualizado com sucesso!')
      } else {
        await createLot(lotData)
        toast.success('Lote criado com sucesso!')
      }
      setIsLotModalOpen(false)
      await fetchData()
    } catch (error) {
      toast.error('Erro ao salvar lote')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLot = async (lotId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.')) return
    setIsLoading(true)
    try {
      await deleteLot(lotId)
      toast.success('Lote excluído com sucesso!')
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao excluir lote')
    } finally {
      setIsLoading(false)
    }
  }

  // --- HANDLERS DE ITENS ---
  const handleAddItem = (lotId: string) => {
    setSelectedLotId(lotId)
    setEditingItem(null)
    setPendingItemTags({}) // Resetar tags pendentes
    setItemAction('create')
    setIsItemModalOpen(true)
  }

  const handleEditItem = (item: AuctionItem) => {
    setSelectedLotId(item.lotId)
    const normalizedImages = (item.images || []).map((img: any) =>
      typeof img === 'string' ? { id: crypto.randomUUID?.() ?? Math.random().toString(), url: img } : img
    )
    setEditingItem({ ...item, images: normalizedImages })
    setItemAction('edit')
    setIsItemModalOpen(true)
  }

  // --- TAG MODAL HANDLERS ---
  const handleOpenTagModal = (field: string, item?: AuctionItem) => {
    const itemId = item?.id ?? editingItem?.id ?? ''
    openTagModalHook(field, itemId)
  }

  const handleSaveTag = async (tagValue: string) => {
    if (!selectedTagField) return

    // Verifica se estamos editando um item existente (tem ID) ou criando um novo
    if (selectedTagItemId) {
      // --- MODO EDIÇÃO (Item já existe no banco) ---
      if (!auctionId) return
      setIsLoading(true)
      try {
        if (!tagValue || tagValue.trim() === '') {
            // DELETAR: Busca a config correspondente na lista carregada
            const enumType = ITEM_FIELD_ENUM_MAP[selectedTagField]
            const configToDelete = scrapingConfigs.find(c => c.itemId === selectedTagItemId && c.fieldType === enumType)
            
            if (configToDelete) {
                await deleteScrapingConfig(configToDelete.id)
                toast.info(`Tag para "${ITEM_FIELD_LABELS[selectedTagField]}" removida.`)
            }
        } else {
            // SALVAR
            await saveScrapingConfig({
                auctionId,
                itemId: selectedTagItemId,
                fieldName: selectedTagField,
                selector: tagValue
            })
            toast.success(`Tag para "${ITEM_FIELD_LABELS[selectedTagField]}" salva com sucesso!`)
        }
        await fetchScrapingConfigs() // Atualiza ícones
      } catch (error) {
        toast.error('Erro ao processar configuração.')
      } finally {
        setIsLoading(false)
        closeTagModal()
      }
    } else {
      // --- MODO CRIAÇÃO (Item novo, ainda não salvo) ---
      if (!tagValue || tagValue.trim() === '') {
          // Se vazio, remove do objeto de tags pendentes
          setPendingItemTags(prev => {
              const newState = { ...prev }
              delete newState[selectedTagField]
              return newState
          })
      } else {
          // Se tem valor, atualiza o estado
          setPendingItemTags(prev => ({ ...prev, [selectedTagField]: tagValue }))
      }
      closeTagModal()
    }
  }

  const getCurrentSelector = () => {
      if (!selectedTagField) return ''

      // Se temos um ID de item (Edição), buscamos nas configs carregadas do banco
      if (selectedTagItemId) {
          const enumType = ITEM_FIELD_ENUM_MAP[selectedTagField]
          const config = scrapingConfigs.find(c => c.itemId === selectedTagItemId && c.fieldType === enumType)
          return config ? config.selector : ''
      } 
      
      // Se não temos ID (Criação), buscamos no estado local de pendentes
      return pendingItemTags[selectedTagField] || ''
  }

  const handleSaveItem = async (formData: FormData) => {
    setIsLoading(true)
    try {
      const itemData: any = {
        lotId: selectedLotId,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        type: formData.get('type') as string,
        basePrice: parseFloat(formData.get('basePrice') as string),
        increment: parseFloat(formData.get('increment') as string),
        state: selectedState,
        city: selectedCity,
        zipCode: formData.get('zipCode') as string,
        location: formData.get('location') as string,
        status: formData.get('status') as string || 'AVAILABLE'
      }

      const images = formData.getAll('images')
        .map((v) => (v as string).trim())
        .filter((v) => v.length > 0)

      if (images.length > 0) itemData.images = images

      if (itemData.type === 'IMOVEL') {
        const propertyType = formData.get('propertyType') as string
        const area = formData.get('area') as string
        const bedrooms = formData.get('bedrooms') as string
        const parkingSpots = formData.get('parkingSpots') as string

        if (propertyType || area || bedrooms || parkingSpots) {
          itemData.propertyDetails = {
            type: propertyType || '',
            area: area ? parseFloat(area) : undefined,
            bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
            parkingSpots: parkingSpots ? parseInt(parkingSpots) : undefined
          }
        }
      }

      let targetItemId: string | undefined

      if (itemAction === 'edit' && editingItem) {
        await updateAuctionItem(editingItem.id, itemData)
        targetItemId = editingItem.id
        toast.success('Item atualizado com sucesso!')
      } else {
        const createdItem = await createAuctionItem(itemData)
        targetItemId = createdItem?.id
        toast.success('Item criado com sucesso!')
      }

      // Salva tags pendentes
      if (targetItemId && auctionId && Object.keys(pendingItemTags).length > 0) {
        await Promise.all(
          Object.entries(pendingItemTags).map(([fieldName, selector]) => 
            saveScrapingConfig({
              auctionId: auctionId!,
              itemId: targetItemId!,
              fieldName: fieldName,
              selector: selector
            })
          )
        )
      }

      setIsItemModalOpen(false)
      await fetchData()
      await fetchScrapingConfigs()
    } catch (error) {
      toast.error('Erro ao salvar item')
      console.error('Erro ao salvar item:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este item?')) return
    setIsLoading(true)
    try {
      await deleteAuctionItem(itemId)
      toast.success('Item cancelado com sucesso!')
      await fetchData()
    } catch (error) {
      toast.error('Erro ao cancelar item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAuction = async () => {
    if (!auction || !auctionId) return
    setIsLoading(true)
    try {
      await updateAuction(auctionId, { ...auction, type: auction.type as AuctionType, updatedBy: 'system' })
      toast.success('Leilão atualizado com sucesso!')
      await fetchData()
    } catch (error) {
      toast.error('Erro ao atualizar leilão')
    } finally {
      setIsLoading(false)
    }
  }
  
  // --- HELPERS VISUAIS (Ícones de Config) ---
  const renderStatusIcon = (fieldName: string, item?: AuctionItem) => {
    if (!item || !item.id) {
        return <XIcon className="h-3 w-3 text-red-500 absolute -top-1 -right-1 bg-white rounded-full border border-gray-100 shadow-sm" />
    }
    const enumType = ITEM_FIELD_ENUM_MAP[fieldName]
    const isConfigured = scrapingConfigs.some(c => c.itemId === item.id && c.fieldType === enumType)
    
    if (isConfigured) {
        return <Check className="h-3 w-3 text-blue-900 absolute -top-1 -right-1 bg-white rounded-full border border-gray-100 shadow-sm" />
    }
    return <XIcon className="h-3 w-3 text-red-900 absolute -top-1 -right-1 bg-white rounded-full border border-gray-100 shadow-sm" />
  }

  const renderCogButton = (fieldName: string, item?: AuctionItem) => (
    <div className="relative inline-block ml-3">
        <button type="button" className="text-gray-500 hover:text-gray-700 p-1 focus:outline-none" onClick={() => handleOpenTagModal(fieldName, item)}>
            <Cog className="h-4 w-4" />
        </button>
        {renderStatusIcon(fieldName, item)}
    </div>
  )

  // Estatísticas
  const totalItems = lots.reduce((acc, lot) => acc + (lot.items?.length || 0), 0)
  const availableItems = lots.reduce((acc, lot) => acc + (lot.items?.filter(item => item.status === 'AVAILABLE').length || 0), 0)
  const auctionStatus = getAuctionStatus()

  // --- RENDER ---

  if (isLoading && !auction) {
    return (
      <MainLayout>
        <Head><title>Carregando Leilão...</title></Head>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
             <div className="text-gray-500">Carregando detalhes do leilão...</div>
        </div>
      </MainLayout>
    )
  }

  if (!auction) {
    return (
      <MainLayout>
        <Head><title>Leilão não encontrado</title></Head>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
           <div className="text-red-500">Leilão não encontrado</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <Head>
        <title>Detalhes do Leilão - {auction.name}</title>
        <meta name="description" content={`Detalhes e gestão do leilão ${auction.name}`} />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">

          <div className="mb-6">
            <PageHeader
              title="Detalhes do Leilão"
              buttonText="Salvar Alterações"
              onButtonClick={handleSaveAuction}
              isLoading={isLoading}
              isDetailsPage={true}
            />
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className='bg-gray-50 border-gray-200 border rounded-lg p-6'>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className={`h-6 w-6 ${auctionStatus.color === 'green' ? 'text-green-600' : auctionStatus.color === 'blue' ? 'text-blue-600' : auctionStatus.color === 'red' ? 'text-red-600' : 'text-gray-600'}`} />
                    <div>
                      <h1 className={`text-2xl font-bold ${auctionStatus.color === 'green' ? 'text-green-900' : auctionStatus.color === 'blue' ? 'text-blue-900' : auctionStatus.color === 'red' ? 'text-red-900' : 'text-gray-900'}`}>
                        {auction.name}
                      </h1>
                      <p className={`text-sm ${auctionStatus.color === 'green' ? 'text-green-700' : auctionStatus.color === 'blue' ? 'text-blue-700' : auctionStatus.color === 'red' ? 'text-red-700' : 'text-gray-700'}`}>
                        Status: {auctionStatus.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="primary" onClick={handleEditAuction} disabled={isLoading}>
                      <Edit3 className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    {auction.isActive ? (
                      <Button variant="danger" onClick={() => setIsDeactivateModalOpen(true)} disabled={isLoading}>
                        <Trash2 className="h-4 w-4 mr-1" /> Desativar
                      </Button>
                    ) : (
                      <Button variant="primary" onClick={() => setIsActivateModalOpen(true)} disabled={isLoading}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Ativar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Tipo:</span>
                    <div className="font-semibold flex items-center text-gray-900">
                      {auction.type === 'ONLINE' ? <><Globe className="h-4 w-4 mr-1" /> Online</> : <><MapPin className="h-4 w-4 mr-1" /> Presencial</>}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Abertura:</span>
                    <div className="font-semibold text-gray-900">{formatDateTime(auction.openingDate)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Encerramento:</span>
                    <div className="font-semibold text-gray-900">{formatDateTime(auction.closingDate)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Itens:</span>
                    <div className="font-semibold text-gray-900">{availableItems} disponíveis / {totalItems} total</div>
                  </div>
                  {(auction.url) && (
                    <div>
                      <span className="font-medium truncate text-gray-700">{auction.type === 'ONLINE' ? 'URL:' : 'Local:'}</span>
                      <div className="font-semibold truncate text-gray-900">{auction.url}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <AuctionEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveAuctionEdit} auction={auction} isLoading={isLoading} />
            <ConfirmationModal isOpen={isDeactivateModalOpen} onClose={() => setIsDeactivateModalOpen(false)} onConfirm={handleConfirmToggleStatus} title="Desativar Leilão" message={`Tem certeza que deseja desativar o leilão "${auction?.name}"?`} confirmButtonText="Desativar" cancelButtonText="Cancelar" isLoading={isLoading} variant="danger" />
            <ConfirmationModal isOpen={isActivateModalOpen} onClose={() => setIsActivateModalOpen(false)} onConfirm={handleConfirmToggleStatus} title="Ativar Leilão" message={`Tem certeza que deseja ativar o leilão "${auction?.name}"?`} confirmButtonText="Ativar" cancelButtonText="Cancelar" isLoading={isLoading} variant="info" />

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Gerenciar Lotes</h3>
                </div>
                <Button onClick={handleAddLot} variant="add2" disabled={isLoading}>Adicionar Lote</Button>
              </div>
            </div>

            <div className="space-y-4">
              {lots.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                  <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Nenhum lote encontrado</h4>
                  <p className="text-sm text-gray-500">Este leilão ainda não possui lotes cadastrados.</p>
                </div>
              ) : (
                lots.map((lot) => (
                  <div key={lot.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button onClick={() => toggleLotExpansion(lot.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            {expandedLots.has(lot.id) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                          </button>
                          <FolderOpen className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{lot.identification}</h3>
                            <p className="text-sm text-gray-600">{lot.items?.length || 0} itens</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button onClick={() => handleAddItem(lot.id)} variant="add3" disabled={isLoading}>Adicionar Item</Button>
                          <button className="text-blue-600 hover:text-blue-800 p-1" onClick={() => handleEditLot(lot)}><Edit3 className="h-4 w-4" /></button>
                          <button className="text-red-600 hover:text-red-800 p-1" onClick={() => handleDeleteLot(lot.id)}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>

                    {expandedLots.has(lot.id) && (
                      <div className="overflow-x-auto">
                        {!lot.items || lot.items.length === 0 ? (
                          <div className="px-6 py-8 text-center">
                            <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Nenhum item encontrado</h4>
                            <p className="text-sm text-gray-500">Este lote ainda não possui itens cadastrados.</p>
                          </div>
                        ) : (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Base</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incremento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localização</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalhes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {lot.items.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()).map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900 truncate">{item.title}</div></td>
                                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center text-sm text-gray-900">{getItemTypeIcon(item.type)}<span className="ml-2">{getItemTypeLabel(item.type)}</span></div></td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatPrice(item.basePrice)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(item.increment)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.city || item.state ? <div className="space-y-1"><div>{item.city} - {item.state}</div>{item.zipCode && <div className="text-xs text-gray-400">CEP: {item.zipCode}</div>}</div> : <span className="text-gray-400">-</span>}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.propertyDetails ? <div>{item.propertyDetails.type}</div> : <span className="text-gray-400">-</span>}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex space-x-2">
                                      <button className="text-blue-600 hover:text-blue-800 transition-colors" onClick={() => handleEditItem(item)}><Edit3 className="h-4 w-4" /></button>
                                      <button className="text-red-600 hover:text-red-800 transition-colors" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <Transition appear show={isLotModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !isLoading && setIsLotModalOpen(false)}>
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/25" /></Transition.Child>
              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">{lotAction === 'create' ? 'Adicionar Lote' : 'Editar Lote'}</Dialog.Title>
                      <form onSubmit={e => { e.preventDefault(); handleSaveLot(new FormData(e.currentTarget)) }} className="space-y-4">
                        <div>
                          <label htmlFor="identification" className="block text-sm font-medium text-gray-700 mb-1">Identificação do Lote <span className="text-red-500">*</span></label>
                          <Input id="identification" name="identification" type="text" placeholder="Ex: Lote 001" defaultValue={editingLot?.identification} required disabled={isLoading} />
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                          <Button type="button" onClick={() => setIsLotModalOpen(false)} variant="neutral" disabled={isLoading}>Cancelar</Button>
                          <Button type="submit" variant={lotAction === 'create' ? 'add' : 'primary'} disabled={isLoading}>{lotAction === 'create' ? 'Adicionar Lote' : 'Atualizar Lote'}</Button>
                        </div>
                      </form>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>

          <Transition appear show={isItemModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !isLoading && setIsItemModalOpen(false)}>
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/25" /></Transition.Child>
              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                    <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">{itemAction === 'create' ? 'Adicionar Item ao Lote' : 'Editar Item do Lote'}</Dialog.Title>

                      <form onSubmit={e => { e.preventDefault(); handleSaveItem(new FormData(e.currentTarget)) }} className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-md font-medium text-gray-900">Informações Básicas</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título do Item <span className="text-red-500">*</span></label>
                                {renderCogButton('title', editingItem ?? undefined)}
                              </div>
                              <Input id="title" name="title" type="text" defaultValue={editingItem?.title} required disabled={isLoading} />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo do Item <span className="text-red-500">*</span></label>
                                {renderCogButton('itemType', editingItem ?? undefined)}
                              </div>
                              <select id="type" name="type" defaultValue={editingItem?.type || ''} required className="w-full border border-gray-300 text-gray-700 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors" disabled={isLoading} onChange={(e) => { const pd = document.getElementById('property-details'); if (pd) pd.style.display = e.target.value === 'IMOVEL' ? 'block' : 'none' }}>
                                <option value="">Selecione...</option>
                                <option value="IMOVEL">Imóvel</option>
                                <option value="VEICULO">Veículo</option>
                                <option value="OUTROS">Outros</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                              {renderCogButton('description', editingItem ?? undefined)}
                            </div>
                            <textarea id="description" name="description" rows={5} defaultValue={editingItem?.description} className="w-full border border-gray-300 text-gray-700 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors" disabled={isLoading} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">Preço Base (R$) <span className="text-red-500">*</span></label>
                                {renderCogButton('basePrice', editingItem ?? undefined)}
                              </div>
                              <Input id="basePrice" name="basePrice" type="number" step="0.01" min="0" defaultValue={editingItem?.basePrice.toString()} required disabled={isLoading} />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label htmlFor="increment" className="block text-sm font-medium text-gray-700">Incremento (R$) <span className="text-red-500">*</span></label>
                                {renderCogButton('increment', editingItem ?? undefined)}
                              </div>
                              <Input id="increment" name="increment" type="number" step="0.01" min="0" defaultValue={editingItem?.increment.toString()} required disabled={isLoading} />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-md font-medium text-gray-900">Localização</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado <span className="text-red-500">*</span></label>
                                  {renderCogButton('state', editingItem ?? undefined)}
                                </div>
                                <select id="state" name="state" value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedCity('') }} required className="w-full border border-gray-300 text-gray-700 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500" disabled={isLoading}>
                                  <option value="">Selecione...</option>
                                  {states.map((s) => (<option key={s.id} value={s.sigla}>{s.nome} ({s.sigla})</option>))}
                                </select>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade <span className="text-red-500">*</span></label>
                                  {renderCogButton('city', editingItem ?? undefined)}
                                </div>
                                <select id="city" name="city" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} required className="w-full border border-gray-300 text-gray-700 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500" disabled={isLoading || !selectedState}>
                                  <option value="">Selecione...</option>
                                  {cities.map((c) => (<option key={c.id} value={c.nome}>{c.nome}</option>))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Endereço</label>
                                {renderCogButton('location', editingItem ?? undefined)}
                              </div>
                              <textarea id="location" name="location" rows={3} defaultValue={editingItem?.location || ''} className="w-full border border-gray-300 text-gray-700 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none" disabled={isLoading} />
                            </div>
                            <div className="w-full md:w-1/2">
                              <div className="flex items-center justify-between mb-1">
                                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">CEP</label>
                                {renderCogButton('zipCode', editingItem ?? undefined)}
                              </div>
                              <Input id="zipCode" name="zipCode" type="text" defaultValue={editingItem?.zipCode || ''} disabled={isLoading} />
                            </div>
                          </div>

                          <div className="space-y-4" id="property-details" style={{ display: editingItem?.type === 'IMOVEL' ? 'block' : 'none' }}>
                            <h3 className="text-md font-medium text-gray-900 flex items-center"><Home className="h-5 w-5 mr-2" /> Detalhes do Imóvel</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">Tipo de Imóvel</label>
                                  {renderCogButton('propertyType', editingItem ?? undefined)}
                                </div>
                                <select id="propertyType" name="propertyType" className="w-full border border-gray-300 rounded-md text-gray-700 shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500" defaultValue={editingItem?.propertyDetails?.type || ''} disabled={isLoading}>
                                  <option value="">Selecione...</option>
                                  <option value="Casa">Casa</option>
                                  <option value="Apartamento">Apartamento</option>
                                  <option value="Terreno">Terreno</option>
                                  <option value="Comercial">Comercial</option>
                                  <option value="Galpão">Galpão</option>
                                  <option value="Outros">Outros</option>
                                </select>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label htmlFor="area" className="block text-sm font-medium text-gray-700">Área (m²)</label>
                                  {renderCogButton('area', editingItem ?? undefined)}
                                </div>
                                <Input id="area" name="area" type="number" step="0.01" min="0" defaultValue={editingItem?.propertyDetails?.area?.toString()} disabled={isLoading} />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">Quartos</label>
                                  {renderCogButton('bedrooms', editingItem ?? undefined)}
                                </div>
                                <Input id="bedrooms" name="bedrooms" type="number" min="0" defaultValue={editingItem?.propertyDetails?.bedrooms?.toString()} disabled={isLoading} />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label htmlFor="parkingSpots" className="block text-sm font-medium text-gray-700">Vagas</label>
                                  {renderCogButton('parkingSpots', editingItem ?? undefined)}
                                </div>
                                <Input id="parkingSpots" name="parkingSpots" type="number" min="0" defaultValue={editingItem?.propertyDetails?.parkingSpots?.toString()} disabled={isLoading} />
                              </div>
                            </div>
                          </div>

                          {itemAction === 'edit' && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status do Item</label>
                                {renderCogButton('status', editingItem ?? undefined)}
                              </div>
                              <select id="status" name="status" defaultValue={editingItem?.status} className="w-full border border-gray-300 rounded-md text-gray-700 shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors" disabled={isLoading}>
                                <option value="AVAILABLE">Disponível</option>
                                <option value="SOLD">Vendido</option>
                                <option value="CANCELLED">Cancelado</option>
                              </select>
                            </div>
                          )}

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-md font-medium text-gray-900 flex items-center"><Package className="h-5 w-5 mr-2" /> Links das Imagens</h3>
                              {renderCogButton('images', editingItem ?? undefined)}
                            </div>
                            <div id="image-links-container" className="space-y-2">
                              {(editingItem?.images || []).map((img, index) => (
                                <Input 
                                  key={index}
                                  id={`image-${index}`}
                                  type="text" 
                                  name="images" 
                                  defaultValue={typeof img === 'string' ? img : img.url} 
                                  disabled={isLoading} 
                                />
                              ))}
                              
                              <Input 
                                id="new-image-input" 
                                type="text" 
                                name="images" 
                                placeholder="https://exemplo.com/imagem.jpg" 
                                disabled={isLoading} 
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                              <Button type="button" onClick={() => setIsItemModalOpen(false)} variant="neutral" disabled={isLoading}>Cancelar</Button>
                              <Button type="submit" variant={itemAction === 'create' ? 'add' : 'primary'} disabled={isLoading}>{itemAction === 'create' ? 'Adicionar Item' : 'Atualizar Item'}</Button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>

          <TagConfigModal
            isOpen={isTagModalOpen}
            onClose={closeTagModal}
            onSave={handleSaveTag}
            fieldLabel={selectedTagField ? ITEM_FIELD_LABELS[selectedTagField] : ''}
            isLoading={isLoading}
            initialValue={getCurrentSelector()}
          />

        </div>
      </div>
    </MainLayout>
  )
}

export default withBackofficeAuth(AuctionDetailPage)
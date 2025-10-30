'use client'
import Head from 'next/head'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { getAuctionById, updateAuction, deleteAuction } from '@/services/auctionService'
import { getLotsByAuction, createLot, updateLot, deleteLot } from '@/services/lotService'
import { getAuctionItemsByLot, createAuctionItem, updateAuctionItem, deleteAuctionItem } from '@/services/auctionItemService'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { useRouter, useParams } from 'next/navigation'
import MainLayout from '@/layouts/MainLayout'
import { withBackofficeAuth } from '@/hooks/withBackofficeAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import AuctionEditModal from '../../../../components/backoffice/auctions/AuctionEditModal'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Globe,
  Plus,
  Edit3,
  Trash2,
  Home,
  Car,
  Package,
  FolderOpen,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

import { AuctionItem, AuctionType } from '@/types/auction'

// Types atualizados com a nova estrutura



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

  // Estados principais
  const [auction, setAuction] = useState<Auction | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set())
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)

  // Estados dos modais
  const [isLotModalOpen, setIsLotModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
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



  const handleEditAuction = () => {
    setIsEditModalOpen(true)
  }
  const handleSaveAuctionEdit = async (auctionData: any) => {
    if (!auctionId) return

    setIsLoading(true)
    try {
      const updatedAuction = await updateAuction(auctionId, auctionData)
      setAuction(updatedAuction)
      toast.success('Leilão atualizado com sucesso!')
      setIsEditModalOpen(false)
      await fetchData() // Recarregar dados
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
      const action = auction.isActive ? 'desativar' : 'ativar'

      if (auction.isActive) {
        // Desativar leilão
        await deleteAuction(auctionId)
        toast.success('Leilão desativado com sucesso!')
      } else {
        // Ativar leilão - assumindo que existe uma função para ativar
        await updateAuction(auctionId, { isActive: true })
        toast.success('Leilão ativado com sucesso!')
      }

      // Fechar o modal apropriado
      setIsDeactivateModalOpen(false)
      setIsActivateModalOpen(false)

      // Recarregar dados para atualizar o estado
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

  // Função para carregar dados
  const fetchData = useCallback(async () => {
    if (!auctionId) return

    setIsLoading(true)
    try {
      const [auctionData, lotsData] = await Promise.all([
        getAuctionById(auctionId),
        getLotsByAuction(auctionId)
      ])

      setAuction(auctionData)
      setLots(lotsData)

      // Expandir todos os lotes por padrão
      const lotIds = lotsData.map((lot: Lot) => lot.id)
      setExpandedLots(new Set(lotIds))

    } catch (error) {
      toast.error('Erro ao carregar detalhes do leilão')
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }, [auctionId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Funções de formatação
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Função para obter status do leilão
  const getAuctionStatus = () => {
    if (!auction) return { status: 'unknown', label: 'Carregando...', color: 'gray' }

    // Primeiro verificar se está ativo
    if (!auction.isActive) {
      return { status: 'inactive', label: 'Inativo', color: 'red' }
    }

    const now = new Date()
    const opening = new Date(auction.openingDate)
    const closing = new Date(auction.closingDate)

    if (now < opening) {
      return { status: 'scheduled', label: 'Programado', color: 'blue' }
    }

    if (now >= opening && now <= closing) {
      return { status: 'active', label: 'Em Andamento', color: 'green' }
    }

    return { status: 'closed', label: 'Encerrado', color: 'gray' }
  }

  // Funções para obter ícones e labels
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

  // Funções para expandir/colapsar lotes
  const toggleLotExpansion = (lotId: string) => {
    setExpandedLots(prev => {
      const newSet = new Set(prev)
      if (newSet.has(lotId)) {
        newSet.delete(lotId)
      } else {
        newSet.add(lotId)
      }
      return newSet
    })
  }

  // Handlers para lotes
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
      const lotData = {
        auctionId,
        identification: formData.get('identification') as string
      }

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
      console.error('Erro ao salvar lote:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLot = async (lotId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.')) {
      return
    }

    setIsLoading(true)
    try {
      await deleteLot(lotId)
      toast.success('Lote excluído com sucesso!')
      await fetchData()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Erro ao excluir lote'
      toast.error(errorMessage)
      console.error('Erro ao excluir lote:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handlers para itens
  const handleAddItem = (lotId: string) => {
    setSelectedLotId(lotId)
    setEditingItem(null)
    setItemAction('create')
    setIsItemModalOpen(true)
  }

  const handleEditItem = (item: AuctionItem) => {
    setSelectedLotId(item.lotId)
    setEditingItem(item)
    setItemAction('edit')
    setIsItemModalOpen(true)
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

      if (itemAction === 'edit' && editingItem) {
        await updateAuctionItem(editingItem.id, itemData)
        toast.success('Item atualizado com sucesso!')
      } else {
        await createAuctionItem(itemData)
        toast.success('Item criado com sucesso!')
      }

      setIsItemModalOpen(false)
      await fetchData()
    } catch (error) {
      toast.error('Erro ao salvar item')
      console.error('Erro ao salvar item:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este item?')) {
      return
    }

    setIsLoading(true)
    try {
      await deleteAuctionItem(itemId)
      toast.success('Item cancelado com sucesso!')
      await fetchData()
    } catch (error) {
      toast.error('Erro ao cancelar item')
      console.error('Erro ao cancelar item:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handler para salvar leilão
  const handleSaveAuction = async () => {
    if (!auction || !auctionId) return

    setIsLoading(true)
    try {
      await updateAuction(auctionId, {
        ...auction,
        type: auction.type as AuctionType,
        updatedBy: 'system',
      })

      toast.success('Leilão atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar leilão')
    } finally {
      setIsLoading(false)
    }
  }
  // Calcular estatísticas
  const totalItems = lots.reduce((acc, lot) => acc + (lot.items?.length || 0), 0)
  const availableItems = lots.reduce((acc, lot) =>
    acc + (lot.items?.filter(item => item.status === 'AVAILABLE').length || 0), 0
  )
  const soldItems = lots.reduce((acc, lot) =>
    acc + (lot.items?.filter(item => item.status === 'SOLD').length || 0), 0
  )

  const auctionStatus = getAuctionStatus()

  if (isLoading && !auction) {
    return (
      <MainLayout>
        <Head>
          <title>Carregando Leilão...</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Carregando detalhes do leilão...</div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!auction) {
    return (
      <MainLayout>
        <Head>
          <title>Leilão não encontrado</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">Leilão não encontrado</div>
            </div>
          </div>
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

          {/* Header da página */}
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
            {/* Status Atual do Leilão */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className='bg-gray-50 border-gray-200 border rounded-lg p-6'>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className={`h-6 w-6 ${auctionStatus.color === 'green' ? 'text-green-600' :
                      auctionStatus.color === 'blue' ? 'text-blue-600' :
                        auctionStatus.color === 'red' ? 'text-red-600' :
                          'text-gray-600'
                      }`} />
                    <div>
                      <h1 className={`text-2xl font-bold ${auctionStatus.color === 'green' ? 'text-green-900' :
                        auctionStatus.color === 'blue' ? 'text-blue-900' :
                          auctionStatus.color === 'red' ? 'text-red-900' :
                            'text-gray-900'
                        }`}>
                        {auction.name}
                      </h1>
                      <p className={`text-sm ${auctionStatus.color === 'green' ? 'text-green-700' :
                        auctionStatus.color === 'blue' ? 'text-blue-700' :
                          auctionStatus.color === 'red' ? 'text-red-700' :
                            'text-gray-700'
                        }`}>
                        Status: {auctionStatus.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      onClick={handleEditAuction}
                      disabled={isLoading}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>

                    {/* Botão condicional baseado no status isActive */}
                    {auction.isActive ? (
                      <Button
                        variant="danger"
                        onClick={() => setIsDeactivateModalOpen(true)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Desativar
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => setIsActivateModalOpen(true)}
                        disabled={isLoading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Ativar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${auctionStatus.color === 'green' ? 'text-green-700' :
                      auctionStatus.color === 'blue' ? 'text-blue-700' :
                        auctionStatus.color === 'red' ? 'text-red-700' :
                          'text-gray-700'
                      }`}>Tipo:</span>
                    <div className={`font-semibold flex items-center ${auctionStatus.color === 'green' ? 'text-green-900' :
                      auctionStatus.color === 'blue' ? 'text-blue-900' :
                        auctionStatus.color === 'red' ? 'text-red-900' :
                          'text-gray-900'
                      }`}>
                      {auction.type === 'ONLINE' ? (
                        <>
                          <Globe className="h-4 w-4 mr-1" />
                          Online
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-1" />
                          Presencial
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className={`font-medium ${auctionStatus.color === 'green' ? 'text-green-700' :
                      auctionStatus.color === 'blue' ? 'text-blue-700' :
                        auctionStatus.color === 'red' ? 'text-red-700' :
                          'text-gray-700'
                      }`}>Abertura:</span>
                    <div className={`font-semibold ${auctionStatus.color === 'green' ? 'text-green-900' :
                      auctionStatus.color === 'blue' ? 'text-blue-900' :
                        auctionStatus.color === 'red' ? 'text-red-900' :
                          'text-gray-900'
                      }`}>
                      {formatDateTime(auction.openingDate)}
                    </div>
                  </div>
                  <div>
                    <span className={`font-medium ${auctionStatus.color === 'green' ? 'text-green-700' :
                      auctionStatus.color === 'blue' ? 'text-blue-700' :
                        auctionStatus.color === 'red' ? 'text-red-700' :
                          'text-gray-700'
                      }`}>Encerramento:</span>
                    <div className={`font-semibold ${auctionStatus.color === 'green' ? 'text-green-900' :
                      auctionStatus.color === 'blue' ? 'text-blue-900' :
                        auctionStatus.color === 'red' ? 'text-red-900' :
                          'text-gray-900'
                      }`}>
                      {formatDateTime(auction.closingDate)}
                    </div>
                  </div>
                  <div>
                    <span className={`font-medium ${auctionStatus.color === 'green' ? 'text-green-700' :
                      auctionStatus.color === 'blue' ? 'text-blue-700' :
                        auctionStatus.color === 'red' ? 'text-red-700' :
                          'text-gray-700'
                      }`}>Itens:</span>
                    <div className={`font-semibold ${auctionStatus.color === 'green' ? 'text-green-900' :
                      auctionStatus.color === 'blue' ? 'text-blue-900' :
                        auctionStatus.color === 'red' ? 'text-red-900' :
                          'text-gray-900'
                      }`}>
                      {availableItems} disponíveis / {totalItems} total
                    </div>
                  </div>


                  {(auction.url) && (
                    <div>
                      <span className={`font-medium truncate ${auctionStatus.color === 'green' ? 'text-green-700' :
                        auctionStatus.color === 'blue' ? 'text-blue-700' :
                          auctionStatus.color === 'red' ? 'text-red-700' :
                            'text-gray-700'
                        }`}>
                        {auction.type === 'ONLINE' ? 'URL:' : 'Local:'}
                      </span>
                      <div className={`font-semibold truncate ${auctionStatus.color === 'green' ? 'text-green-900' :
                        auctionStatus.color === 'blue' ? 'text-blue-900' :
                          auctionStatus.color === 'red' ? 'text-red-900' :
                            'text-gray-900'
                        }`}>
                        {auction.url}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal de Edição do Leilão */}
            <AuctionEditModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleSaveAuctionEdit}
              auction={auction}
              isLoading={isLoading}
            />

            {/* Modal de Confirmação para Desativar */}
            <ConfirmationModal
              isOpen={isDeactivateModalOpen}
              onClose={() => setIsDeactivateModalOpen(false)}
              onConfirm={handleConfirmToggleStatus}
              title="Desativar Leilão"
              message={`Tem certeza que deseja desativar o leilão "${auction?.name}"? Esta ação pode ser revertida posteriormente.`}
              confirmButtonText="Desativar"
              cancelButtonText="Cancelar"
              isLoading={isLoading}
              variant="danger"
            />

            {/* Modal de Confirmação para Ativar */}
            <ConfirmationModal
              isOpen={isActivateModalOpen}
              onClose={() => setIsActivateModalOpen(false)}
              onConfirm={handleConfirmToggleStatus}
              title="Ativar Leilão"
              message={`Tem certeza que deseja ativar o leilão "${auction?.name}"? O leilão ficará disponível para participação.`}
              confirmButtonText="Ativar"
              cancelButtonText="Cancelar"
              isLoading={isLoading}
              variant="info"
            />

            {/* Gerenciar Lotes */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Gerenciar Lotes</h3>
                </div>
                <Button
                  onClick={handleAddLot}
                  variant="add2"
                  disabled={isLoading}
                >
                  Adicionar Lote
                </Button>
              </div>
            </div>

            {/* Lista de Lotes e Itens */}
            <div className="space-y-4">
              {lots.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                  <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Nenhum lote encontrado</h4>
                  <p className="text-sm text-gray-500">
                    Este leilão ainda não possui lotes cadastrados.
                  </p>
                </div>
              ) : (
                lots.map((lot) => (
                  <div key={lot.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    {/* Header do Lote */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleLotExpansion(lot.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {expandedLots.has(lot.id) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                          <FolderOpen className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {lot.identification}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {lot.items?.length || 0} itens
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => handleAddItem(lot.id)}
                            variant="add3"
                            disabled={isLoading}
                          >
                            Adicionar Item
                          </Button>
                          <button
                            className="text-blue-600 hover:text-blue-800 p-1"
                            onClick={() => handleEditLot(lot)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 p-1"
                            onClick={() => handleDeleteLot(lot.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Itens do Lote */}
                    {expandedLots.has(lot.id) && (
                      <div className="overflow-x-auto">
                        {!lot.items || lot.items.length === 0 ? (
                          <div className="px-6 py-8 text-center">
                            <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Nenhum item encontrado</h4>
                            <p className="text-sm text-gray-500">
                              Este lote ainda não possui itens cadastrados.
                            </p>
                          </div>
                        ) : (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Item
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Preço Base
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Incremento
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Localização
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Detalhes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {lot.items
                                .sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime())
                                .map((item) => (
                                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {item.title}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center text-sm text-gray-900">
                                        {getItemTypeIcon(item.type)}
                                        <span className="ml-2">{getItemTypeLabel(item.type)}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {formatPrice(item.basePrice)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatPrice(item.increment)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {item.city || item.state || item.location ? (
                                        <div className="space-y-1">
                                          <div>{item.city} - {item.state}</div>
                                          {item.location && <div className="text-xs">{item.location}</div>}
                                          {item.zipCode && <div className="text-xs text-gray-400">CEP: {item.zipCode}</div>}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {getStatusBadge(item.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {item.propertyDetails ? (
                                        <div className="space-y-1">
                                          <div>{item.propertyDetails.type}</div>
                                          {item.propertyDetails.bedrooms && (
                                            <div className="text-xs">{item.propertyDetails.bedrooms} quartos</div>
                                          )}
                                          {item.propertyDetails.area && (
                                            <div className="text-xs">{item.propertyDetails.area} m²</div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <div className="flex space-x-2">
                                        <button
                                          className="text-blue-600 hover:text-blue-800 transition-colors"
                                          onClick={() => handleEditItem(item)}
                                        >
                                          <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                          className="text-red-600 hover:text-red-800 transition-colors"
                                          onClick={() => handleDeleteItem(item.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
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

          {/* Modal Create/Edit Lote */}
          {isLotModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {lotAction === 'create' ? 'Adicionar Lote' : 'Editar Lote'}
                  </h2>
                </div>

                <form onSubmit={e => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  handleSaveLot(formData)
                }} className="p-6 space-y-4">

                  <div>
                    <label htmlFor="identification" className="block text-sm font-medium text-gray-700 mb-1">
                      Identificação do Lote *
                    </label>
                    <Input
                      id="identification"
                      name="identification"
                      type="text"
                      placeholder="Ex: Lote 001, Lote A, etc."
                      defaultValue={editingLot?.identification}
                      required
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Esta identificação aparecerá nos editais e poderá ser usada para filtros.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      onClick={() => setIsLotModalOpen(false)}
                      variant="neutral"
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>

                    <Button
                      type="submit"
                      variant={lotAction === 'create' ? 'add' : 'primary'}
                      disabled={isLoading}
                    >
                      {lotAction === 'create' ? 'Adicionar Lote' : 'Atualizar Lote'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Create/Edit Item */}
          {isItemModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {itemAction === 'create' ? 'Adicionar Item ao Lote' : 'Editar Item do Lote'}
                  </h2>
                </div>

                <form onSubmit={e => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  handleSaveItem(formData)
                }} className="p-6 space-y-6">

                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-900">Informações Básicas</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                          Título do Item *
                        </label>
                        <Input
                          id="title"
                          name="title"
                          type="text"
                          placeholder="Ex: Casa no Centro da Cidade"
                          defaultValue={editingItem?.title}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo do Item *
                        </label>
                        <select
                          id="type"
                          name="type"
                          defaultValue={editingItem?.type || ''}
                          required
                          className="w-full border border-gray-300 text-gray-700 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                          disabled={isLoading}
                          onChange={(e) => {
                            const propertyDetails = document.getElementById('property-details')
                            if (propertyDetails) {
                              propertyDetails.style.display = e.target.value === 'IMOVEL' ? 'block' : 'none'
                            }
                          }}
                        >
                          <option value="">Selecione o tipo...</option>
                          <option value="IMOVEL">Imóvel</option>
                          <option value="VEICULO">Veículo</option>
                          <option value="OUTROS">Outros</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={5}
                        placeholder="Descreva detalhes importantes sobre o item..."
                        defaultValue={editingItem?.description}
                        className="w-full border border-gray-300 text-gray-700 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-1">
                          Preço Base (R$) *
                        </label>
                        <Input
                          id="basePrice"
                          name="basePrice"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          defaultValue={editingItem?.basePrice.toString()}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label htmlFor="increment" className="block text-sm font-medium text-gray-700 mb-1">
                          Incremento Mínimo (R$) *
                        </label>
                        <Input
                          id="increment"
                          name="increment"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          defaultValue={editingItem?.increment.toString()}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Localização */}
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-gray-900">Localização do Item</h3>

                      {/* Estado e Cidade na mesma linha */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                            Estado *
                          </label>
                          <select
                            id="state"
                            name="state"
                            value={selectedState}
                            onChange={(e) => {
                              setSelectedState(e.target.value)
                              setSelectedCity('')
                            }}
                            required
                            className="w-full border border-gray-300 text-gray-700 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                            disabled={isLoading}
                          >
                            <option value="">Selecione um estado...</option>
                            {states.map((state) => (
                              <option key={state.id} value={state.sigla}>
                                {state.nome} ({state.sigla})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                            Cidade *
                          </label>
                          <select
                            id="city"
                            name="city"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            required
                            className="w-full border border-gray-300 text-gray-700 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                            disabled={isLoading || !selectedState}
                          >
                            <option value="">Selecione uma cidade...</option>
                            {cities.map((city) => (
                              <option key={city.id} value={city.nome}>
                                {city.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Endereço maior */}
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                          Endereço
                        </label>
                        <textarea
                          id="location"
                          name="location"
                          rows={3}
                          placeholder="Rua, número, bairro, complemento..."
                          defaultValue={editingItem?.location || ''}
                          className="w-full border border-gray-300 text-gray-700 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
                          disabled={isLoading}
                        />
                      </div>

                      {/* CEP abaixo, menor */}
                      <div className="w-full md:w-1/2">
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                          CEP
                        </label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          type="text"
                          placeholder="Ex: 90000-000"
                          defaultValue={editingItem?.zipCode || ''}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>


                  {/* Detalhes do Imóvel - só aparece se type === IMOVEL */}
                  <div
                    className="space-y-4"
                    id="property-details"
                    style={{ display: editingItem?.type === 'IMOVEL' ? 'block' : 'none' }}
                  >
                    <h3 className="text-md font-medium text-gray-900 flex items-center">
                      <Home className="h-5 w-5 mr-2" />
                      Detalhes do Imóvel
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Imóvel
                        </label>
                        <select
                          id="propertyType"
                          name="propertyType"
                          className="w-full border border-gray-300 rounded-md text-gray-700 shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                          defaultValue={editingItem?.propertyDetails?.type || ''}
                          disabled={isLoading}
                        >
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
                        <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                          Área (m²)
                        </label>
                        <Input
                          id="area"
                          name="area"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          defaultValue={editingItem?.propertyDetails?.area?.toString()}
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                          Quartos
                        </label>
                        <Input
                          id="bedrooms"
                          name="bedrooms"
                          type="number"
                          min="0"
                          placeholder="0"
                          defaultValue={editingItem?.propertyDetails?.bedrooms?.toString()}
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label htmlFor="parkingSpots" className="block text-sm font-medium text-gray-700 mb-1">
                          Vagas de Garagem
                        </label>
                        <Input
                          id="parkingSpots"
                          name="parkingSpots"
                          type="number"
                          min="0"
                          placeholder="0"
                          defaultValue={editingItem?.propertyDetails?.parkingSpots?.toString()}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  {itemAction === 'edit' && (
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status do Item
                      </label>
                      <select
                        id="status"
                        name="status"
                        defaultValue={editingItem?.status}
                        className="w-full border border-gray-300 rounded-md text-gray-700 shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                        disabled={isLoading}
                      >
                        <option value="AVAILABLE">Disponível</option>
                        <option value="SOLD">Vendido</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      onClick={() => setIsItemModalOpen(false)}
                      variant="neutral"
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>

                    <Button
                      type="submit"
                      variant={itemAction === 'create' ? 'add' : 'primary'}
                      disabled={isLoading}
                    >
                      {itemAction === 'create' ? 'Adicionar Item' : 'Atualizar Item'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default withBackofficeAuth(AuctionDetailPage)
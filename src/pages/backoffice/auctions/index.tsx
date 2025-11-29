'use client'

import Head from 'next/head'
import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Dialog, Transition } from '@headlessui/react'
import MainLayout from '@/layouts/MainLayout'
import { withBackofficeAuth } from '@/hooks/withBackofficeAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { ActionButton } from '@/components/shared/ActionButton'
import { usePagedData } from '@/hooks/usePagedData'
import { getAuctions, createAuction } from '@/services/auctionService'
import { SearchBar } from '@/components/shared/SearchBar'
import { useDynamicTitle } from '@/hooks/useDynamicTitle'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { Cog, Check, X as XIcon } from 'lucide-react'
import { Auction, CreateAuctionData, AuctionType } from '@/types/auction'
import { useTagModal } from '../../../hooks/useTagModel'
import TagConfigModal from '@/components/shared/TagConfigModal'
import { saveScrapingConfig } from '@/services/scrapingConfigService'

const AUCTION_FIELD_LABELS: Record<string, string> = {
  name: 'Nome do Leilão',
  type: 'Tipo do Leilão',
  url: 'URL',
  openingDate: 'Data/Hora de Abertura',
  closingDate: 'Data/Hora de Encerramento'
}

function AuctionsAdminPage() {
  useDynamicTitle()
  const router = useRouter()

  const [auctions, setAuctions] = useState<Auction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [pendingTags, setPendingTags] = useState<Record<string, string>>({})

  const { isOpen: isTagModalOpen, selectedField: selectedTagField, openTagModal, closeTagModal } = useTagModal()

  const [newAuction, setNewAuction] = useState<CreateAuctionData>({
    name: '',
    type: AuctionType.ONLINE,
    url: '',
    openingDate: '',
    closingDate: '',
    createdBy: 'system',
  })

  const filtered = auctions.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()))
  const { currentPage, totalPages, paginatedData, goToPage, resetToFirstPage } = usePagedData(filtered, 10)

  async function loadAuctions() {
    setIsLoading(true)
    try {
      const data = await getAuctions()
      setAuctions(data)
      resetToFirstPage()
    } catch { toast.error('Erro ao carregar leilões.') } finally { setIsLoading(false) }
  }

  useEffect(() => { loadAuctions() }, [])

  function formatDate(dateString: string) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'type', header: 'Tipo' },
    { key: 'openingDate', header: 'Abertura', render: (value: any) => formatDate(value) },
    { key: 'closingDate', header: 'Encerramento', render: (value: any) => formatDate(value) },
    { key: 'actions', header: 'Ações', render: (_: unknown, auction: Auction) => (<div className="flex space-x-4"><ActionButton variant="view" onClick={() => handleView(auction)} disabled={isLoading} /></div>) },
  ]

  function handleNewAuction() {
    setNewAuction({ name: '', type: AuctionType.ONLINE, url: '', openingDate: '', closingDate: '', createdBy: 'system' })
    setPendingTags({})
    setIsOpenModal(true)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // 🔹 Validação Manual de Datas (Criação)
    if (!newAuction.openingDate) {
        toast.warning('A Data de Abertura é obrigatória.')
        return
    }
    if (!newAuction.closingDate) {
        toast.warning('A Data de Encerramento é obrigatória.')
        return
    }
    if (new Date(newAuction.openingDate) > new Date(newAuction.closingDate)) {
        toast.warning('A Data de Abertura não pode ser maior que Data de Encerramento.')
        return
    }

    setIsLoading(true)
    try {
      const createdAuction = await createAuction(newAuction)
      if (createdAuction && createdAuction.id && Object.keys(pendingTags).length > 0) {
        await Promise.all(Object.entries(pendingTags).map(([fieldName, selector]) => saveScrapingConfig({ auctionId: createdAuction.id, fieldName, selector, itemId: null })))
      }
      toast.success('Leilão criado com sucesso!')
      setIsOpenModal(false)
      loadAuctions()
    } catch (error) { console.error(error); toast.error('Erro ao salvar leilão.') } finally { setIsLoading(false) }
  }

  const handleSaveTag = (tagValue: string) => {
    if (!selectedTagField) return
    if (!tagValue || tagValue.trim() === '') {
        setPendingTags(prev => { const newState = { ...prev }; delete newState[selectedTagField]; return newState })
    } else {
        setPendingTags(prev => ({ ...prev, [selectedTagField]: tagValue }))
        toast.success(`Tag para "${AUCTION_FIELD_LABELS[selectedTagField]}" salva com sucesso!`)
    }
    closeTagModal()
  }

  const getCurrentSelector = () => (selectedTagField ? pendingTags[selectedTagField] || '' : '')

  const renderStatusIcon = (fieldName: string) => {
      const isConfigured = !!pendingTags[fieldName]
      if (isConfigured) return <Check className="h-3 w-3 text-green-600 absolute -top-1 -right-1 bg-white rounded-full border border-gray-100 shadow-sm" />
      return <XIcon className="h-3 w-3 text-red-500 absolute -top-1 -right-1 bg-white rounded-full border border-gray-100 shadow-sm" />
  }

  const renderCogButton = (fieldName: string) => (
      <div className="relative inline-block ml-3">
          <button type="button" className="text-gray-500 hover:text-gray-700 p-1 focus:outline-none" onClick={() => openTagModal(fieldName)}><Cog className="h-4 w-4" /></button>
          {renderStatusIcon(fieldName)}
      </div>
  )

  function handleView(auction: Auction) { router.push(`/backoffice/auctions/${auction.id}`) }

  return (
    <MainLayout>
      <Head><title>Gerenciamento de Leilões - Leiloom</title></Head>
      <div className="min-h-screen flex justify-center bg-gray-50">
        <div className="mx-auto py-4 px-4 w-full max-w-none">
          <PageHeader title="Gerenciamento de Leilões" buttonText="Novo Leilão" onButtonClick={handleNewAuction} isLoading={isLoading} />
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b px-6 py-4"><p className="text-sm text-gray-500">Gerencie os leilões cadastrados na plataforma.</p></div>
            <div className="flex items-center justify-between p-6 border-b"><SearchBar value={search} onChange={setSearch} placeholder="Pesquisar por nome, tipo ou local" /></div>
            <DataTable data={paginatedData} columns={columns as any} currentPage={currentPage} totalPages={totalPages} itemsPerPage={10} onPageChange={goToPage} isLoading={isLoading} emptyStateTitle="Nenhum leilão cadastrado." onCreateFirst={handleNewAuction} createFirstText="Criar o primeiro leilão" />
          </div>
        </div>

        <Transition appear show={isOpenModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => !isLoading && setIsOpenModal(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/25" /></Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">Novo Leilão</Dialog.Title>
                    <form onSubmit={handleSave} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1"><label className="block text-sm font-medium text-gray-700">Nome do Leilão <span className="text-red-500">*</span></label>{renderCogButton('name')}</div>
                        <Input id="name" name="name" type="text" required value={newAuction.name} onChange={(e) => setNewAuction({ ...newAuction, name: e.target.value })} disabled={isLoading} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1"><label className="block text-sm font-medium text-gray-700">Tipo do Leilão</label>{renderCogButton('type')}</div>
                        <select value={newAuction.type} onChange={(e) => setNewAuction({ ...newAuction, type: e.target.value as AuctionType })} className="w-full border text-gray-700 border-gray-300 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500" disabled={isLoading}>
                          <option value={AuctionType.ONLINE}>Online</option><option value={AuctionType.LOCAL}>Presencial</option>
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1"><label className="block text-sm font-medium text-gray-700">URL</label>{renderCogButton('url')}</div>
                        <Input id="url" name="url" type="text" value={newAuction.url} onChange={(e) => setNewAuction({ ...newAuction, url: e.target.value })} disabled={isLoading} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1"><label className="block text-sm font-medium text-gray-700">Data de Abertura <span className="text-red-500">*</span></label>{renderCogButton('openingDate')}</div>
                          <Input id="openingDate" name="openingDate" type="datetime-local" value={newAuction.openingDate} onChange={(e) => setNewAuction({ ...newAuction, openingDate: e.target.value })} disabled={isLoading} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1"><label className="block text-sm font-medium text-gray-700">Data de Encerramento <span className="text-red-500">*</span></label>{renderCogButton('closingDate')}</div>
                          <Input id="closingDate" name="closingDate" type="datetime-local" value={newAuction.closingDate} onChange={(e) => setNewAuction({ ...newAuction, closingDate: e.target.value })} disabled={isLoading} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="neutral" onClick={() => setIsOpenModal(false)} disabled={isLoading}>Cancelar</Button>
                        <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
        <TagConfigModal isOpen={isTagModalOpen} onClose={closeTagModal} onSave={handleSaveTag} fieldLabel={selectedTagField ? AUCTION_FIELD_LABELS[selectedTagField] : ''} isLoading={isLoading} initialValue={getCurrentSelector()} />
      </div>
    </MainLayout>
  )
}

export default withBackofficeAuth(AuctionsAdminPage)
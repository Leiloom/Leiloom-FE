'use client'
import Head from 'next/head'
import { useEffect, useState, Fragment } from 'react'
import { toast } from 'react-toastify'
import { Dialog, Transition } from '@headlessui/react'
import MainLayout from '@/layouts/MainLayout'
import { withBackofficeAuth } from '@/hooks/withBackofficeAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ActionButton } from '@/components/shared/ActionButton'
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { usePagedData } from '@/hooks/usePagedData'
import { getAuctionSources, createAuctionSource, updateAuctionSource, deleteAuctionSource } from '@/services/auctionSourceService'
import { SearchBar } from '@/components/shared/SearchBar'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { AuctionSource } from '@/types/auction'

function AuctionSourcesAdminPage() {
  const [sources, setSources] = useState<AuctionSource[]>([])
  const [editingSource, setEditingSource] = useState<AuctionSource | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [currentAction, setCurrentAction] = useState<'create' | 'edit'>('create')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [sourceToDelete, setSourceToDelete] = useState<AuctionSource | null>(null)
  const [search, setSearch] = useState('')

  const filtered = sources.filter(source =>
    `${source.name} ${source.url}`.toLowerCase().includes(search.toLowerCase())
  )
  const { currentPage, totalPages, paginatedData, goToPage, resetToFirstPage } = usePagedData(filtered, 10)

  async function loadSources() {
    setIsLoading(true)
    try {
      const data = await getAuctionSources()
      setSources(data)
      resetToFirstPage()
    } catch {
      toast.error('Erro ao carregar as fontes de leilão.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadSources() }, [])

  function handleNewSource() {
    setEditingSource(null)
    setCurrentAction('create')
    setIsOpenModal(true)
  }

  function handleEditSource(source: AuctionSource) {
    setEditingSource(source)
    setCurrentAction('edit')
    setIsOpenModal(true)
  }

  async function handleSave(data: Omit<AuctionSource, 'id'>) {
    setIsLoading(true)
    try {
      if (editingSource?.id) {
        await updateAuctionSource(editingSource.id, data)
        toast.success('Fonte de leilão atualizada com sucesso!')
      } else {
        await createAuctionSource(data)
        toast.success('Fonte de leilão criada com sucesso!')
      }
      setIsOpenModal(false)
      loadSources()
    } catch {
      toast.error('Erro ao salvar a fonte de leilão.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleDeleteConfirmation(source: AuctionSource) {
    setSourceToDelete(source)
    setIsDeleteModalOpen(true)
  }

  async function handleDeleteSource() {
    if (!sourceToDelete?.id) return
    setIsLoading(true)
    try {
      await deleteAuctionSource(sourceToDelete.id)
      toast.success('Fonte de leilão inativada com sucesso!')
      setIsDeleteModalOpen(false)
      loadSources()
    } catch {
      toast.error('Erro ao inativar a fonte de leilão.')
    } finally {
      setIsLoading(false)
    }
  }

  const columns = [
    { key: 'name', header: 'Nome' },
    {
      key: 'url', header: 'URL', render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{url}</a>
      )
    },
    {
      key: 'isActive', header: 'Situação', render: (active: boolean) => (
        <StatusBadge variant={active ? 'success' : 'error'}>{active ? 'Ativa' : 'Inativa'}</StatusBadge>
      )
    },
    {
      key: 'actions', header: 'Ações', render: (_: unknown, source: AuctionSource) => (
        <div className="flex space-x-4">
          <ActionButton variant="edit" onClick={() => handleEditSource(source)} disabled={isLoading} />
          <ActionButton variant="delete" onClick={() => handleDeleteConfirmation(source)} disabled={isLoading} />
        </div>
      )
    },
  ]

  return (
    <MainLayout>
      <Head>
        <title>Fontes de Leilão - Leiloom</title>
        <meta name="description" content="Gerencie os sites de origem dos leilões cadastrados na plataforma" />
      </Head>
      <div className="min-h-screen flex justify-center bg-gray-50">
        <div className="mx-auto py-4 px-4 w-full max-w-none">
          <PageHeader title="Fontes de Leilão" buttonText="Nova Fonte" onButtonClick={handleNewSource} isLoading={isLoading} />
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b px-6 py-4">
              <p className="text-sm text-gray-500">Cadastre os sites de origem (fontes) de onde os leilões são obtidos, antes de vinculá-los aos leilões.</p>
            </div>
            <div className="flex items-center justify-between p-6 border-b">
              <SearchBar value={search} onChange={setSearch} placeholder="Pesquisar por nome ou URL" />
            </div>
            <DataTable
              data={paginatedData}
              columns={columns as any}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={10}
              onPageChange={goToPage}
              isLoading={isLoading}
              emptyStateTitle="Nenhuma fonte de leilão cadastrada."
              onCreateFirst={handleNewSource}
              createFirstText="Criar a primeira fonte"
            />
          </div>
        </div>

        <Transition appear show={isOpenModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => !isLoading && setIsOpenModal(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black/25" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                      {currentAction === 'create' ? 'Nova Fonte de Leilão' : 'Editar Fonte de Leilão'}
                    </Dialog.Title>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        const data = new FormData(e.currentTarget)
                        handleSave({
                          name: data.get('name') as string,
                          url: data.get('url') as string,
                          isActive: data.get('isActive') === 'on',
                        })
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome da Fonte <span className="text-red-500">*</span></label>
                        <Input id="name" name="name" type="text" required placeholder="Ex.: Santo André Leilões" defaultValue={editingSource?.name || ''} disabled={isLoading} />
                      </div>
                      <div>
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">URL <span className="text-red-500">*</span></label>
                        <Input id="url" name="url" type="text" required placeholder="https://www.exemplo.com.br" defaultValue={editingSource?.url || ''} disabled={isLoading} />
                      </div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="isActive"
                            type="checkbox"
                            name="isActive"
                            defaultChecked={editingSource?.isActive ?? true}
                            disabled={isLoading}
                            className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="isActive" className="font-medium text-gray-700">Ativa</label>
                          <p className="text-gray-500">Define se a fonte fica disponível para seleção ao cadastrar um leilão.</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="neutral" onClick={() => setIsOpenModal(false)} disabled={isLoading}>Cancelar</Button>
                        <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? 'Salvando...' : currentAction === 'create' ? 'Adicionar' : 'Atualizar'}</Button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteSource}
          title="Confirmar inativação"
          message={`Tem certeza que deseja inativar a fonte "${sourceToDelete?.name}"? Leilões já vinculados a ela não serão afetados.`}
          confirmButtonText="Inativar"
          isLoading={isLoading}
          variant="danger"
        />
      </div>
    </MainLayout>
  )
}

export default withBackofficeAuth(AuctionSourcesAdminPage)

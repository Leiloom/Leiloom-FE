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
import { Auction, CreateAuctionData, AuctionType } from '@/types/auction'

function AuctionsAdminPage() {
  useDynamicTitle()
  const router = useRouter()

  const [auctions, setAuctions] = useState<Auction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isOpenModal, setIsOpenModal] = useState(false)

  const [newAuction, setNewAuction] = useState<CreateAuctionData>({
    name: '',
    type: AuctionType.ONLINE,
    url: '',
    openingDate: '',
    closingDate: '',
    createdBy: 'system',
  })

  // 🔹 Filtro de busca simples
  const filtered = auctions.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()) 
  )

  const { currentPage, totalPages, paginatedData, goToPage, resetToFirstPage } =
    usePagedData(filtered, 10)

  // 🔹 Carregar leilões
  async function loadAuctions() {
    setIsLoading(true)
    try {
      const data = await getAuctions()
      setAuctions(data)
      resetToFirstPage()
    } catch {
      toast.error('Erro ao carregar leilões.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAuctions()
  }, [])

  // 🔹 Formatação de datas
  function formatDate(dateString: string) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // 🔹 Tabela de listagem
  interface Column<T> {
    key: keyof T | string
    header: string
    render?: (value: any, row: T) => React.ReactNode
  }

  const columns: Column<Auction>[] = [
    { key: 'name', header: 'Nome' },
    { key: 'type', header: 'Tipo' },
    {
      key: 'openingDate',
      header: 'Abertura',
      render: (value) => formatDate(value),
    },
    {
      key: 'closingDate',
      header: 'Encerramento',
      render: (value) => formatDate(value),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: unknown, auction: Auction) => (
        <div className="flex space-x-4">
          <ActionButton
            variant="view"
            onClick={() => handleView(auction)}
            disabled={isLoading}
          />
        </div>
      ),
    },
  ]

  // 🔹 Novo leilão
  function handleNewAuction() {
    setNewAuction({
      name: '',
      type: AuctionType.ONLINE,
      url: '',
      openingDate: '',
      closingDate: '',
      createdBy: 'system',
    })
    setIsOpenModal(true)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    try {
      await createAuction(newAuction)
      toast.success('Leilão criado com sucesso!')
      setIsOpenModal(false)
      loadAuctions()
    } catch {
      toast.error('Erro ao salvar leilão.')
    } finally {
      setIsLoading(false)
    }
  }

  // 🔹 Visualizar detalhes
  function handleView(auction: Auction) {
    router.push(`/backoffice/auctions/${auction.id}`)
  }

  return (
    <MainLayout>
      <Head>
        <title>Gerenciamento de Leilões - Leiloom</title>
        <meta name="description" content="Gerencie os leilões cadastrados na plataforma Leiloom" />
      </Head>

      <div className="min-h-screen flex justify-center bg-gray-50">
        <div className="mx-auto py-4 px-4 w-full max-w-none">
          <PageHeader
            title="Gerenciamento de Leilões"
            buttonText="Novo Leilão"
            onButtonClick={handleNewAuction}
            isLoading={isLoading}
          />

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b px-6 py-4">
              <p className="text-sm text-gray-500">
                Gerencie os leilões cadastrados na plataforma.
              </p>
            </div>
            <div className="flex items-center justify-between p-6 border-b">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Pesquisar por nome, tipo ou local"
              />
            </div>
            <DataTable
              data={paginatedData}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={10}
              onPageChange={goToPage}
              isLoading={isLoading}
              emptyStateTitle="Nenhum leilão cadastrado."
              onCreateFirst={handleNewAuction}
              createFirstText="Criar o primeiro leilão"
            />
          </div>
        </div>

        {/* 🧾 Modal de Novo Leilão */}
        <Transition appear show={isOpenModal} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            onClose={() => !isLoading && setIsOpenModal(false)}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 mb-4"
                    >
                      Novo Leilão
                    </Dialog.Title>

                    <form onSubmit={handleSave} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={newAuction.name}
                          onChange={(e) =>
                            setNewAuction({ ...newAuction, name: e.target.value })
                          }
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo
                        </label>
                        <select
                          value={newAuction.type}
                          onChange={(e) =>
                            setNewAuction({
                              ...newAuction,
                              type: e.target.value as AuctionType,
                            })
                          }
                          className="w-full border text-gray-700 border-gray-300 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500"
                          disabled={isLoading}
                        >
                          <option value={AuctionType.ONLINE}>Online</option>
                          <option value={AuctionType.LOCAL}>Presencial</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL (opcional)
                        </label>
                        <Input
                          id="url"
                          name="url"
                          type="text"
                          value={newAuction.url}
                          onChange={(e) =>
                            setNewAuction({ ...newAuction, url: e.target.value })
                          }
                          disabled={isLoading}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Abertura
                          </label>
                          <Input
                            id="openingDate"
                            name="openingDate"
                            type="datetime-local"
                            value={newAuction.openingDate}
                            onChange={(e) =>
                              setNewAuction({
                                ...newAuction,
                                openingDate: e.target.value,
                              })
                            }
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Encerramento
                          </label>
                          <Input
                            id="closingDate"
                            name="closingDate"
                            type="datetime-local"
                            value={newAuction.closingDate}
                            onChange={(e) =>
                              setNewAuction({
                                ...newAuction,
                                closingDate: e.target.value,
                              })
                            }
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          variant="neutral"
                          onClick={() => setIsOpenModal(false)}
                          disabled={isLoading}
                        >
                          Cancelar
                        </Button>

                        <Button type="submit" variant="primary" disabled={isLoading}>
                          {isLoading ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </MainLayout>
  )
}

export default withBackofficeAuth(AuctionsAdminPage)
  'use client'
import Head from 'next/head'
import { useEffect, useState, Fragment } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-toastify'
import { Dialog, Transition } from '@headlessui/react'
import MainLayout from '@/layouts/MainLayout'
import { withBackofficeAuth } from '@/hooks/withBackofficeAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ActionButton } from '@/components/shared/ActionButton'
import { usePagedData } from '@/hooks/usePagedData'
import {
  getAllClients,
  createClient,
  updateClientAll,
} from '@/services/clientService'
import Client from '@/services/Interfaces'
import { SearchBar } from '@/components/shared/SearchBar'
import { MultiSelectDropdown } from '@/components/shared/MultiSelectDropdown'
import { useDynamicTitle } from '@/hooks/useDynamicTitle'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'


  function ClientsAdminPage() {
    useDynamicTitle()
    const router = useRouter()
    // read query params so the page can be pre-filtered (e.g. ?status=pending)
    const searchParams = useSearchParams()
    const [clients, setClients] = useState<Client[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [search, setSearch] = useState('')
    // default to all statuses selected
    const [selectedStatuses, setSelectedStatuses] = useState<Client['status'][]>(['PENDING', 'CONFIRMED', 'APPROVED', 'EXCLUDED'])

    // when the URL contains ?status=pending (or multiple statuses comma-separated)
    useEffect(() => {
      const raw = searchParams?.get('status')
      if (!raw) return

      const parts = raw.split(',').map(p => p.trim().toUpperCase())
      const valid = parts.filter(p => ['PENDING', 'CONFIRMED', 'APPROVED', 'EXCLUDED'].includes(p)) as Client['status'][]

      if (valid.length > 0) {
        setSelectedStatuses(valid)
      }
    }, [String(searchParams)])
    const filtered = clients
      .filter(client => selectedStatuses.includes(client.status))
      .filter(client =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.cpfCnpj?.toLowerCase().includes(search.toLowerCase())
      )

    const { currentPage, totalPages, paginatedData, goToPage, resetToFirstPage } = usePagedData(filtered, 10)

    const statusMap: Record<Client['status'], { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
      PENDING: { label: 'Pendente', variant: 'warning' },
      CONFIRMED: { label: 'Confirmado', variant: 'info' },
      APPROVED: { label: 'Aprovado', variant: 'success' },
      EXCLUDED: { label: 'Excluído', variant: 'error' },
    }

    const [isOpenModal, setIsOpenModal] = useState(false)
    const [newClient, setNewClient] = useState<Client>({
    clientId:   '',
    name:       '',
    email:      '',
    phone:      '',
    role:       'ClientOwner',
    id:              undefined,
    cpfCnpj:         '',
    cep:             '',
    street:          '',
    number:          '',
    complement:      '',
    neighborhood:    '',
    city:            '',
    state:           '',
    country:         'Brasil',
    status:          'PENDING',
    confirmationCode:'',
    isConfirmed:     false,
    createdOn:       undefined,
    updatedOn:       undefined,
    clientUsers:     undefined,
    })

    const [isExcludeModalOpen, setIsExcludeModalOpen] = useState(false)

    interface Column<T> {
      key: keyof T | string
      header: string
      render?: (value: any, row: T) => React.ReactNode
    }

    const columns: Column<Client>[] = [
      { key: 'name', header: 'Nome' },
      { key: 'cpfCnpj', header: 'CPF/CNPJ' },
      { key: 'city', header: 'Cidade' },
      { key: 'state', header: 'Estado' },
      {
        key: 'status',
        header: 'Situação',
        render: (status: Client['status']) => (
          <StatusBadge variant={statusMap[status].variant}>
            {statusMap[status].label}
          </StatusBadge>
        )
      },
      {
        key: 'actions',
        header: 'Ações',
        render: (_: unknown, client: Client) => (
          <div className="flex space-x-4">
            <ActionButton
              variant="edit"
              onClick={() => handleEdit(client)}
              disabled={isLoading}
            />
          </div>
        )
      }
    ]

    async function loadClients() {
      setIsLoading(true)
      try {
        const data = await getAllClients()
        setClients(data)
        resetToFirstPage()
      } catch (err) {
        toast.error('Erro ao carregar clientes.')
      } finally {
        setIsLoading(false)
      }
    }

    useEffect(() => {
      loadClients()
    }, [])

    function handleNewClient() {
      setNewClient({
    clientId:   '',
    name:       '',
    email:      '',
    phone:      '',
    role:       'ClientOwner',
    id:              undefined,
    cpfCnpj:         '',
    cep:             '',
    street:          '',
    number:          '',
    complement:      '',
    neighborhood:    '',
    city:            '',
    state:           '',
    country:         '',
    status:          'PENDING',
    confirmationCode:'',
    isConfirmed:     false,
    createdOn:       undefined,
    updatedOn:       undefined,
    clientUsers:     undefined,
      })
      setIsOpenModal(true)
    }

    async function handleSave(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault()
      setIsLoading(true)
      try {
        await createClient(newClient)
        toast.success('Cliente criado com sucesso!')
        setIsOpenModal(false)
        loadClients()
      } catch {
        toast.error('Erro ao salvar cliente.')
      } finally {
        setIsLoading(false)
      }
    }

    function handleEdit(client: Client) {
      router.push(`/backoffice/clients/${client.id}/edit`)
    }


    return (
      <MainLayout>
        <Head>
          <title>Gerenciamento de Clientes - Leiloom</title>
          <meta name="description" content="Gerencie os clientes cadastrados na plataforma Leiloom" />
        </Head>

        <div className="min-h-screen flex justify-center bg-gray-50">
          <div className="mx-auto py-4 px-4 w-full max-w-none">
            <PageHeader
              title="Gerenciamento de Clientes"
              buttonText="Novo Cliente"
              onButtonClick={handleNewClient}
              isLoading={isLoading}
            />

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border-b px-6 py-4">
                <p className="text-sm text-gray-500">
                  Gerencie os clientes cadastrados na plataforma.
                </p>
              </div>
              <div className="flex items-center justify-between p-6 border-b">
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Pesquisar por nome ou CPF/CNPJ"
                />
                <MultiSelectDropdown
                  label="Filtrar por status"
                  options={Object.entries(statusMap).map(([value, meta]) => ({
                    label: meta.label,
                    value: value as Client['status']
                  }))}
                  selected={selectedStatuses}
                  onChange={setSelectedStatuses}
                  />
              </div>
              {/* choose empty message depending on whether DB has zero clients or filters returned nothing */}
              <DataTable
                data={paginatedData}
                columns={columns}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={10}
                onPageChange={goToPage}
                isLoading={isLoading}
                emptyStateTitle={
                  clients.length === 0
                    ? 'Nenhum cliente cadastrado.' // no clients in DB
                    : filtered.length === 0
                      ? 'Nenhum cliente encontrado' // clients exist, but not for current filters/search
                      : 'Nenhum cliente cadastrado.'
                }
                emptyStateDescription={
                  clients.length === 0
                    ? undefined
                    : filtered.length === 0
                      ? 'Nenhum cliente corresponde aos filtros selecionados ou à sua busca.'
                      : undefined
                }
                // only expose the 'create first' CTA when there are no clients at all
                onCreateFirst={clients.length === 0 ? handleNewClient : undefined}
                createFirstText="Criar o primeiro cliente"
              />
            </div>
          </div>

          {/* Modal de Novo Cliente */}
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
                        Novo Cliente
                      </Dialog.Title>

                      <form onSubmit={handleSave} className="space-y-4">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Nome da Empresa
                          </label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            placeholder="Ex: Empresa XPTO Ltda"
                            value={newClient.name}
                            onChange={(e) =>
                              setNewClient({ ...newClient, name: e.target.value })
                            }
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="cpfCnpj"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            CPF/CNPJ
                          </label>
                          <Input
                            id="cpfCnpj"
                            name="cpfCnpj"
                            type="text"
                            required
                            placeholder="12345678900"
                            value={newClient.cpfCnpj}
                            onChange={(e) =>
                              setNewClient({
                                ...newClient,
                                cpfCnpj: e.target.value,
                              })
                            }
                            disabled={isLoading}
                          />
                        </div>

                        {/* --- campos de endereço --- */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="cep"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              CEP
                            </label>
                            <Input
                              id="cep"
                              name="cep"
                              type="text"
                              placeholder="74343340"
                              value={newClient.cep}
                              onChange={(e) =>
                                setNewClient({ ...newClient, cep: e.target.value })
                              }
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="city"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Cidade
                            </label>
                            <Input
                              id="city"
                              name="city"
                              type="text"
                              placeholder="Goiânia"
                              value={newClient.city}
                              onChange={(e) =>
                                setNewClient({
                                  ...newClient,
                                  city: e.target.value,
                                })
                              }
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="street"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Rua
                            </label>
                            <Input
                              id="street"
                              name="street"
                              type="text"
                              placeholder="Av. T-63"
                              value={newClient.street}
                              onChange={(e) =>
                                setNewClient({
                                  ...newClient,
                                  street: e.target.value,
                                })
                              }
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="state"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Estado
                            </label>
                            <Input
                              id="state"
                              name="state"
                              type="text"
                              placeholder="GO"
                              value={newClient.state}
                              onChange={(e) =>
                                setNewClient({
                                  ...newClient,
                                  state: e.target.value,
                                })
                              }
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="number"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Número
                            </label>
                            <Input
                              id="number"
                              name="number"
                              type="text"
                              placeholder="1234"
                              value={newClient.number}
                              onChange={(e) =>
                                setNewClient({
                                  ...newClient,
                                  number: e.target.value,
                                })
                              }
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="complement"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Complemento
                            </label>
                            <Input
                              id="complement"
                              name="complement"
                              type="text"
                              placeholder="Sala 05"
                              value={newClient.complement}
                              onChange={(e) =>
                                setNewClient({
                                  ...newClient,
                                  complement: e.target.value,
                                })
                              }
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="neighborhood"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Bairro
                            </label>
                            <Input
                              id="neighborhood"
                              name="neighborhood"
                              type="text"
                              placeholder="Setor Bueno"
                              value={newClient.neighborhood}
                              onChange={(e) =>
                                setNewClient({
                                  ...newClient,
                                  neighborhood: e.target.value,
                                })
                              }
                              disabled={isLoading}
                            />
                          </div>
                          <div className="col-span-2">
                            <label
                              htmlFor="country"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              País
                            </label>
                            <Input
                              id="country"
                              name="country"
                              type="text"
                              placeholder="Brasil"
                              value={newClient.country}
                              onChange={(e) =>
                                setNewClient({
                                  ...newClient,
                                  country: e.target.value,
                                })
                              }
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="isConfirmed"
                              name="isConfirmed"
                              type="checkbox"
                              checked={newClient.isConfirmed}
                              onChange={(e) =>
                                setNewClient({
                                  ...newClient,
                                  isConfirmed: e.target.checked,
                                })
                              }
                              disabled={isLoading}
                              className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="isConfirmed"
                              className="font-medium text-gray-700"
                            >
                              Confirmado
                            </label>
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

                          <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading}
                          >
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

  export default withBackofficeAuth(ClientsAdminPage)
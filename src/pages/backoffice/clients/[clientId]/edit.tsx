'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-toastify'
import { Dialog, Transition } from '@headlessui/react'
import MainLayout from '@/layouts/MainLayout'
import { withBackofficeAuth } from '@/hooks/withBackofficeAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ActionButton } from '@/components/shared/ActionButton'
import { ComboBox } from '@/components/shared/ComboBox'
import { usePagedData } from '@/hooks/usePagedData'
import { getClientById, updateClientAll } from '@/services/clientService'
import {
  createClientUserAdm,
  updateClientUser,
} from '@/services/clientUserService'
import ClientUser from '@/services/Interfaces' 
import Client from '@/services/Interfaces' 
import { getCountries } from '@/services/countryService'
import { getCitiesByCountryCode, City } from '@/services/cityService'
import { 
  getAddressByCep, 
  getStatesByCountryCode, 
  getCitiesByStateCode, 
  State 
} from '@/services/addressService'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
 
interface Country {
  code: string
  name: string
}

function ClientEditPage() {
  const router = useRouter()
  const params = useParams<{ clientId: string }>()
  const clientId = params?.clientId
  const [client, setClient] = useState<Client | null>(null)
  const [users, setUsers] = useState<ClientUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const statusMap: Record<Client['status'], { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
    PENDING: { label: 'Pendente', variant: 'warning' },
    CONFIRMED: { label: 'Confirmado', variant: 'info' },
    APPROVED: { label: 'Aprovado', variant: 'success' },
    EXCLUDED: { label: 'Excluído', variant: 'error' },
  }
  
  const roleMap: Record<Client['role'], { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
    ClientOwner: { label: 'Owner', variant: 'warning' },
    ClientAdmin: { label: 'Admin', variant: 'info' },
    ClientFinancial: { label: 'Financeiro', variant: 'success' },
    ClientOperator: { label: 'Operador', variant: 'error' },
  }

  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [userAction, setUserAction] = useState<'create' | 'edit'>('create')
  const [editingUser, setEditingUser] = useState<ClientUser | null>(null)
  const [isLoadingCountries, setIsLoadingCountries] = useState(false)
  const [isLoadingStates, setIsLoadingStates] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  
  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  
  const { currentPage, totalPages, paginatedData, goToPage, resetToFirstPage } =
    usePagedData(users, 10)

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'email', header: 'Email', className: 'hidden sm:table-cell' },
    { key: 'phone', header: 'Telefone', className: 'hidden md:table-cell' },
    { key: 'cpfCnpj', header: 'CPF/CNPJ', className: 'hidden lg:table-cell' },
    { 
      key: 'role', 
      header: 'Função',
      className: 'hidden sm:table-cell',
      render: (role: Client['role']) => roleMap[role].label
    },
    {
      key: 'status', 
      header: 'Status', 
      render: (status: Client['status']) => (
        <StatusBadge variant={statusMap[status].variant}>
          {statusMap[status].label}
        </StatusBadge>
      )
    },
    {
      key: 'actions', 
      header: 'Ações', 
      render: (_: any, u: ClientUser) => (
        <div className="flex justify-end">
          <ActionButton 
            variant="edit" 
            onClick={() => { 
              setUserAction('edit'); 
              setEditingUser(u); 
              setIsUserModalOpen(true) 
            }} 
            disabled={isLoading} 
          />
        </div>
      )
    }
  ]

  useEffect(() => {
    if (!clientId) return;
    loadAll();
    loadCountries();
  }, [clientId]);

  useEffect(() => {
    if (!client?.country) return
    loadStates()
  }, [client?.country])

  useEffect(() => {
    if (!client?.state) return
    loadCities()
  }, [client?.state])

  async function loadCountries() {
    setIsLoadingCountries(true);
    try {
      const countriesData = await getCountries();
      setCountries(countriesData);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
      setCountries([
        { code: 'BR', name: 'Brasil' },
        { code: 'US', name: 'Estados Unidos' },
        { code: 'AR', name: 'Argentina' },
        { code: 'UY', name: 'Uruguai' },
        { code: 'PY', name: 'Paraguai' },
        { code: 'CL', name: 'Chile' },
        { code: 'PE', name: 'Peru' },
        { code: 'CO', name: 'Colômbia' },
        { code: 'VE', name: 'Venezuela' },
        { code: 'EC', name: 'Equador' }
      ]);
    } finally {
      setIsLoadingCountries(false);
    }
  }

  async function loadStates() {
    if (!client?.country) return
    
    setIsLoadingStates(true)
    try {
      const countryObj = countries.find(c => c.name === client.country)
      if (countryObj) {
        const statesData = await getStatesByCountryCode(countryObj.code)
        setStates(statesData)
      }
    } catch (error) {
      console.error('Erro ao carregar estados:', error)
      setStates([])
    } finally {
      setIsLoadingStates(false)
    }
  }

  async function loadCities() {
    if (!client?.state) return
    
    setIsLoadingCities(true)
    try {
      const stateObj = states.find(s => s.name === client.state)
      if (stateObj) {
        const citiesData = await getCitiesByStateCode(stateObj.code)
        setCities(citiesData)
      } else {
        const countryObj = countries.find(c => c.name === client.country)
        if (countryObj) {
          const citiesData = await getCitiesByCountryCode(countryObj.code)
          setCities(citiesData)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cidades:', error)
      setCities([])
    } finally {
      setIsLoadingCities(false)
    }
  }

  async function handleCepChange(cep: string) {
    const cleanCep = cep.replace(/\D/g, '')
    
    if (cleanCep.length === 8) {
      setIsLoadingCep(true)
      try {
        const addressData = await getAddressByCep(cleanCep)
        if (addressData) {
          setClient(prev => ({
            ...prev!,
            cep: cleanCep,
            street: addressData.logradouro || prev!.street,
            neighborhood: addressData.bairro || prev!.neighborhood,
            city: addressData.localidade || prev!.city,
            state: addressData.uf || prev!.state,
            complement: addressData.complemento || prev!.complement
          }))
          toast.success('Endereço preenchido automaticamente!')
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
        toast.error('CEP não encontrado')
      } finally {
        setIsLoadingCep(false)
      }
    }
  }

  async function loadAll() {
    setIsLoading(true);
    try {
      const c = await getClientById(clientId!);
      setClient(c);
      setUsers(c.clientUsers || []);
      resetToFirstPage();
    } catch {
      toast.error('Erro ao carregar dados do cliente');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveClient(form: Partial<Client>) {
    setIsLoading(true)
    try {
      await updateClientAll(clientId!, form)
      toast.success('Cliente atualizado com sucesso!')
      loadAll()
    } catch {
      toast.error('Erro ao atualizar cliente')
    } finally {
      setIsLoading(false)
    }
  }

  async function saveUser(payload: Partial<ClientUser> & { password?: string }) {
    setIsLoading(true)
    try {
      if (userAction === 'edit' && editingUser?.id) {
        await updateClientUser(editingUser.id, payload)
        toast.success('Usuário atualizado')
      } else {
        await createClientUserAdm({ ...payload as ClientUser, clientId: clientId! })
        toast.success('Usuário criado')
      }
      setIsUserModalOpen(false)
      loadAll()
    } catch {
      toast.error('Erro ao salvar usuário')
    } finally {
      setIsLoading(false)
    }
  }

  if (!client) return null

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          
          {/* Header da página */}
          <div className="mb-6">
            <PageHeader
              title="Editar Cliente"
              buttonText="Salvar Cliente"
              onButtonClick={() => saveClient(client!)}
              isLoading={isLoading}
              isDetailsPage={true}
            />
          </div>

          {/* Informações do Cliente */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Informações do Cliente</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Dados principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder='Digite o nome do cliente'
                    value={client.name}
                    onChange={e => setClient({ ...client, name: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
                  <Input
                    id="cpfCnpj"
                    name="cpfCnpj"
                    type="text"
                    placeholder='Digite o CPF ou CNPJ do cliente'
                    value={client.cpfCnpj}
                    onChange={e => setClient({ ...client, cpfCnpj: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Endereço</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* País */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                    <ComboBox
                      value={client.country ?? ''}
                      onChange={(value) => {
                        setClient({ ...client, country: value, state: '', city: '' })
                        setStates([])
                        setCities([])
                      }}
                      options={countries.map(c => ({ value: c.name, label: c.name }))}
                      placeholder="Digite ou selecione o país"
                      disabled={isLoading}
                      isLoading={isLoadingCountries}
                      allowCustomValue={true}
                    />
                  </div>

                  {/* CEP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <div className="relative">
                      <Input
                        id="cep"
                        name="cep"
                        type="text"
                        value={client.cep ?? ''}
                        onChange={e => {
                          const value = e.target.value
                          setClient({ ...client, cep: value })
                          handleCepChange(value)
                        }}
                        disabled={isLoading}
                        placeholder="00000-000"
                      />
                      {isLoadingCep && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <ComboBox
                      value={client.state ?? ''}
                      onChange={(value) => {
                        setClient({ ...client, state: value, city: '' })
                        setCities([])
                      }}
                      options={states.map(s => ({ value: s.name, label: s.name }))}
                      placeholder="Digite ou selecione o estado"
                      disabled={isLoading || !client.country}
                      isLoading={isLoadingStates}
                      allowCustomValue={true}
                    />
                  </div>

                  {/* Cidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    <ComboBox
                      value={client.city ?? ''}
                      onChange={(value) => setClient({ ...client, city: value })}
                      options={cities.map(c => ({ value: c.name, label: c.name }))}
                      placeholder="Digite ou selecione a cidade"
                      disabled={isLoading || !client.country}
                      isLoading={isLoadingCities}
                      allowCustomValue={true}
                    />
                  </div>

                  {/* Número */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <Input
                      id="number"
                      name="number"
                      type="text"
                      value={client.number ?? ''}
                      onChange={e => setClient({ ...client, number: e.target.value })}
                      disabled={isLoading}
                      placeholder="1234"
                    />
                  </div>

                  {/* Complemento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                    <Input
                      id="complement"
                      name="complement"
                      type="text"
                      value={client.complement ?? ''}
                      onChange={e => setClient({ ...client, complement: e.target.value })}
                      disabled={isLoading}
                      placeholder="Apto 101, Bloco B, etc."
                    />
                  </div>

                  {/* Bairro */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                    <Input
                      id="neighborhood"
                      name="neighborhood"
                      type="text"
                      value={client.neighborhood ?? ''}
                      onChange={e => setClient({ ...client, neighborhood: e.target.value })}
                      disabled={isLoading}
                      placeholder="Jardim das Flores"
                    />
                  </div>

                  {/* Rua */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                    <Input
                      id="street"
                      name="street"
                      type="text"
                      value={client.street ?? ''}
                      onChange={e => setClient({ ...client, street: e.target.value })}
                      disabled={isLoading}
                      placeholder="Rua das Palmeiras"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Situação</label>
                  <select
                    value={client.status}
                    onChange={e => setClient({ ...client, status: e.target.value as any })}
                    className="w-full text-gray-700 border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    disabled={isLoading}
                  >
                    <option value="" disabled>Selecione...</option>
                    <option value="PENDING">Pendente</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="APPROVED">Aprovado</option>
                    <option value="EXCLUDED">Excluído</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Usuários */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">Usuários do Cliente</h2>
                <Button 
                    variant="add" onClick={() => { 
                    setUserAction('create'); 
                    setEditingUser(null); 
                    setIsUserModalOpen(true) 
                  }}
                  disabled={isLoading}>
                  Novo Usuário
                </Button>
              </div>
            </div>

            <div className="overflow-hidden">
              <DataTable
                data={paginatedData}
                columns={columns}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={10}
                onPageChange={goToPage}
                isLoading={isLoading}
                emptyStateTitle="Nenhum usuário cadastrado."
                onCreateFirst={() => { 
                  setUserAction('create'); 
                  setEditingUser(null); 
                  setIsUserModalOpen(true) 
                }}
                createFirstText="Criar o primeiro usuário"
              />
            </div>
          </div>

          {/* Modal Create/Edit User */}
          <Transition appear show={isUserModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !isLoading && setIsUserModalOpen(false)}>
              <Transition.Child as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
              </Transition.Child>
              
              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <Transition.Child as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          {userAction === 'create' ? 'Adicionar usuário' : 'Editar usuário'}
                        </Dialog.Title>
                      </div>
                      
                      <form onSubmit={e => {
                        e.preventDefault()
                        const f = new FormData(e.currentTarget)
                        const obj: any = Object.fromEntries(f)
                        saveUser(obj)
                      }} className="p-6 space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                          <Input 
                            id="name" 
                            name="name" 
                            type="text" 
                            placeholder="Digite o nome do usuário"
                            defaultValue={editingUser?.name} 
                            required 
                            disabled={isLoading}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            placeholder="Digite o email do usuário"
                            defaultValue={editingUser?.email} 
                            required 
                            disabled={isLoading}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                            <Input 
                              id="phone" 
                              name="phone" 
                              type="text" 
                              placeholder="Digite o telefone do usuário"
                              defaultValue={editingUser?.phone} 
                              required 
                              disabled={isLoading}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="cpfCnpj" className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
                            <Input 
                              id="cpfCnpj" 
                              name="cpfCnpj" 
                              type="text" 
                              placeholder="Digite o CPF ou CNPJ do usuário"
                              defaultValue={editingUser?.cpfCnpj} 
                              required 
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                          <select 
                            id="role" 
                            name="role" 
                            defaultValue={editingUser?.role} 
                            className="w-full border text-gray-700 border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors" 
                            disabled={isLoading}
                          >
                            <option value="" disabled>Selecione...</option>
                            <option value="ClientOwner">Owner</option>
                            <option value="ClientAdmin">Admin</option>
                            <option value="ClientFinancial">Financeiro</option>
                            <option value="ClientOperator">Operador</option>
                          </select>
                        </div>
                        
                        {userAction === 'edit' && (
                          <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Situação</label>
                            <select 
                              id="status" 
                              name="status" 
                              defaultValue={editingUser?.status} 
                              className="w-full text-gray-700 border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors" 
                              disabled={isLoading}
                            >
                              <option value="" disabled>Selecione...</option>
                              <option value="PENDING">Pendente</option>
                              <option value="CONFIRMED">Confirmado</option>
                              <option value="APPROVED">Aprovado</option>
                              <option value="EXCLUDED">Excluído</option>
                            </select>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                          <Button
                            type="button"
                            onClick={() => setIsUserModalOpen(false)}
                            variant="neutral"
                            disabled={isLoading}
                          >
                            Cancelar
                          </Button>

                          <Button
                            type="submit"
                            variant={userAction === 'create' ? 'add' : 'primary'}
                            disabled={isLoading}
                          >
                            {userAction === 'create' ? 'Adicionar' : 'Atualizar'}
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
      </div>
    </MainLayout>
  )
}

export default withBackofficeAuth(ClientEditPage)
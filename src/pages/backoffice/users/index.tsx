'use client'
import Head from 'next/head'
import { useEffect, useState, Fragment } from 'react'
import { toast } from 'react-toastify'
import { Dialog, Transition } from '@headlessui/react'
import MainLayout from '@/layouts/MainLayout'
import { withBackofficeAuth } from '@/hooks/withBackofficeAuth'
import { TokenPayload } from '@/utils/jwtUtils'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ActionButton } from '@/components/shared/ActionButton'
import { usePagedData } from '@/hooks/usePagedData'
import { getAllUsers, createUser, deleteUser, updateUser, User, CreateUserDto, UpdateUserDto } from '@/services/userService'
import { requestPasswordReset } from '@/services/authService'
import { SearchBar } from '@/components/shared/SearchBar'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline'

interface Props {
  user: TokenPayload
}

const ROLE_LABELS = {
  BOOwner: 'Proprietário',
  BOAdmin: 'Administrador',
  BOFinancial: 'Financeiro',
  BOOperator: 'Operador'
}


function UsersAdminPage({ user }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [currentAction, setCurrentAction] = useState<'create' | 'edit'>('create')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all'>('all')
  const [sendingPassword, setSendingPassword] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)

  const filtered = users.filter(user => {
    return user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]?.toLowerCase().includes(search.toLowerCase())
  })

  const { currentPage, totalPages, paginatedData, goToPage, resetToFirstPage } = usePagedData(filtered, 10)

  async function loadUsers() {
    setIsLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data)
      resetToFirstPage()
    } catch {
      toast.error('Erro ao carregar os usuários')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  function handleNewUser() {
    setEditingUser(null)
    setCurrentAction('create')
    setIsOpenModal(true)
  }

  function handleEditUser(user: User) {
    setEditingUser(user)
    setCurrentAction('edit')
    setIsOpenModal(true)
  }

  function handleDeleteUser(user: User) {
    setConfirmDelete(user)
  }

  async function confirmDeleteUser() {
    if (!confirmDelete) return

    setIsLoading(true)
    try {
      await deleteUser(confirmDelete.id)
      toast.success('Usuário removido com sucesso!')
      setConfirmDelete(null)
      loadUsers()
    } catch {
      toast.error('Erro ao remover usuário. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendPasswordReset(userEmail: string, userId: string) {
    setSendingPassword(userId)
    try {
      await requestPasswordReset({
        email: userEmail,
        context: 'BACKOFFICE'
      })
    } catch (error: any) {
      toast.error('Erro ao enviar email de redefinição de senha.')
    } finally {
      setSendingPassword(null)
    }
  }

  async function handleSave(data: CreateUserDto | UpdateUserDto) {
    setIsLoading(true)
    try {
      if (editingUser) {
        await updateUser(editingUser.id, data as UpdateUserDto)
        toast.success('Usuário atualizado com sucesso!')
      } else {
        const newUser = await createUser(data as CreateUserDto)
        toast.success('Usuário criado com sucesso!')
        
        try {
          await requestPasswordReset({
            email: newUser.email,
            context: 'BACKOFFICE'
          })
          toast.success('Email de definição de senha enviado!')
        } catch {
          toast.warning('Usuário criado, mas houve erro ao enviar o email.')
        }
      }
      setIsOpenModal(false)
      loadUsers()
    } catch (error: any) {
      if (error.message?.includes('E-mail já cadastrado')) {
        toast.error('E-mail já cadastrado. Tente outro.')
      } else {
        toast.error('Erro ao salvar usuário. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'email', header: 'E-mail' },
    { key: 'role', header: 'Função', render: (role: string) => (
      <StatusBadge variant='secondary'>
        {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
      </StatusBadge>
    )},
    { key: 'createdOn', header: 'Criado em', render: (date: string) => 
      new Date(date).toLocaleDateString('pt-BR')
    },
    { key: 'actions', header: 'Ações', render: (_: any, user: User) => (
      <div className="flex gap-2">
        <ActionButton 
          variant="edit" 
          onClick={() => handleEditUser(user)} 
          disabled={isLoading} 
        />
        <ActionButton 
          variant="delete"
          onClick={() => handleDeleteUser(user)} 
          disabled={isLoading}
        />
        <button
          onClick={() => handleSendPasswordReset(user.email, user.id)}
          disabled={isLoading || sendingPassword === user.id}
          title="Enviar email de redefinição de senha"
          className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendingPassword === user.id ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <EnvelopeIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    )}
  ]

  /**
   * Fecha o modal
   */
  function closeModal() {
    setIsOpenModal(false)
  }

  const totalUsersCount = users.length

  return (
    <MainLayout>
      <Head>
        <title>Gerenciamento de Usuários - Leiloom</title>
        <meta name="description" content="Gerencie os usuários da plataforma Leiloom" />
      </Head>
      <div className="min-h-screen flex justify-center bg-gray-50">
        <div className="mx-auto py-4 px-4 w-full max-w-none">
          <PageHeader 
            title="Gerenciamento de Usuários"
            buttonText="Novo Usuário"
            onButtonClick={handleNewUser}
            isLoading={isLoading}
          />
          
          {/* Informações de resumo */}
          <div className="bg-white rounded-lg shadow-md mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalUsersCount}</div>
                <div className="text-sm text-gray-600">Total de Usuários</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{filtered.length}</div>
                <div className="text-sm text-gray-600">Usuários Filtrados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{Object.keys(ROLE_LABELS).length}</div>
                <div className="text-sm text-gray-600">Tipos de Funções</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b px-6 py-4">
              <p className="text-sm text-gray-500">
                Gerencie os usuários do back office da plataforma. Controle as permissões e acesso aos recursos.
              </p>
            </div>
            
            {/* Filtros */}
            <div className="border-b px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <SearchBar value={search} onChange={setSearch} />
                </div>
              </div>
            </div>

            <DataTable
              data={paginatedData}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={10}
              onPageChange={goToPage}
              isLoading={isLoading}
              emptyStateTitle="Nenhum usuário encontrado."
              onCreateFirst={handleNewUser}
              createFirstText="Criar o primeiro usuário"
            />
          </div>
        </div>

        {/* Modal para adicionar/editar usuários */}
        <Transition appear show={isOpenModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => !isLoading && closeModal()}>
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
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 mb-4"
                    >
                      {currentAction === 'create' ? 'Adicionar novo usuário' : 'Editar usuário'}
                    </Dialog.Title>
                    
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        const formElement = e.currentTarget
                        const data = new FormData(formElement)
                        
                        const formObj: CreateUserDto | UpdateUserDto = {
                          name: data.get('name') as string,
                          email: data.get('email') as string,
                          role: data.get('role') as string,
                        }

                        // Para criação, sempre inclui uma senha temporária
                        if (currentAction === 'create') {
                          // Gera uma senha aleatória de 32 bytes em hexadecimal
                          const randomBytes = crypto.getRandomValues(new Uint8Array(32))
                          const randomPassword = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')
                          ;(formObj as CreateUserDto).password = randomPassword
                        }
                        
                        handleSave(formObj)
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <Input 
                          id="name"
                          name="name" 
                          type="text"
                          required
                          placeholder="Nome completo do usuário"
                          defaultValue={editingUser?.name || ''} 
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <Input 
                          id="email"
                          name="email" 
                          type="email"
                          required
                          placeholder="usuario@exemplo.com"
                          defaultValue={editingUser?.email || ''} 
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                        <select 
                          id="role"
                          name="role" 
                          required
                          defaultValue={editingUser?.role || ''}
                          disabled={isLoading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-700"
                        >
                          <option value="">Selecione uma função</option>
                          {Object.entries(ROLE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>

                      {currentAction === 'create' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <KeyIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                            <div>
                              <h4 className="text-sm font-medium text-blue-800">Senha do Usuário</h4>
                              <p className="text-sm text-blue-700 mt-1">
                                Um email será enviado para o usuário para definição da senha.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          onClick={closeModal}
                          disabled={isLoading}
                          variant='neutral'
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          variant='primary'
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Salvando...
                            </>
                          ) : currentAction === 'create' ? 'Criar' : 'Atualizar'}
                        </Button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Modal de confirmação de exclusão */}
        <Transition appear show={!!confirmDelete} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => !isLoading && setConfirmDelete(null)}>
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
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 mb-4"
                    >
                      Confirmar exclusão
                    </Dialog.Title>
                    
                    <p className="text-sm text-gray-500 mb-6">
                      Tem certeza que deseja excluir o usuário <strong>{confirmDelete?.name}</strong>? 
                      Esta ação não pode ser desfeita.
                    </p>
                    
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        disabled={isLoading}
                        variant='neutral'
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="button"
                        onClick={confirmDeleteUser}
                        variant='danger'
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Excluindo...
                          </>
                        ) : 'Excluir'}
                      </Button>
                    </div>
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

export default withBackofficeAuth(UsersAdminPage)
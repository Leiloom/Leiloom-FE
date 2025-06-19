'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Dialog, Transition } from '@headlessui/react'
import MainLayout from '@/layouts/MainLayout'
import { withClientAuth } from '@/hooks/withClientAuth'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ActionButton } from '@/components/shared/ActionButton'
import { usePagedData } from '@/hooks/usePagedData'
import {
    getClientUsers,
    createClientUserAdm,
    updateClientUser,
    getClientUserById
} from '@/services/clientUserService'
import ClientUser from '@/services/Interfaces'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { TokenPayload } from '@/utils/jwtUtils'

interface Props {
    user: TokenPayload
}

function UserManagementPage({ user }: Props) {
    const router = useRouter()
    const [users, setUsers] = useState<ClientUser[]>([])
    const [filteredUsers, setFilteredUsers] = useState<ClientUser[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [roleFilter, setRoleFilter] = useState<string>('all')

    const statusMap: Record<ClientUser['status'], { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
        PENDING: { label: 'Pendente', variant: 'warning' },
        CONFIRMED: { label: 'Confirmado', variant: 'info' },
        APPROVED: { label: 'Aprovado', variant: 'success' },
        EXCLUDED: { label: 'Excluído', variant: 'error' },
    }

    const roleMap: Record<ClientUser['role'], { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
        ClientOwner: { label: 'Owner', variant: 'warning' },
        ClientAdmin: { label: 'Admin', variant: 'info' },
        ClientFinancial: { label: 'Financeiro', variant: 'success' },
        ClientOperator: { label: 'Operador', variant: 'error' },
    }

    const [isUserModalOpen, setIsUserModalOpen] = useState(false)
    const [userAction, setUserAction] = useState<'create' | 'edit'>('create')
    const [editingUser, setEditingUser] = useState<ClientUser | null>(null)

    const { currentPage, totalPages, paginatedData, goToPage, resetToFirstPage } =
        usePagedData(filteredUsers, 10)

    const columns = [
        { key: 'name', header: 'Nome' },
        { key: 'email', header: 'Email', className: 'hidden sm:table-cell' },
        { key: 'phone', header: 'Telefone', className: 'hidden md:table-cell' },
        { key: 'cpfCnpj', header: 'CPF/CNPJ', className: 'hidden lg:table-cell' },
        {
            key: 'role',
            header: 'Função',
            className: 'hidden sm:table-cell',
            render: (role: ClientUser['role']) => (
                <StatusBadge variant={roleMap[role].variant}>
                    {roleMap[role].label}
                </StatusBadge>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (status: ClientUser['status']) => (
                <StatusBadge variant={statusMap[status].variant}>
                    {statusMap[status].label}
                </StatusBadge>
            )
        },
        {
            key: 'actions',
            header: 'Ações',
            render: (_: any, user: ClientUser) => (
                <div className="flex justify-end">
                    <ActionButton
                        variant="edit"
                        onClick={() => handleEditUser(user)}
                        disabled={isLoading}
                    />
                </div>
            )
        }
    ]

    useEffect(() => {
        loadUsers()
    }, [])

    useEffect(() => {
        filterUsers()
    }, [users, searchTerm, statusFilter, roleFilter])

    function filterUsers() {
        let filtered = [...users]

        // Filtro por termo de busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                user.cpfCnpj.toLowerCase().includes(term) ||
                user.phone?.toLowerCase().includes(term)
            )
        }

        // Filtro por status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(user => user.status === statusFilter)
        }

        // Filtro por função
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter)
        }

        setFilteredUsers(filtered)
        resetToFirstPage()
    }

    async function loadUsers() {
        setIsLoading(true)
        try {
            const usersData = await getClientUsers(user.clientId ?? '')
            setUsers(usersData)
        } catch (error) {
            console.error('Erro ao carregar usuários:', error)
            toast.error('Erro ao carregar usuários')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleEditUser(user: ClientUser) {
        try {
            const fullUser = await getClientUserById(user.id ?? '')
            setEditingUser(fullUser)
            setUserAction('edit')
            setIsUserModalOpen(true)
        } catch (error) {
            toast.error('Erro ao carregar dados do usuário')
        }
    }

    async function handleToggleUserStatus(user: ClientUser) {
        const newStatus = user.status === 'EXCLUDED' ? 'APPROVED' : 'EXCLUDED'
        const action = newStatus === 'EXCLUDED' ? 'desativar' : 'ativar'

        if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) {
            return
        }

        setIsLoading(true)
        try {
            await updateClientUser(user.id ?? '', { status: newStatus })
            toast.success(`Usuário ${action === 'desativar' ? 'desativado' : 'ativado'} com sucesso!`)
            loadUsers()
        } catch (error) {
            toast.error(`Erro ao ${action} usuário`)
        } finally {
            setIsLoading(false)
        }
    }

    async function saveUser(payload: Partial<ClientUser> & { password?: string }) {
        setIsLoading(true)
        try {
            if (userAction === 'edit' && editingUser?.id) {
                await updateClientUser(editingUser.id, payload)
                toast.success('Usuário atualizado com sucesso!')
            } else {
                payload.clientId = user.clientId ?? '';
                await createClientUserAdm({ ...payload as ClientUser })
                toast.success('Usuário criado com sucesso!')
            }
            setIsUserModalOpen(false)
            loadUsers()
        } catch (error) {
            toast.error('Erro ao salvar usuário')
        } finally {
            setIsLoading(false)
        }
    }

    function openCreateModal() {
        setUserAction('create')
        setEditingUser(null)
        setIsUserModalOpen(true)
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-6 max-w-7xl">

                    {/* Header da página */}
                    <div className="mb-6">
                        <PageHeader
                            title="Gestão de Usuários"
                            buttonText="Novo Usuário"
                            onButtonClick={openCreateModal}
                            isLoading={isLoading}
                            isDetailsPage={true}
                        />
                    </div>

                    {/* Filtros */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Busca */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                                    <Input
                                        id="search"
                                        name="search"
                                        type="text"
                                        placeholder="Nome, email, CPF/CNPJ ou telefone..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Filtro por Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value)}
                                        className="w-full text-gray-700 border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                                        disabled={isLoading}
                                    >
                                        <option value="all">Todos os status</option>
                                        <option value="PENDING">Pendente</option>
                                        <option value="CONFIRMED">Confirmado</option>
                                        <option value="APPROVED">Aprovado</option>
                                        <option value="EXCLUDED">Excluído</option>
                                    </select>
                                </div>

                                {/* Filtro por Função */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                                    <select
                                        value={roleFilter}
                                        onChange={e => setRoleFilter(e.target.value)}
                                        className="w-full text-gray-700 border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                                        disabled={isLoading}
                                    >
                                        <option value="all">Todas as funções</option>
                                        <option value="ClientOwner">Owner</option>
                                        <option value="ClientAdmin">Admin</option>
                                        <option value="ClientFinancial">Financeiro</option>
                                        <option value="ClientOperator">Operador</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Usuários */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Usuários</h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {filteredUsers.length} de {users.length} usuários
                                    </p>
                                </div>
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
                                emptyStateTitle="Nenhum usuário encontrado."
                                onCreateFirst={openCreateModal}
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
                                        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-200">
                                                <Dialog.Title className="text-lg font-semibold text-gray-900">
                                                    {userAction === 'create' ? 'Adicionar Usuário' : 'Editar Usuário'}
                                                </Dialog.Title>
                                            </div>

                                            <form onSubmit={e => {
                                                e.preventDefault()
                                                const formData = new FormData(e.currentTarget)
                                                const payload: any = Object.fromEntries(formData)

                                                Object.keys(payload).forEach(key => {
                                                    if (payload[key] === '') {
                                                        delete payload[key]
                                                    }
                                                })

                                                saveUser(payload)
                                            }} className="p-6 space-y-6">

                                                <div>
                                                    <h3 className="text-md font-medium text-gray-900 mb-3">Dados Pessoais</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                                                            <Input
                                                                id="name"
                                                                name="name"
                                                                type="text"
                                                                placeholder="Digite o nome completo"
                                                                defaultValue={editingUser?.name}
                                                                required
                                                                disabled={isLoading}
                                                            />
                                                        </div>

                                                        <div>
                                                            <label htmlFor="cpfCnpj" className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ *</label>
                                                            <Input
                                                                id="cpfCnpj"
                                                                name="cpfCnpj"
                                                                type="text"
                                                                placeholder="000.000.000-00"
                                                                defaultValue={editingUser?.cpfCnpj}
                                                                required
                                                                disabled={isLoading}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contato */}
                                                <div>
                                                    <h3 className="text-md font-medium text-gray-900 mb-3">Contato</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                                            <Input
                                                                id="email"
                                                                name="email"
                                                                type="email"
                                                                placeholder="usuario@exemplo.com"
                                                                defaultValue={editingUser?.email}
                                                                required
                                                                disabled={isLoading}
                                                            />
                                                        </div>

                                                        <div>
                                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                                                            <Input
                                                                id="phone"
                                                                name="phone"
                                                                type="text"
                                                                placeholder="(00) 00000-0000"
                                                                defaultValue={editingUser?.phone}
                                                                required
                                                                disabled={isLoading}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Configurações do Sistema */}
                                                <div>
                                                    <h3 className="text-md font-medium text-gray-900 mb-3">Configurações do Sistema</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Função *</label>
                                                            <select
                                                                id="role"
                                                                name="role"
                                                                defaultValue={editingUser?.role || ''}
                                                                className="w-full border text-gray-700 border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                                                                required
                                                                disabled={isLoading}
                                                            >
                                                                <option value="" disabled>Selecione a função</option>
                                                                <option value="ClientOwner">Owner</option>
                                                                <option value="ClientAdmin">Admin</option>
                                                                <option value="ClientFinancial">Financeiro</option>
                                                                <option value="ClientOperator">Operador</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status do Usuário</label>
                                                            <div className="flex items-center space-x-4 pt-2">
                                                                <label className="flex items-center">
                                                                    <input
                                                                        type="radio"
                                                                        name="status"
                                                                        value="APPROVED"
                                                                        defaultChecked={!editingUser || editingUser.status !== 'EXCLUDED'}
                                                                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                                                                        disabled={isLoading}
                                                                    />
                                                                    <span className="ml-2 text-sm text-gray-700">Ativo</span>
                                                                </label>
                                                                <label className="flex items-center">
                                                                    <input
                                                                        type="radio"
                                                                        name="status"
                                                                        value="EXCLUDED"
                                                                        defaultChecked={editingUser?.status === 'EXCLUDED'}
                                                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                                                                        disabled={isLoading}
                                                                    />
                                                                    <span className="ml-2 text-sm text-gray-700">Inativo</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Botões */}
                                                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
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
                                                        {userAction === 'create' ? 'Criar Usuário' : 'Atualizar Usuário'}
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

export default withClientAuth(UserManagementPage)
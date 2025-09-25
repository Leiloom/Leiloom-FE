'use client'
import Head from 'next/head'
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
import { getDetailedPaymentSummary } from '@/services/paymentService'
import ClientUser from '@/services/Interfaces'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { TokenPayload } from '@/utils/jwtUtils'
import { Users, AlertTriangle, CheckCircle } from 'lucide-react'

interface Props {
    user: TokenPayload
}

interface PlanInfo {
    planName: string
    numberOfUsers: number
    currentUserCount: number
    canAddUsers: boolean
}

function UserManagementPage({ user }: Props) {
    const router = useRouter()
    const [users, setUsers] = useState<ClientUser[]>([])
    const [filteredUsers, setFilteredUsers] = useState<ClientUser[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)

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
        loadUsersAndPlanInfo()
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

    async function loadUsersAndPlanInfo() {
        setIsLoading(true)
        try {
            // Carrega usuários e informações do plano em paralelo
            const [usersData, paymentSummary] = await Promise.all([
                getClientUsers(user.clientId ?? ''),
                getDetailedPaymentSummary()
            ])

            setUsers(usersData)

            // Calcula informações do plano
            if (paymentSummary.currentPlan) {
                const activeUsers = usersData.filter(u => u.status !== 'EXCLUDED').length
                const maxUsers = paymentSummary.currentPlan.period?.isTrial
                    ? 1 // Trial pode ter usuários somente um
                    : (paymentSummary.currentPlan?.numberOfUsers || 5)// Default se não tiver numberOfUsers definido no plano

                setPlanInfo({
                    planName: paymentSummary.currentPlan.planName,
                    numberOfUsers: maxUsers,
                    currentUserCount: activeUsers,
                    canAddUsers: activeUsers < maxUsers
                })
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
            toast.error('Erro ao carregar usuários e informações do plano')
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

    async function saveUser(payload: Partial<ClientUser> & { password?: string }) {
        // Validação para criação de novo usuário
        if (userAction === 'create' && planInfo && !planInfo.canAddUsers) {
            toast.error(`Limite de usuários atingido! Seu plano permite no máximo ${planInfo.numberOfUsers} usuários.`)
            return
        }

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
            loadUsersAndPlanInfo() // Recarrega para atualizar contadores
        } catch (error: any) {
            if (error?.message?.includes('limite') || error?.message?.includes('limit')) {
                toast.error('Limite de usuários do plano atingido!')
            } else {
                toast.error('Erro ao salvar usuário')
            }
        } finally {
            setIsLoading(false)
        }
    }

    function openCreateModal() {
        if (planInfo && !planInfo.canAddUsers) {
            toast.error(`Limite de usuários atingido! Seu plano "${planInfo.planName}" permite no máximo ${planInfo.numberOfUsers} usuários ativos.`)
            return
        }

        setUserAction('create')
        setEditingUser(null)
        setIsUserModalOpen(true)
    }

    return (
        <MainLayout>
            <Head>
                <title>Gerenciamento de Usuários - Leiloom</title>
                <meta name="description" content="Gerencie os usuários do seu cliente na plataforma Leiloom" />
            </Head>
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
                            isDisablesPage={planInfo ? !planInfo.canAddUsers : false}
                        />
                    </div>

                    {/* Card de Informações do Plano */}
                    {planInfo && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Informações do Plano</h2>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Plano Atual */}
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Plano Atual</p>
                                            <p className="font-semibold text-gray-900">{planInfo.planName}</p>
                                        </div>
                                    </div>

                                    {/* Usuários Utilizados */}
                                    <div className="flex items-center space-x-3">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${planInfo.canAddUsers ? 'bg-green-100' : 'bg-red-100'
                                            }`}>
                                            {planInfo.canAddUsers ? (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Usuários Ativos</p>
                                            <p className={`font-semibold ${planInfo.canAddUsers ? 'text-gray-900' : 'text-red-600'
                                                }`}>
                                                {planInfo.currentUserCount} de {planInfo.numberOfUsers}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center space-x-3">
                                        <div>
                                            <p className="text-sm text-gray-600">Status</p>
                                            {planInfo.canAddUsers ? (
                                                <div className="flex items-center text-green-600">
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    <span className="font-medium text-sm">Pode adicionar usuários</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-red-600">
                                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                                    <span className="font-medium text-sm">Limite atingido</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Alerta de Limite */}
                                {!planInfo.canAddUsers && (
                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                                            <div>
                                                <h4 className="text-sm font-medium text-red-800">Limite de usuários atingido</h4>
                                                <p className="text-sm text-red-700 mt-1">
                                                    Seu plano "{planInfo.planName}" permite no máximo {planInfo.numberOfUsers} usuários ativos.
                                                    Para adicionar mais usuários, considere fazer upgrade do seu plano ou desativar usuários não utilizados.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                                        {planInfo && (
                                            <span className="ml-2 text-xs text-gray-500">
                                                • {planInfo.currentUserCount}/{planInfo.numberOfUsers} ativos no plano
                                            </span>
                                        )}
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
                                onCreateFirst={planInfo?.canAddUsers ? openCreateModal : undefined}
                                createFirstText={planInfo?.canAddUsers ? "Criar o primeiro usuário" : undefined}
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
                                <div className="fixed inset-0 bg-black/25" />
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
                                                {userAction === 'create' && planInfo && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Usuários ativos: {planInfo.currentUserCount}/{planInfo.numberOfUsers}
                                                    </p>
                                                )}
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

                                                        {userAction !== 'create' && (
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
                                                        )}
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
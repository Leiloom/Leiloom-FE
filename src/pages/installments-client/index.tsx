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
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { TokenPayload } from '@/utils/jwtUtils'
import { 
  getAllInstallments,
  PendingInstallment 
} from '@/services/paymentService'
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Download,
  Receipt,
  ExternalLink
} from 'lucide-react'

interface Props {
  user: TokenPayload
}

interface InstallmentWithPayment extends PendingInstallment {
}

function ClientInstallmentsPage({ user }: Props) {
  const router = useRouter()
  const [installments, setInstallments] = useState<InstallmentWithPayment[]>([])
  const [filteredInstallments, setFilteredInstallments] = useState<InstallmentWithPayment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // Modal de detalhes
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentWithPayment | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Modal de pagamento
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedInstallmentForPayment, setSelectedInstallmentForPayment] = useState<InstallmentWithPayment | null>(null)

  const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
    PENDING: { label: 'Pendente', variant: 'warning' },
    PAID: { label: 'Pago', variant: 'success' },
    OVERDUE: { label: 'Em Atraso', variant: 'error' },
    CANCELLED: { label: 'Cancelado', variant: 'info' },
  }

  const paymentMethodMap: Record<string, string> = {
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
    PIX: 'PIX',
    BANK_SLIP: 'Boleto',
    BANK_TRANSFER: 'Transferência'
  }

  const { currentPage, totalPages, paginatedData, goToPage, resetToFirstPage } =
    usePagedData(filteredInstallments, 8)

  // Função para formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  // Função para formatar data
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR')
  }

  // Função para calcular dias até vencimento
  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Função para determinar urgência e cor
  const getInstallmentInfo = (dueDate: Date, status: string) => {
    if (status === 'PAID') return { 
      type: 'paid', 
      message: 'Pago', 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
    if (status === 'CANCELLED') return { 
      type: 'cancelled', 
      message: 'Cancelado', 
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
    
    const daysUntilDue = getDaysUntilDue(dueDate)
    
    if (daysUntilDue < 0) return { 
      type: 'overdue', 
      message: `${Math.abs(daysUntilDue)} dias em atraso`,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
    if (daysUntilDue === 0) return { 
      type: 'today', 
      message: 'Vence hoje',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
    if (daysUntilDue <= 7) return { 
      type: 'urgent', 
      message: `Vence em ${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
    
    return { 
      type: 'normal', 
      message: `Vence em ${daysUntilDue} dias`,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  }

  const columns = [
    { 
      key: 'installmentNumber', 
      header: 'Parcela',
      render: (installmentNumber: number, item: InstallmentWithPayment) => (
        <div>
          <div className="font-semibold text-gray-900">
            {installmentNumber}º parcela
          </div>
          <div className="text-sm text-gray-600">
            {item.payment.clientPlan.plan.name}
          </div>
        </div>
      )
    },
    { 
      key: 'amount', 
      header: 'Valor',
      render: (amount: number) => (
        <span className="font-bold text-lg text-gray-900">{formatPrice(amount)}</span>
      )
    },
    { 
      key: 'dueDate', 
      header: 'Vencimento',
      render: (dueDate: Date, item: InstallmentWithPayment) => {
        const info = getInstallmentInfo(dueDate, item.status)
        return (
          <div>
            <div className="font-medium text-gray-900">{formatDate(dueDate)}</div>
            <div className={`text-sm ${info.color}`}>
              {info.message}
            </div>
          </div>
        )
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (status: string) => (
        <StatusBadge variant={statusMap[status]?.variant || 'info'}>
          {statusMap[status]?.label || status}
        </StatusBadge>
      )
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (_: any, item: InstallmentWithPayment) => (
        <div className="flex space-x-2">
          <ActionButton
            variant="view"
            onClick={() => handleViewInstallmentDetails(item)}
            disabled={isLoading}
          />
          {item.status === 'PENDING' && (
            <button
              onClick={() => handlePayInstallment(item)}
              disabled={isLoading}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              title="Pagar agora"
            >
              Pagar
            </button>
          )}
          {item.status === 'PAID' && (
            <button
              onClick={() => handleDownloadReceipt(item.id)}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              title="Baixar comprovante"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ]

  useEffect(() => {
    loadInstallments()
  }, [])

  useEffect(() => {
    filterInstallments()
  }, [installments, searchTerm, statusFilter, dateFilter])

  function filterInstallments() {
    let filtered = [...installments]

    // Filtro por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(installment =>
        installment.payment.clientPlan.plan.name.toLowerCase().includes(term) ||
        installment.installmentNumber.toString().includes(term) ||
        formatPrice(installment.amount).toLowerCase().includes(term)
      )
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(installment => installment.status === statusFilter)
    }

    // Filtro por data
    if (dateFilter !== 'all') {
      const today = new Date()
      filtered = filtered.filter(installment => {
        const daysUntilDue = getDaysUntilDue(installment.dueDate)
        
        switch (dateFilter) {
          case 'overdue':
            return daysUntilDue < 0 && installment.status !== 'PAID'
          case 'thisMonth':
            return installment.dueDate.getMonth() === today.getMonth() && 
                   installment.dueDate.getFullYear() === today.getFullYear()
          case 'nextMonth':
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1)
            return installment.dueDate.getMonth() === nextMonth.getMonth() && 
                   installment.dueDate.getFullYear() === nextMonth.getFullYear()
          case 'paid':
            return installment.status === 'PAID'
          default:
            return true
        }
      })
    }

    // Ordenar por data de vencimento (mais próximas primeiro)
    filtered.sort((a, b) => {
      // Pendentes e em atraso primeiro
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1
      if (b.status === 'PENDING' && a.status !== 'PENDING') return 1
      if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1
      if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1
      
      // Depois por data
      return a.dueDate.getTime() - b.dueDate.getTime()
    })

    setFilteredInstallments(filtered)
    resetToFirstPage()
  }

  async function loadInstallments() {
    setIsLoading(true)
    try {
      const installmentsData = await getAllInstallments()
      setInstallments(installmentsData)
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error)
      toast.error('Erro ao carregar suas parcelas')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleViewInstallmentDetails(installment: InstallmentWithPayment) {
    setLoadingDetails(true)
    setSelectedInstallment(installment)
    setIsDetailsModalOpen(true)
    setLoadingDetails(false)
  }

  function handlePayInstallment(installment: InstallmentWithPayment) {
    setSelectedInstallmentForPayment(installment)
    setIsPaymentModalOpen(true)
  }

  async function handleDownloadReceipt(installmentId: string) {
    try {
      // Implementar download do comprovante
      toast.info('Funcionalidade de download será implementada em breve')
    } catch (error) {
      toast.error('Erro ao baixar comprovante')
    }
  }

  function handleGoToPayment() {
    if (selectedInstallmentForPayment) {
      // Redirecionar para gateway de pagamento
      toast.info('Redirecionando para pagamento...')
      setIsPaymentModalOpen(false)
    }
  }

  // Estatísticas rápidas
  const getQuickStats = () => {
    const total = filteredInstallments.length
    const pending = filteredInstallments.filter(i => i.status === 'PENDING').length
    const paid = filteredInstallments.filter(i => i.status === 'PAID').length
    const overdue = filteredInstallments.filter(i => i.status === 'OVERDUE' || 
      (i.status === 'PENDING' && getDaysUntilDue(i.dueDate) < 0)).length
    const totalAmount = filteredInstallments.reduce((sum, i) => sum + i.amount, 0)
    const paidAmount = filteredInstallments.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0)
    const pendingAmount = filteredInstallments.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0)
    
    return { total, pending, paid, overdue, totalAmount, paidAmount, pendingAmount }
  }

  const stats = getQuickStats()

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          
          {/* Header da página */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Minhas Parcelas</h1>
                <p className="text-gray-600 mt-1">Acompanhe todas as suas parcelas e pagamentos</p>
              </div>
            </div>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-center">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-center">
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-center">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Pagas</p>
                <p className="text-xl font-bold text-green-600">{stats.paid}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-center">
                <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-sm text-gray-600">Em Atraso</p>
                <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-center">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Pago</p>
                <p className="text-lg font-bold text-green-600">{formatPrice(stats.paidAmount)}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-center">
                <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600">Pendente</p>
                <p className="text-lg font-bold text-orange-600">{formatPrice(stats.pendingAmount)}</p>
              </div>
            </div>
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
                    placeholder="Plano, parcela, valor..."
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
                    <option value="PAID">Pago</option>
                    <option value="OVERDUE">Em Atraso</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>

                {/* Filtro por Período */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                  <select
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="w-full text-gray-700 border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    disabled={isLoading}
                  >
                    <option value="all">Todos os períodos</option>
                    <option value="overdue">Em atraso</option>
                    <option value="thisMonth">Este mês</option>
                    <option value="nextMonth">Próximo mês</option>
                    <option value="paid">Já pagas</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Parcelas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Suas Parcelas</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredInstallments.length} de {installments.length} parcelas
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
                itemsPerPage={8}
                onPageChange={goToPage}
                isLoading={isLoading}
                emptyStateTitle="Nenhuma parcela encontrada."
              />
            </div>
          </div>

          {/* Modal de Detalhes da Parcela */}
          <Transition appear show={isDetailsModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !loadingDetails && setIsDetailsModalOpen(false)}>
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
                          Detalhes da Parcela
                        </Dialog.Title>
                      </div>

                      {loadingDetails ? (
                        <div className="p-6 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Carregando detalhes...</p>
                        </div>
                      ) : selectedInstallment ? (
                        <div className="p-6 space-y-6">
                          {/* Header da Parcela */}
                          <div className="text-center bg-gray-50 rounded-lg p-6">
                            <div className="flex items-center justify-center space-x-3 mb-3">
                              <h2 className="text-2xl font-bold text-gray-900">
                                {selectedInstallment.installmentNumber}º Parcela
                              </h2>
                              <StatusBadge variant={statusMap[selectedInstallment.status]?.variant || 'info'}>
                                {statusMap[selectedInstallment.status]?.label || selectedInstallment.status}
                              </StatusBadge>
                            </div>
                          </div>
                          {/* Informações de Suporte */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-blue-700 mt-1">
                                  A implementar...
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>

          {/* Modal de Pagamento */}
          <Transition appear show={isPaymentModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsPaymentModalOpen(false)}>
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
                    <Dialog.Panel className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          Pagar Parcela
                        </Dialog.Title>
                      </div>

                      {selectedInstallmentForPayment && (
                        <div className="p-6">
                          {/* Informações da Parcela */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="text-center">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {selectedInstallmentForPayment.installmentNumber}º Parcela
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                {selectedInstallmentForPayment.payment.clientPlan.plan.name}
                              </p>
                              <div className="text-3xl font-bold text-green-600 mb-2">
                                {formatPrice(selectedInstallmentForPayment.amount)}
                              </div>
                              <div className="text-sm text-gray-600">
                                Vencimento: {formatDate(selectedInstallmentForPayment.dueDate)}
                              </div>
                              {getDaysUntilDue(selectedInstallmentForPayment.dueDate) < 0 && (
                                <div className="text-sm text-red-600 mt-1">
                                  {Math.abs(getDaysUntilDue(selectedInstallmentForPayment.dueDate))} dias em atraso
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Métodos de Pagamento */}
                          <div className="space-y-3 mb-6">
                            <h4 className="font-medium text-gray-900">Escolha a forma de pagamento:</h4>
                            
                            <button
                              onClick={handleGoToPayment}
                              className="w-full p-4 border-2 border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-green-600 font-bold">PIX</span>
                                  </div>
                                  <div className="text-left">
                                    <div className="font-medium text-gray-900">PIX</div>
                                    <div className="text-sm text-gray-600"></div>
                                  </div>
                                </div>
                                <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-green-600" />
                              </div>
                            </button>

                            <button
                              onClick={handleGoToPayment}
                              className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="text-left">
                                    <div className="font-medium text-gray-900">Cartão de Crédito</div>
                                    <div className="text-sm text-gray-600"></div>
                                  </div>
                                </div>
                                <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                              </div>
                            </button>
                          </div>
                          {/* Botões */}
                          <div className="flex space-x-3">
                            <Button
                              type="button"
                              onClick={() => setIsPaymentModalOpen(false)}
                              variant="neutral"
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
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

export default withClientAuth(ClientInstallmentsPage)
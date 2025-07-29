'use client'

declare global {
  interface Window {
    MercadoPago: any
  }
}
import Head from 'next/head'
import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Dialog, Transition } from '@headlessui/react'
import MainLayout from '@/layouts/MainLayout'
import { withClientAuth } from '@/hooks/withClientAuth'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ActionButton } from '@/components/shared/ActionButton'
import { usePagedData } from '@/hooks/usePagedData'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { TokenPayload } from '@/utils/jwtUtils'
import {
  cancelPayment,
  getAllPaymentsByClient,
  getDetailedPaymentSummary,
  PendingPayment,
  DetailedPaymentSummary,
  getPaymentDetails
} from '@/services/paymentService'
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Download,
  Receipt,
  ExternalLink,
  Banknote
} from 'lucide-react'

interface Props {
  user: TokenPayload
}

function ClientPaymentsPage({ user }: Props) {
  const router = useRouter()
  const [payments, setPayments] = useState<PendingPayment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<PendingPayment[]>([])
  const [paymentSummary, setPaymentSummary] = useState<DetailedPaymentSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedPaymentForPayment, setSelectedPaymentForPayment] = useState<PendingPayment | null>(null)

  const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
    PENDING: { label: 'Pendente', variant: 'warning' },
    PROCESSING: { label: 'Processando', variant: 'info' },
    PAID: { label: 'Pago', variant: 'success' },
    OVERDUE: { label: 'Em Atraso', variant: 'error' },
    CANCELLED: { label: 'Cancelado', variant: 'info' },
    REFUNDED: { label: 'Reembolsado', variant: 'info' },
  }

  const paymentMethodMap: Record<string, string> = {
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
    PIX: 'PIX',
    BANK_SLIP: 'Boleto',
    BANK_TRANSFER: 'Transferência'
  }

  const { currentPage, totalPages, paginatedData, goToPage, resetToFirstPage } =
    usePagedData(filteredPayments, 8)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('pt-BR')
  }

  const getDaysUntilDue = (dueDate: Date | string) => {
    const dateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
    const today = new Date()
    const diffTime = dateObj.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getPaymentInfo = (dueDate: Date | string, status: string) => {
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
    if (status === 'PROCESSING') return {
      type: 'processing',
      message: 'Processando',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
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
      key: 'planName',
      header: 'Plano',
      render: (_: any, item: PendingPayment) => (
        <div>
          <div className="font-semibold text-gray-900">
            {item.clientPlan.plan.name}
          </div>
          <div className="text-sm text-gray-600">
            {item.installments > 1 ? `${item.installments}x` : 'À vista'}
            {item.absorbTax && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                Taxa incluída
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'totalAmount',
      header: 'Valor',
      render: (amount: number, item: PendingPayment) => (
        <div>
          <span className="font-bold text-lg text-gray-900">{formatPrice(amount)}</span>
          {item.installments > 1 && (
            <div className="text-sm text-gray-600">
              {item.installments}x de {formatPrice(amount / item.installments)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'paymentMethod',
      header: 'Método',
      render: (method: string) => (
        <div className="flex items-center space-x-2">
          {method === 'PIX' && <Banknote className="h-4 w-4 text-green-600" />}
          {method === 'CREDIT_CARD' && <CreditCard className="h-4 w-4 text-blue-600" />}
          <span className="text-sm text-gray-700">
            {paymentMethodMap[method] || method}
          </span>
        </div>
      )
    },
    {
      key: 'dueDate',
      header: 'Vencimento',
      render: (dueDate: Date | string, item: PendingPayment) => {
        const info = getPaymentInfo(dueDate, item.status)
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
      render: (_: any, item: PendingPayment) => (
        <div className="flex space-x-2">
          <ActionButton
            variant="view"
            onClick={() => handleViewPaymentDetails(item)}
            disabled={isLoading}
          />
          {(item.status === 'PENDING' || item.status === 'OVERDUE') && (
            <>
              <button
                onClick={() => handlePayPayment(item)}
                disabled={isLoading}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                title="Pagar agora"
              >
                Pagar
              </button>
              <button
                onClick={() => handleCancelPayment(item)}
                disabled={isLoading}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                title="Cancelar pagamento"
              >
                Cancelar
              </button>
            </>
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
    loadData()
  }, [])

  useEffect(() => {
    let filtered = [...payments]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(payment =>
        payment.clientPlan.plan.name.toLowerCase().includes(term) ||
        formatPrice(payment.totalAmount).toLowerCase().includes(term) ||
        paymentMethodMap[payment.paymentMethod]?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }

    if (dateFilter !== 'all') {
      const today = new Date()
      filtered = filtered.filter(payment => {
        const daysUntilDue = getDaysUntilDue(payment.dueDate)
        switch (dateFilter) {
          case 'overdue':
            return daysUntilDue < 0 && payment.status !== 'PAID'
          case 'thisMonth':
            const paymentDate = new Date(payment.dueDate)
            return paymentDate.getMonth() === today.getMonth() &&
              paymentDate.getFullYear() === today.getFullYear()
          case 'nextMonth':
            const paymentDate2 = new Date(payment.dueDate)
            return paymentDate2.getMonth() === today.getMonth() + 1 &&
              paymentDate2.getFullYear() === today.getFullYear()
          case 'paid':
            return payment.status === 'PAID'
          default:
            return true
        }
      })
    }

    filtered.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1
      if (b.status === 'PENDING' && a.status !== 'PENDING') return 1
      if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1
      if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1

      const dateA = new Date(a.dueDate)
      const dateB = new Date(b.dueDate)
      return dateA.getTime() - dateB.getTime()
    })

    setFilteredPayments(filtered)
    resetToFirstPage()
  }, [payments, searchTerm, statusFilter, dateFilter])

  async function loadData() {
    setIsLoading(true)
    try {
      const [paymentsData, summaryData] = await Promise.all([
        getAllPaymentsByClient(), // usa a nova função aqui
        getDetailedPaymentSummary()
      ])
      setPayments(paymentsData)
      setPaymentSummary(summaryData)
    } catch (error) {
      toast.error('Erro ao carregar seus pagamentos')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleViewPaymentDetails(payment: PendingPayment) {
    setLoadingDetails(true)
    setSelectedPayment(payment)
    setIsDetailsModalOpen(true)
    setLoadingDetails(false)
  }

  function handlePayPayment(payment: PendingPayment) {
    setSelectedPaymentForPayment(payment)
    setIsPaymentModalOpen(true)
  }

  async function handleDownloadReceipt(paymentId: string) {
    try {
      toast.info('Funcionalidade de download será implementada em breve')
    } catch (error) {
      toast.error('Erro ao baixar comprovante')
    }
  }

  const loadMercadoPagoScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.MercadoPago) {
        resolve()
        return
      }

      const existingScript = document.querySelector('script[src*="mercadopago"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve())
        existingScript.addEventListener('error', () => reject(new Error('Erro ao carregar MercadoPago')))
        return
      }

      const script = document.createElement('script')
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Erro ao carregar MercadoPago'))
      document.head.appendChild(script)
    })
  }

  useEffect(() => {
    if (!selectedPaymentForPayment?.id) return

    const interval = setInterval(async () => {
      const data = await getPaymentDetails(selectedPaymentForPayment?.id)
      console.log('🔄 Verificando status do pagamento:', data)

      if (data.status === 'PAID') {
        clearInterval(interval)
        router.refresh()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedPaymentForPayment?.id])

  async function handleCancelPayment(payment: PendingPayment) {
    if (!window.confirm('Tem certeza que deseja cancelar este pagamento? Essa ação não pode ser desfeita.')) return;

    setIsLoading(true)
    try {
      await cancelPayment(payment.id, 'Cancelado pelo usuário')
      toast.success('Pagamento cancelado com sucesso')
      await loadData()
    } catch (error) {
      toast.error('Erro ao cancelar pagamento')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoToPayment() {
    if (!selectedPaymentForPayment) return

    setIsLoading(true)
    try {
      const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY
      if (!mpPublicKey) {
        toast.error('Chave pública do Mercado Pago não configurada')
        return
      }

      await loadMercadoPagoScript()

      if (!window.MercadoPago) {
        toast.error('Mercado Pago não está disponível. Tente novamente.')
        return
      }

      const preferenceData = {
        items: [
          {
            title: `Assinatura - ${selectedPaymentForPayment.clientPlan.plan.name}`,
            quantity: 1,
            unit_price: selectedPaymentForPayment.totalAmount,
            currency_id: 'BRL'
          }
        ],
        payer: {
          name: user.name?.split(' ')[0] || 'Cliente',
          surname: user.name?.split(' ').slice(1).join(' ') || 'Leiloom',
          email: user.email
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_MP_URL}/installments-client`,
          failure: `${process.env.NEXT_PUBLIC_MP_URL}/installments-client`,
          pending: `${process.env.NEXT_PUBLIC_MP_URL}/installments-client`
        },
        external_reference: `payment_${selectedPaymentForPayment.id}`,
        notification_url: `${process.env.NEXT_PUBLIC_MP_URL}/api/mercadopago/webhook`,
        statement_descriptor: 'Leiloom',
        payment_methods: {
          excluded_payment_types: [],
          excluded_payment_methods: [],
          installments: selectedPaymentForPayment.clientPlan.plan.maxInstallments || 1
        },
        metadata: {
          plan_name: selectedPaymentForPayment.clientPlan.plan.name,
          user_email: user.email,
          payment_id: selectedPaymentForPayment.id,
          client_id: user.clientId,
          installments: selectedPaymentForPayment.clientPlan.plan.maxInstallments || 1,
          absorb_tax: selectedPaymentForPayment.absorbTax
        }
      }
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(preferenceData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || `Erro HTTP: ${response.status}`)
      }

      const { id: preferenceId } = await response.json()

      if (!preferenceId) {
        throw new Error('ID da preferência não retornado')
      }

      const mp = new window.MercadoPago(mpPublicKey, {
        locale: 'pt-BR'
      })

      try {
        await fetch(`/api/payments/${selectedPaymentForPayment.id}/preference`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferenceId })
        }).catch(() => { })
      } catch (e) { }

      mp.checkout({
        preference: {
          id: preferenceId
        },
        autoOpen: true
      })

      setIsPaymentModalOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar pagamento. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const applyHeightFix = () => {
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';

      const root = document.getElementById('root-app');
      if (root) {
        root.style.setProperty('height', '100%', 'important');
      }
    }

    const addMercadoPagoStyles = () => {
      const existingStyle = document.getElementById('mp-custom-styles');
      if (existingStyle) return;

      const style = document.createElement('style');
      style.id = 'root-app';
      style.innerHTML = `
        .layout--modal .layout-main, .layout--modal .layout-main .optimus{
          height: 200vh !important;
          min-height: 500px !important;
        }
      `;
      document.head.appendChild(style);
    }

    applyHeightFix();
    addMercadoPagoStyles();

    return () => {
      document.getElementById('root-app')?.remove();
    };
  }, []);

  const getQuickStats = () => {
    const total = filteredPayments.length
    const pending = filteredPayments.filter(p => p.status === 'PENDING').length
    const paid = filteredPayments.filter(p => p.status === 'PAID').length
    const overdue = filteredPayments.filter(p => p.status === 'OVERDUE' ||
      (p.status === 'PENDING' && getDaysUntilDue(p.dueDate) < 0)).length
    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.totalAmount, 0)
    const paidAmount = filteredPayments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.totalAmount, 0)
    const pendingAmount = filteredPayments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.totalAmount, 0)

    return { total, pending, paid, overdue, totalAmount, paidAmount, pendingAmount }
  }

  const stats = getQuickStats()

  return (
    <MainLayout>
      <Head>
        <title>Meus Pagamentos - Leiloom</title>
        <meta name="description" content="Acompanhe todos os seus pagamentos e assinaturas na plataforma Leiloom" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meus Pagamentos</h1>
                <p className="text-gray-600 mt-1">Acompanhe todos os seus pagamentos e assinaturas</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-center">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Receipt className="h-4 w-4 text-blue-600" />
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
                <p className="text-sm text-gray-600">Pagos</p>
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                  <Input
                    id="search"
                    name="search"
                    type="text"
                    placeholder="Plano, valor, método..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

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
                    <option value="PROCESSING">Processando</option>
                    <option value="PAID">Pago</option>
                    <option value="OVERDUE">Em Atraso</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>

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
                    <option value="paid">Já pagos</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Seus Pagamentos</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredPayments.length} de {payments.length} pagamentos
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
                emptyStateTitle="Nenhum pagamento encontrado."
              />
            </div>
          </div>

          <Transition appear show={isDetailsModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !loadingDetails && setIsDetailsModalOpen(false)}>
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
                          Detalhes do Pagamento
                        </Dialog.Title>
                      </div>

                      {loadingDetails ? (
                        <div className="p-6 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Carregando detalhes...</p>
                        </div>
                      ) : selectedPayment ? (
                        <div className="p-6 space-y-6">
                          <div className="text-center bg-gray-50 rounded-lg p-6">
                            <div className="flex items-center justify-center space-x-3 mb-3">
                              <h2 className="text-2xl font-bold text-gray-900">
                                {selectedPayment.clientPlan.plan.name}
                              </h2>
                              <StatusBadge variant={statusMap[selectedPayment.status]?.variant || 'info'}>
                                {statusMap[selectedPayment.status]?.label || selectedPayment.status}
                              </StatusBadge>
                            </div>
                            <div className="text-3xl font-bold text-green-600 mb-2">
                              {formatPrice(selectedPayment.totalAmount)}
                            </div>
                            {selectedPayment.installments > 1 && (
                              <p className="text-sm text-gray-600">
                                {selectedPayment.installments}x de {formatPrice(selectedPayment.totalAmount / selectedPayment.installments)}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Método de Pagamento</label>
                              <p className="text-gray-900">{paymentMethodMap[selectedPayment.paymentMethod]}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Data de Vencimento</label>
                              <p className="text-gray-900">{formatDate(selectedPayment.dueDate)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Criado em</label>
                              <p className="text-gray-900">{formatDate(selectedPayment.createdAt)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Taxa</label>
                              <p className="text-gray-900">
                                {selectedPayment.absorbTax ? 'Incluída no preço' : 'Adicionada no checkout'}
                              </p>
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                  {selectedPayment.status === 'PENDING' && 'Aguardando confirmação do pagamento.'}
                                  {selectedPayment.status === 'PROCESSING' && 'Pagamento sendo processado pelo Mercado Pago.'}
                                  {selectedPayment.status === 'PAID' && 'Pagamento confirmado! Seu plano está ativo.'}
                                  {selectedPayment.status === 'OVERDUE' && 'Pagamento em atraso. Clique em "Pagar" para regularizar.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={() => setIsDetailsModalOpen(false)}
                            variant="neutral"
                          >
                            Fechar
                          </Button>
                        </div>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>

          <Transition appear show={isPaymentModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsPaymentModalOpen(false)}>
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
                    <Dialog.Panel className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          Pagar Assinatura
                        </Dialog.Title>
                      </div>

                      {selectedPaymentForPayment && (
                        <div className="p-6">
                          <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="text-center">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {selectedPaymentForPayment.clientPlan.plan.name}
                              </h3>
                              <div className="text-3xl font-bold text-green-600 mb-2">
                                {formatPrice(selectedPaymentForPayment.totalAmount)}
                              </div>
                              {selectedPaymentForPayment.installments > 1 && (
                                <div className="text-sm text-gray-600 mb-2">
                                  {selectedPaymentForPayment.installments}x de {formatPrice(selectedPaymentForPayment.totalAmount / selectedPaymentForPayment.installments)}
                                </div>
                              )}
                              <div className="text-sm text-gray-600">
                                Vencimento: {formatDate(selectedPaymentForPayment.dueDate)}
                              </div>
                              {getDaysUntilDue(selectedPaymentForPayment.dueDate) < 0 && (
                                <div className="text-sm text-red-600 mt-1">
                                  {Math.abs(getDaysUntilDue(selectedPaymentForPayment.dueDate))} dias em atraso
                                </div>
                              )}
                              {!selectedPaymentForPayment.absorbTax && (
                                <div className="text-xs text-orange-600 mt-2">
                                  * Taxa do Mercado Pago será adicionada
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3 mb-6">
                            <h4 className="font-medium text-gray-900">Será redirecionado para:</h4>

                            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="text-left">
                                    <div className="font-medium text-gray-900">Mercado Pago</div>
                                    <div className="text-sm text-gray-600">
                                      {selectedPaymentForPayment.paymentMethod === 'PIX' ? 'Pagamento via PIX' :
                                        selectedPaymentForPayment.paymentMethod === 'CREDIT_CARD' ? 'Cartão de Crédito' :
                                          paymentMethodMap[selectedPaymentForPayment.paymentMethod]}
                                    </div>
                                  </div>
                                </div>
                                <ExternalLink className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-3">
                            <Button
                              type="button"
                              onClick={() => setIsPaymentModalOpen(false)}
                              variant="neutral"
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              onClick={handleGoToPayment}
                              variant="primary"
                              className="flex-1"
                              disabled={isLoading}
                            >
                              {isLoading ? 'Carregando...' : 'Ir para Pagamento'}
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

export default withClientAuth(ClientPaymentsPage)
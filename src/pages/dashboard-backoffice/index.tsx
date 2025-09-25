'use client'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/layouts/MainLayout'
import { withBackofficeAuth } from '@/hooks/withBackofficeAuth'
import { TokenPayload } from '@/utils/jwtUtils'
import { getAllClients } from '@/services/clientService'
import { getAllClientUsers } from '@/services/clientUserService'
import { getAllPlans } from '@/services/planService'
import { toast } from 'react-toastify'
import { 
  Users, 
  Building, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  UserCheck,
  FileText,
  BarChart3,
  Calendar
} from 'lucide-react'

interface Props {
  user: TokenPayload
}

interface DashboardStats {
  totalClients: number
  activeClients: number
  pendingClients: number
  totalUsers: number
  totalPlans: number
  activePlans: number
  monthlyRevenue: number
  pendingPayments: number
}

interface RecentActivity {
  id: string
  type: 'client_registered' | 'payment_received' | 'plan_activated' | 'user_created'
  description: string
  timestamp: Date
  status: 'success' | 'warning' | 'info'
}

function DashboardBackOffice({ user }: Props) {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    pendingClients: 0,
    totalUsers: 0,
    totalPlans: 0,
    activePlans: 0,
    monthlyRevenue: 0,
    pendingPayments: 0
  })
  const [recentClients, setRecentClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)

      // Carrega dados em paralelo
      const [clientsResult, usersResult, plansResult] = await Promise.allSettled([
        getAllClients(),
        getAllClientUsers(),
        getAllPlans()
      ])

      let clients: any[] = []
      let users: any[] = []
      let plans: any[] = []

      if (clientsResult.status === 'fulfilled') {
        clients = clientsResult.value
      }

      if (usersResult.status === 'fulfilled') {
        users = usersResult.value
      }

      if (plansResult.status === 'fulfilled') {
        plans = plansResult.value
      }

      // Calcula estatísticas
      const totalClients = clients.length
      const activeClients = clients.filter(c => c.status === 'APPROVED').length
      const pendingClients = clients.filter(c => c.status === 'PENDING').length
      const totalUsers = users.length
      const totalPlans = plans.length
      const activePlans = plans.filter(p => p.isActive).length

      // Simula receita mensal (você pode integrar com dados reais de pagamento)
      const monthlyRevenue = activeClients * 99.90 // Valor exemplo
      const pendingPayments = Math.floor(totalClients * 0.15) // 15% têm pagamentos pendentes

      setStats({
        totalClients,
        activeClients,
        pendingClients,
        totalUsers,
        totalPlans,
        activePlans,
        monthlyRevenue,
        pendingPayments
      })

      // Define clientes recentes (últimos 5)
      const sortedClients = clients
        .sort((a, b) => new Date(b.createdOn || 0).getTime() - new Date(a.createdOn || 0).getTime())
        .slice(0, 5)
      
      setRecentClients(sortedClients)

    } catch (error: any) {
      toast.error('Erro ao carregar dados do dashboard.')
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-100'
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100'
      case 'CONFIRMED':
        return 'text-blue-600 bg-blue-100'
      case 'EXCLUDED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Aprovado'
      case 'PENDING':
        return 'Pendente'
      case 'CONFIRMED':
        return 'Confirmado'
      case 'EXCLUDED':
        return 'Excluído'
      default:
        return status
    }
  }

  return (
    <MainLayout>
      <Head>
        <title>Dashboard BackOffice - Leiloom</title>
        <meta name="description" content="Dashboard BackOffice da Leiloom" />
      </Head>
      <div className="min-h-screen flex justify-center bg-gray-50">
        <section className="py-16 px-4 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard BackOffice
            </h1>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total de Clientes */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-16 mt-1"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
                      <p className="text-sm text-green-600 mt-1">
                        +{stats.activeClients} ativos
                      </p>
                    </>
                  )}
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Clientes Ativos */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-16 mt-1"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {stats.pendingClients} pendentes
                      </p>
                    </>
                  )}
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Receita Mensal */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-24 mt-1"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.monthlyRevenue)}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        +12.5% vs mês anterior
                      </p>
                    </>
                  )}
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Pagamentos Pendentes */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pagamentos Pendentes</p>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-16 mt-1"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-orange-600">{stats.pendingPayments}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Requer atenção
                      </p>
                    </>
                  )}
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Cards Secundários */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Usuários Cadastrados */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Usuários</h3>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900 mb-2">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-600">Total de usuários cadastrados</p>
                </>
              )}
            </div>

            {/* Planos Disponíveis */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Planos</h3>
                <CreditCard className="h-5 w-5 text-gray-400" />
              </div>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900 mb-2">{stats.activePlans}</p>
                  <p className="text-sm text-gray-600">{stats.totalPlans} planos no total</p>
                </>
              )}
            </div>

            {/* Taxa de Conversão */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Conversão</h3>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {stats.totalClients > 0 ? Math.round((stats.activeClients / stats.totalClients) * 100) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Clientes que se tornaram ativos</p>
                </>
              )}
            </div>
          </div>

          {/* Seções Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Clientes Recentes */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Clientes Recentes</h2>
                <button
                  onClick={() => router.push('/clientes')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ver todos
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentClients.length > 0 ? (
                <div className="space-y-3">
                  {recentClients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-sm text-gray-600">{client.email}</p>
                          <p className="text-xs text-gray-500">
                            Cadastrado em {formatDate(client.createdOn)}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(client.status)}`}>
                        {getStatusText(client.status)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Nenhum cliente cadastrado ainda
                </p>
              )}
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/clientes/novo')}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-green-100 rounded flex items-center justify-center">
                        <Building className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium">Novo Cliente</span>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-11">Cadastrar nova empresa</p>
                </button>

                <button
                  onClick={() => router.push('/planos')}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">Gerenciar Planos</span>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-11">Criar e editar planos</p>
                </button>

                <button
                  onClick={() => router.push('/pagamentos')}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-yellow-100 rounded flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-yellow-600" />
                      </div>
                      <span className="font-medium">Relatório Financeiro</span>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-11">Ver pagamentos e receitas</p>
                </button>

                <button
                  onClick={() => router.push('/usuarios')}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-purple-100 rounded flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-medium">Gerenciar Usuários</span>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-11">Administrar usuários do sistema</p>
                </button>

                <button
                  onClick={() => router.push('/relatorios')}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-orange-100 rounded flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="font-medium">Relatórios</span>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-11">Análises e estatísticas detalhadas</p>
                </button>
              </div>
            </div>
          </div>

          {/* Alertas/Notificações */}
          {stats.pendingClients > 0 && (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <h3 className="font-medium text-yellow-800">
                    Atenção: {stats.pendingClients} clientes pendentes de aprovação
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Revise e aprove os novos cadastros para ativar suas contas.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/clientes?status=pending')}
                  className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-medium"
                >
                  Revisar
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  )
}

export default withBackofficeAuth(DashboardBackOffice)
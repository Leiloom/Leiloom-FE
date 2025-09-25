import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { getActivePlans } from '@/services/planService'
import type { Plan } from '@/types/plan'
import { getClientPlansByClientId, activateClientPlan, createClientPlan, ClientPlan } from '@/services/clientPlanService'
import { calculateExpirationDate, getClientPeriodPlansByClientId } from '@/services/clientPeriodPlanService'
import type { ClientPeriodPlan } from '@/services/clientPeriodPlanService'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

export default function ClientPlansTab({ clientId }: { clientId: string }) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([])
  const [periods, setPeriods] = useState<ClientPeriodPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [startsAt, setStartsAt] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [activePlans, cps, periodsData] = await Promise.all([
          getActivePlans(),
          getClientPlansByClientId(clientId),
          getClientPeriodPlansByClientId(clientId)
        ])

        setPlans(activePlans)
        setClientPlans(cps)
        setPeriods(periodsData)

      } catch (error) {
        toast.error('Erro ao carregar planos')
        console.error('Erro ao carregar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (clientId) {
      fetchData()
    }
  }, [clientId])

  useEffect(() => {
    if (!selectedPlanId || !startsAt) return

    const plan = plans.find(p => p.id === selectedPlanId)
    if (plan && plan.durationDays) {
      const expiration = calculateExpirationDate(new Date(startsAt), plan.durationDays)
      setExpiresAt(expiration.toISOString().substring(0, 10)) // yyyy-mm-dd
    }
  }, [selectedPlanId, startsAt, plans])

  async function handleActivatePlan() {
    if (!selectedPlanId || !startsAt || !expiresAt) {
      toast.error('Selecione o plano e as datas corretamente')
      return
    }

    setIsLoading(true)
    try {
      const clientPlan = await createClientPlan({ clientId, planId: selectedPlanId })
      await activateClientPlan(clientPlan.id ?? '', { startsAt, expiresAt }) 

      toast.success('Plano ativado com sucesso!')

      setSelectedPlanId('')
      setStartsAt('')
      setExpiresAt('')

      const [cps, periodsData] = await Promise.all([
        getClientPlansByClientId(clientId),
        getClientPeriodPlansByClientId(clientId)
      ])
      setClientPlans(cps)
      setPeriods(periodsData)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao ativar plano')
      console.error('Erro ao ativar plano:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function formatPrice(price: number): string {
    if (price === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  function getDurationInDays(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId)
  const currentPeriod = periods.find(p => p.isCurrent)

  return (
    <div className="space-y-8">
      {/* Plano Atual Ativo */}
      {currentPeriod && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Plano Ativo Atual</h3>
              <p className="text-sm text-green-700">Este cliente possui um plano ativo no momento</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-700 font-medium">Plano:</span>
              <div className="text-green-900 font-semibold">
                {currentPeriod.clientPlan?.plan?.name || 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-green-700 font-medium">Período:</span>
              <div className="text-green-900 font-semibold">
                {formatDate(currentPeriod.startsAt)} - {formatDate(currentPeriod.expiresAt)}
              </div>
            </div>
            <div>
              <span className="text-green-700 font-medium">Duração:</span>
              <div className="text-green-900 font-semibold">
                {getDurationInDays(currentPeriod.startsAt, currentPeriod.expiresAt)} dias
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seletor de Plano para Ativação */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Ativar Novo Plano</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end text-gray-900">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Plano
            </label>
            <select
              id="plan"
              name="plan"
              value={selectedPlanId}
              onChange={e => setSelectedPlanId(e.target.value)}
              disabled={isLoading}
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-gray-700"
            >
              <option value="">Escolha um plano...</option>
              {plans.map(p => (
                <option key={p.id} value={p.id ?? ''}>
                  {`${p.name} (${p.durationDays} dias) - ${formatPrice(p.price)}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Início
            </label>
            <Input
              id="startsAt"
              name="startsAt"
              type="date"
              value={startsAt}
              onChange={e => setStartsAt(e.target.value)}
              disabled={isLoading}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Término
            </label>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              disabled={true}
            />
          </div>

          <div>
            <Button
              onClick={handleActivatePlan}
              variant="primary"
              disabled={isLoading || !selectedPlanId || !startsAt || !expiresAt}
              className="w-full"
            >
              {isLoading ? 'Ativando...' : 'Ativar Plano'}
            </Button>
          </div>
        </div>

        {/* Informações do plano selecionado */}
        {selectedPlan && startsAt && expiresAt && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">
                  Resumo da Ativação - {selectedPlan.name}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="font-medium">Valor:</span> {formatPrice(selectedPlan.price)}
                  </div>
                  <div>
                    <span className="font-medium">Usuários:</span> {selectedPlan.numberOfUsers || 1}
                  </div>
                  <div>
                    <span className="font-medium">Duração:</span> {getDurationInDays(startsAt, expiresAt)} dias
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span> {selectedPlan.isTrial ? 'Trial' : 'Pago'}
                  </div>
                </div>
                <p className="mt-2 text-xs">
                  ⚠️ Ao ativar este plano, o plano atual será automaticamente desativado.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Histórico de Planos */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Histórico de Planos</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Visualize todos os períodos de planos deste cliente
          </p>
        </div>

        <div className="overflow-x-auto">
          {periods.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h4 className="text-sm font-medium text-gray-900 mb-1">Nenhum histórico encontrado</h4>
              <p className="text-sm text-gray-500">
                Este cliente ainda não possui períodos de planos registrados.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Início
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Término
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duração
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periods
                  .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
                  .map((period) => {
                    const isActive = period.isCurrent
                    const isExpired = !period.isCurrent

                    return (
                      <tr
                        key={period.id}
                        className={`${isActive ? 'bg-green-50' : isExpired ? 'bg-red-50' : 'bg-white'} hover:bg-gray-50 transition-colors`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {period.clientPlan?.plan?.name || 'Plano não encontrado'}
                          </div>
                          {period.clientPlan?.plan?.price && (
                            <div className="text-xs text-gray-500">
                              {formatPrice(period.clientPlan.plan.price)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(period.startsAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(period.expiresAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getDurationInDays(period.startsAt, period.expiresAt)} dias
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ativo
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Desativado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${period.isTrial
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                            }`}>
                            {period.isTrial ? 'Trial' : 'Pago'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Informações Úteis */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Selecione um plano e defina a data de início desejada</p>
              <p>• A data de término será calculada automaticamente baseada na duração do plano</p>
              <p>• O plano atual será desativado e o novo será ativado nas datas especificadas</p>
              <p>• Planos trial são ativados imediatamente, planos pagos requerem confirmação de pagamento</p>
              <p>• O histórico mostra todos os períodos anteriores para referência</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
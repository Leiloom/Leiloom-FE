'use client'

import { useRegisterClient } from '@/contexts/RegisterClientContext'
import { getActivePlans } from '@/services/planService'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plan } from '@/types/plan'
import { acceptTerms, getCurrentTerms } from '@/services/termsService'
import { createSubscriptionOnly } from '@/services/paymentService'

interface StepFourPlansProps {
  onBack: () => void
  onNext?: (selectedPlan: Plan, paymentId: string) => void
}

export default function StepFourPlans({ onBack, onNext }: StepFourPlansProps) {
  const { formData } = useRegisterClient()
  const [loading, setLoading] = useState(false)
  const [plansLoading, setPlansLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)


  const router = useRouter()

  useEffect(() => {
    async function loadPlans() {
      try {
        setPlansLoading(true)
        const activePlans = await getActivePlans()
        setPlans(activePlans)
      } catch (error: any) {
        toast.error(error?.message || 'Erro ao carregar os planos disponíveis.')
        console.error('Erro ao carregar planos:', error)
      } finally {
        setPlansLoading(false)
      }
    }

    loadPlans()
  }, [])

  function formatPrice(price: number): string {
    if (price === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  function generateFeatures(plan: Plan): string[] {
    const features = []

    if (plan.numberOfUsers === 1) {
      features.push('1 usuário')
    } else if ((plan.numberOfUsers ?? 1) > 100) {
      features.push('Usuários ilimitados')
    } else {
      features.push(`${plan.numberOfUsers} usuários`)
    }

    if (plan.isTrial) {
      features.push('Sem suporte')
    } else if (plan.price < 100) {
      features.push('Suporte por e-mail')
    } else if (plan.price < 300) {
      features.push('Suporte rápido')
    } else {
      features.push('Suporte dedicado')
    }

    if (plan.description) {
      features.push(plan.description)
    }

    return features
  }

  async function handleContinue() {
    if (!selectedPlan) {
      toast.error('Selecione um plano para continuar.')
      return
    }
    if (selectedPlan.isTrial) {
      await handleTrialFinish()
    } else {
      if (onNext && typeof onNext === 'function') {
        const currentTerms = await getCurrentTerms()
        if (!currentTerms) {
          toast.error('Nenhum termo de uso disponível.')
          return
        }
        await acceptTerms({
        clientUserId: formData.clientUserId!,
        termsId: currentTerms.id,
      })

        const subscriptionData = await createSubscriptionOnly({
        clientId: formData.clientId,
        planId: selectedPlan.id!,
        installments: 1,
        paymentMethod: 'PIX'
      })
        onNext(selectedPlan, subscriptionData.payment?.id)
      }
    }
  }


  async function handleTrialFinish() {
    if (!selectedPlan || !formData.clientId) return

    setLoading(true)
    try {
      const currentTerms = await getCurrentTerms()
      if (!currentTerms) {
        toast.error('Nenhum termo de uso disponível.')
        return
      }

      await acceptTerms({
        clientUserId: formData.clientUserId!,
        termsId: currentTerms.id,
      })
      const subscriptionData = await createSubscriptionOnly({
        clientId: formData.clientId,
        planId: selectedPlan.id!,
        installments: 1,
        paymentMethod: 'PIX'
      })

      router.push(`/dashboard-client?newSubscription=${subscriptionData.payment?.id || 'trial-created'}`)

    } catch (err: any) {
      console.error('Erro:', err)
      toast.error(err?.message || 'Erro ao ativar plano trial.')
    } finally {
      setLoading(false)
    }
  }

  if (plansLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600">Carregando planos disponíveis...</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        </div>
        <div className="flex justify-between mt-6">
          <button
            onClick={onBack}
            disabled={loading}
            className={`text-sm transition ${loading
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:underline'
              }`}
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-red-600">Nenhum plano disponível no momento.</p>
          <p className="text-gray-600 text-sm mt-2">Tente novamente mais tarde.</p>
        </div>
        <div className="flex justify-between mt-6">
          <button
            onClick={onBack}
            disabled={loading}
            className={`text-sm transition ${loading
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:underline'
              }`}
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600">Selecione o plano que melhor atende às suas necessidades.</p>
      </div>

      {/* Lista de Planos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlan(plan)}
            disabled={loading}
            className={`border rounded-lg p-4 text-gray-600 text-left shadow-sm transition hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${selectedPlan?.id === plan.id
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-300 hover:border-gray-400'
              }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold">{plan.name}</h3>
              {selectedPlan?.id === plan.id && (
                <div className="flex-shrink-0 ml-2">
                  <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <p className="text-yellow-600 font-medium mb-3">
              {formatPrice(plan.price)}
              {plan.price > 0 && '/mês'}
            </p>

            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mb-3">
              {generateFeatures(plan).map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-1">
              {plan.isTrial && (
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Teste Grátis
                </span>
              )}
              {plan.allowInstallments && !plan.isTrial && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Até {plan.maxInstallments}x
                </span>
              )}
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {plan.durationDays} dias
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          disabled={loading}
          className={`text-sm transition ${loading
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:underline'
            }`}
        >
          Voltar
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedPlan || loading}
          className={`px-6 py-2 rounded font-medium transition ${selectedPlan && !loading
            ? 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-sm'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          {selectedPlan?.isTrial
            ? 'Iniciar Período Gratuito'
            : 'Escolher Forma de Pagamento'
          }
        </button>
      </div>
    </div>
  )
}
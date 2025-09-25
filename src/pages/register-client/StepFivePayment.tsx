'use client'

import { useRegisterClient } from '@/contexts/RegisterClientContext'
import { loginClient } from '@/services/authService'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Plan } from '@/types/plan'
import { CheckCircle, CreditCard, AlertCircle } from 'lucide-react'
import { 
  getPaymentDetails 
} from '@/services/paymentService'

interface StepFivePaymentProps {
  selectedPlan: Plan
  paymentId: string
  onBack: () => void
}

export default function StepFivePayment({ selectedPlan, paymentId, onBack }: StepFivePaymentProps) {
  const { formData } = useRegisterClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'initial' | 'processing' | 'completed' | 'failed'>('initial')
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const { login } = useAuthContext()

  useEffect(() => {
    if (selectedPlan && paymentStatus === 'initial') {
      handlePaymentSubmit()
    }
  }, [selectedPlan])

  if (!selectedPlan) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600">Carregando informações do plano...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mt-4"></div>
        </div>
        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  function formatPrice(price: number): string {
    if (price === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  useEffect(() => {
  if (!paymentId) {
    console.log('🔄 Verificando status do pagamento: pagamentoId não encontrado')
    return
  } 

  const interval = setInterval(async () => {
    const data = await getPaymentDetails(paymentId)
    console.log('🔄 Verificando status do pagamento:', data)

    if (data.status === 'PAID') {
      clearInterval(interval)
      console.log('✅ Pagamento aprovado:', data)
      router.push('/dashboard-client')
      router.refresh()
    }
  }, 5000)

  return () => clearInterval(interval)
}, [paymentId])


  function loadMercadoPagoScript(): Promise<void> {
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

  async function createPreference() {
    const preferencePayload = {
      items: [{
        title: `Assinatura - ${selectedPlan.name}`,
        quantity: 1,
        unit_price: selectedPlan.price,
        currency_id: 'BRL'
      }],
      payer: {
        name: formData.companyName || 'Cliente',
        email: formData.email
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_MP_URL}/dashboard-client`,
        failure: `${process.env.NEXT_PUBLIC_MP_URL}/dashboard-client`,
        pending: `${process.env.NEXT_PUBLIC_MP_URL}/dashboard-client`
      },
      external_reference: `payment_${paymentId}`,
      notification_url: `${process.env.NEXT_PUBLIC_MP_URL}/api/mercadopago/webhook`,
      statement_descriptor: 'Leiloom',
      payment_methods: {
        installments: selectedPlan.maxInstallments || 1
      },
      metadata: {
        plan_name: selectedPlan.name,
        user_email: formData.email,
        client_id: formData.clientId,
        plan_id: selectedPlan.id,
        absorb_tax: selectedPlan.absorbTax
      }
    }

    const response = await fetch('/api/mercadopago/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferencePayload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao criar pagamento.')
    }

    const { id } = await response.json()
    return id
  }

  async function openMercadoPagoCheckout(prefId: string) {
    const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY

    if (!window.MercadoPago || !mpPublicKey) {
      throw new Error('Mercado Pago não está disponível')
    }

    const mp = new window.MercadoPago(mpPublicKey, { locale: 'pt-BR' })

    // Configurações para aumentar o popup
    const checkoutConfig = {
      preference: { id: prefId },
      autoOpen: true,
      theme: {
        elementsColor: '#fbbf24',
        headerColor: '#fbbf24'
      },
      modal: {
        width: '600px',
        height: '100%',
        maxHeight: '700px'
      }
    }

    mp.checkout(checkoutConfig)
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
      style.id = 'mp-custom-styles';
      style.innerHTML = `
      .layout-main .mp-checkout-pro,
      .layout-main .mp-checkout-modal {
        height: 80vh !important;
        max-height: 700px !important;
        min-height: 500px !important;
      }

      .layout-main iframe[src*="mercadopago"] {
        height: 80vh !important;
        max-height: 700px !important;
        min-height: 500px !important;
      }
    `;
      document.head.appendChild(style);
    }

    applyHeightFix();
    addMercadoPagoStyles();

    return () => {
      document.getElementById('mp-custom-styles')?.remove();
    };
  }, []);


  async function handlePaymentSubmit() {
    if (loading) return

    setLoading(true)
    setPaymentStatus('processing')

    try {
      await loadMercadoPagoScript()

      // Se já temos um preferenceId, reutilizar
      let prefId = preferenceId
      if (!prefId) {
        prefId = await createPreference()
        setPreferenceId(prefId)
      }

      await openMercadoPagoCheckout(prefId || '')

      setTimeout(() => {
        if (paymentStatus === 'processing') {
          setPaymentStatus('failed')
        }
      }, 3000)

    } catch (error: any) {
      console.error('Erro no pagamento:', error)
      toast.error(error.message || 'Erro ao iniciar pagamento')
      setPaymentStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  const renderInitialOrProcessing = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {paymentStatus === 'initial' ? 'Preparando pagamento...' : 'Aguardando pagamento'}
        </h2>
        <p className="text-gray-600">
          {paymentStatus === 'initial'
            ? 'Carregando Mercado Pago...'
            : 'Complete o pagamento na janela do Mercado Pago que foi aberta.'
          }
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <CreditCard className="h-8 w-8 text-yellow-600 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800 mb-2">{selectedPlan.name}</h3>
            <p className="text-sm text-yellow-700 mb-3">
              {selectedPlan.description}
            </p>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatPrice(selectedPlan.price)}
            </div>
            {selectedPlan.maxInstallments || 1 > 1 && (
              <p className="text-sm text-gray-600">
                Até {selectedPlan.maxInstallments}x no cartão
              </p>
            )}
            {!selectedPlan.absorbTax && (
              <p className="text-xs text-orange-600 mt-2">
                * Taxa do Mercado Pago pode ser adicionada conforme método escolhido
              </p>
            )}
          </div>
        </div>
      </div>

      {paymentStatus === 'processing' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-blue-800 font-medium">Processando pagamento...</p>
          <p className="text-blue-600 text-sm">
            Se a janela do Mercado Pago não abriu ou você a fechou, clique em "Tentar Novamente"
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition disabled:opacity-50"
        >
          Voltar
        </button>

        {paymentStatus === 'processing' && (
          <button
            onClick={handlePaymentSubmit}
            disabled={loading}
            className={`px-6 py-2 rounded-lg transition ${loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-yellow-400 text-black hover:bg-yellow-300'
              }`}
          >
            {loading ? 'Abrindo...' : 'Tentar Novamente'}
          </button>
        )}
      </div>
    </div>
  )

  const renderFailed = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-16 w-16 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Pendente
        </h2>
        <p className="text-gray-600">
          Parece que o pagamento não foi concluído. Você pode tentar novamente.
        </p>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="font-semibold text-orange-800 mb-2">
          {selectedPlan.name}
        </h3>
        <div className="text-2xl font-bold text-gray-900">
          {formatPrice(selectedPlan.price)}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
        >
          Voltar
        </button>
        <button
          onClick={handlePaymentSubmit}
          disabled={loading}
          className={`px-6 py-2 rounded-lg transition ${loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-yellow-400 text-black hover:bg-yellow-300'
            }`}
        >
          {loading ? 'Abrindo...' : 'Tentar Pagamento'}
        </button>
      </div>
    </div>
  )

  const renderCompleted = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Criado!
        </h2>
        <p className="text-gray-600">
          Seu pagamento foi registrado. Aguardando confirmação do Mercado Pago...
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">
          {selectedPlan.name}
        </h3>
        <p className="text-sm text-blue-700">
          Plano será ativado após confirmação do pagamento
        </p>
      </div>

      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      {(paymentStatus === 'initial' || paymentStatus === 'processing') && renderInitialOrProcessing()}
      {paymentStatus === 'failed' && renderFailed()}
      {paymentStatus === 'completed' && renderCompleted()}
    </div>
  )
}


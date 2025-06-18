'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, Calendar, DollarSign, CheckCircle } from 'lucide-react'
import { TokenPayload } from '@/utils/jwtUtils'

interface PaymentSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  user: TokenPayload
}

interface PlanInfo {
  name: string
  price: number
  features: string[]
  durationDays: number
}

export default function PaymentSetupModal({ isOpen, onClose, onComplete, user }: PaymentSetupModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix' | ''>('')
  const [loading, setLoading] = useState(false)
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)

  // Simula carregamento das informações do plano selecionado
  useEffect(() => {
    if (isOpen) {
      // Aqui você faria uma chamada real para buscar o plano do usuário
      setPlanInfo({
        name: 'Plano Profissional',
        price: 149.00,
        features: ['10 usuários', 'Suporte rápido', 'Relatórios avançados'],
        durationDays: 30
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const handlePaymentSubmit = async () => {
    setLoading(true)
    
    // Simula processamento de pagamento
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setCurrentStep(3) // Vai para tela de sucesso
    setLoading(false)
    
    // Após 2 segundos, fecha o modal e chama onComplete
    setTimeout(() => {
      onComplete()
    }, 2000)
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configure seu Pagamento
        </h2>
        <p className="text-gray-600">
          Você selecionou um plano pago. Configure seu método de pagamento para ativar sua assinatura.
        </p>
      </div>

      {planInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">{planInfo.name}</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-yellow-700">Valor mensal:</span>
            <span className="font-bold text-yellow-800">{formatPrice(planInfo.price)}</span>
          </div>
          <ul className="mt-3 text-sm text-yellow-700 list-disc list-inside">
            {planInfo.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Escolha seu método de pagamento:
        </label>
        
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('credit')}
            className={`w-full p-4 border rounded-lg text-left transition ${
              paymentMethod === 'credit'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Cartão de Crédito</p>
                <p className="text-sm text-gray-600">Cobrança recorrente automática</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('pix')}
            className={`w-full p-4 border rounded-lg text-left transition ${
              paymentMethod === 'pix'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">PIX</p>
                <p className="text-sm text-gray-600">Pagamento via PIX (renovação manual)</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
        >
          Cancelar
        </button>
        <button
          onClick={() => setCurrentStep(2)}
          disabled={!paymentMethod}
          className={`px-6 py-2 rounded-lg transition ${
            paymentMethod
              ? 'bg-yellow-400 text-black hover:bg-yellow-300'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continuar
        </button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {paymentMethod === 'credit' ? 'Dados do Cartão' : 'Pagamento via PIX'}
        </h2>
        <p className="text-gray-600">
          {paymentMethod === 'credit' 
            ? 'Insira os dados do seu cartão de crédito'
            : 'Escaneie o QR Code ou copie o código PIX'
          }
        </p>
      </div>

      {paymentMethod === 'credit' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número do Cartão
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validade
              </label>
              <input
                type="text"
                placeholder="MM/AA"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                placeholder="123"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome no Cartão
            </label>
            <input
              type="text"
              placeholder="João Silva"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="bg-gray-100 rounded-lg p-8">
            <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg mx-auto flex items-center justify-center">
              <p className="text-gray-500">QR Code PIX</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Código PIX:</p>
            <p className="font-mono text-sm bg-white p-2 rounded border break-all">
              00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000...
            </p>
            <button className="mt-2 text-yellow-600 hover:text-yellow-700 text-sm font-medium">
              Copiar código
            </button>
          </div>
          
          <p className="text-sm text-gray-600">
            Valor: <strong>{planInfo && formatPrice(planInfo.price)}</strong>
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
        >
          Voltar
        </button>
        <button
          onClick={handlePaymentSubmit}
          disabled={loading}
          className={`px-6 py-2 rounded-lg transition ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-yellow-400 text-black hover:bg-yellow-300'
          }`}
        >
          {loading ? 'Processando...' : paymentMethod === 'credit' ? 'Confirmar Pagamento' : 'Confirmar PIX'}
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Confirmado!
        </h2>
        <p className="text-gray-600">
          Seu plano foi ativado com sucesso. Você já pode aproveitar todos os recursos disponíveis.
        </p>
      </div>

      {planInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">
            {planInfo.name} - Ativo
          </h3>
          <p className="text-sm text-green-700">
            Próximo vencimento: {new Date(Date.now() + planInfo.durationDays * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Redirecionando para o dashboard...
      </p>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step === currentStep
                      ? 'bg-yellow-400'
                      : step < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            {currentStep !== 3 && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </div>
    </div>
  )
}
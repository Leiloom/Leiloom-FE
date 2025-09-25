import { useRouter } from 'next/navigation'
import { Clock   } from 'lucide-react'

export function PaymentPendingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento Pendente
          </h1>
          
          <p className="text-gray-600 mb-6">
            Seu pagamento está sendo processado. Isso pode levar alguns minutos, dependendo do método escolhido.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>PIX:</strong> Normalmente aprovado em até 2 minutos<br />
              <strong>Cartão:</strong> Aprovação imediata<br />
              <strong>Boleto:</strong> Até 3 dias úteis
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/payments')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Acompanhar Pagamento
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Voltar ao Dashboard
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Você será notificado por email assim que o pagamento for confirmado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
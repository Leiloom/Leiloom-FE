import { useRouter } from 'next/navigation'
import {  XCircle,ArrowLeft } from 'lucide-react'

export function PaymentFailurePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pagamento Não Aprovado
          </h1>
          
          <p className="text-gray-600 mb-6">
            Houve um problema com o processamento do seu pagamento. Isso pode acontecer por vários motivos, como dados incorretos ou limite insuficiente.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>O que fazer agora?</strong><br />
              • Verifique os dados do cartão<br />
              • Confirme se há limite disponível<br />
              • Tente novamente ou use outro método
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/payments')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Tentar Novamente
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition font-medium flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Se o problema persistir, entre em contato com nosso suporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

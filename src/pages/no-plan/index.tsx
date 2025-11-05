'use client'
import { useRouter } from 'next/navigation'
import Head from 'next/head'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/shared/Button'
import { AlertTriangle } from 'lucide-react'

export default function NoPlanPage() {
  const router = useRouter()

  return (
    <MainLayout>
      <Head>
        <title>Plano Inativo - Leiloom</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white shadow-lg border rounded-lg max-w-md w-full p-8 text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Acesso Restrito
          </h1>
          <p className="text-gray-600 mb-6">
            Você não possui um plano ativo no momento.
            <br />
            Selecione ou ative um plano para continuar usando a plataforma.
          </p>

          <div className="flex justify-center gap-3">
            <Button variant="primary" onClick={() => router.push('/client-plan-control')}>
              Ver Planos
            </Button>
            <Button variant="neutral" onClick={() => router.push('/')}>
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { loginBackOffice } from '@/services/authService' 
import MainLayout from '@/layouts/MainLayout'
import { useAuthContext } from '@/contexts/AuthContext'
import PasswordField from '@/components/shared/PasswordField'

const schema = z.object({
  login: z.string().min(3, 'Informe usuário ou e-mail'),
  password: z.string().min(6, 'Senha obrigatória'),
})

type FormData = z.infer<typeof schema>

export default function BackOfficeLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { user, login, isLoading } = useAuthContext()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { login: '', password: '' }
  })

  useEffect(() => {
    // Aguarda o loading inicial terminar
    if (isLoading) return

    // Se já está autenticado, redireciona para o dashboard apropriado
    if (user) {
      if (user.context === 'BACKOFFICE') {
        router.push('/dashboard-backoffice')
      } else if (user.context === 'CLIENT') {
        router.push('/dashboard-client') // ou a página principal do cliente
      }
      return
    }

    // Remove tokens existentes apenas após confirmar que não há usuário
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clientToken')
      localStorage.removeItem('backofficeToken')
    }
  }, [user, isLoading, router])

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const token = await loginBackOffice({
        login: data.login,
        password: data.password,
        context: 'BACKOFFICE' as const
      })
      
      login(token, 'BACKOFFICE')
      toast.success('Bem-vindo ao Back-Office!')
      router.push('/dashboard-backoffice')
    } catch (err: any) {
      console.error(err)
      if (err?.response?.status === 401) {
        toast.error('Usuário ou senha inválidos.')
      } else {
        toast.error(err?.message || 'Erro ao fazer login.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando autenticação...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Se está autenticado, não mostra o formulário (redirecionamento já foi feito)
  if (user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecionando...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow-md p-8 rounded w-full max-w-sm space-y-6">
          <h1 className="text-2xl font-bold text-center text-gray-800">Login Back-Office</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-black font-medium mb-1">CPF ou E-mail</label>
              <input
                type="text"
                {...register('login')}
                className="w-full border rounded px-3 py-2 text-black focus:ring-2 focus:ring-yellow-400 outline-none"
                disabled={loading}
              />
              {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-black font-medium mb-1">Senha</label>
              <PasswordField register={register('password')} error={errors.password} disabled={loading} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-black py-2 rounded hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}
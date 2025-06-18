'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { resetPassword, validateResetToken } from '@/services/authService'
import MainLayout from '@/layouts/MainLayout'
import PasswordField from '@/components/shared/PasswordField'

const schema = z.object({
  code: z.string().min(4, 'Código obrigatório'),
  newPassword: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .regex(/[A-Z]/, 'Deve conter uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter uma letra minúscula')
    .regex(/[0-9]/, 'Deve conter um número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter um caractere especial'),
  confirmPassword: z.string().min(6, 'Confirme a senha'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const [validToken, setValidToken] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!token) return 
  
    const validar = async () => {
      try {
        await validateResetToken(token)
        setValidToken(true)
      } catch {
        toast.error('Token inválido ou expirado.')
        router.push('/login')
      }
    }
  
    validar()
  }, [token])

  useEffect(() => {
    if (typeof window !== 'undefined' && (localStorage.getItem('backofficeToken')||localStorage.getItem('clientToken'))) {
      localStorage.removeItem('clientToken')
      localStorage.removeItem('backofficeToken')
    }
  }, [])
  

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await resetPassword({
        token: token!,
        code: data.code,
        newPassword: data.newPassword,
      })

      toast.success('Senha redefinida com sucesso!')
      router.push('/login')
    } catch (err: any) {
      if (err?.response?.status === 401) {
        toast.error('Código inválido ou expirado.')
      } else if (err?.response?.status === 400) {
        toast.error('Código inválido ou expirado.')
      } else if (err?.response?.status === 403) {
        toast.error('Acesso negado.')
      } else if (err?.response?.status === 500) {
        toast.error('Erro interno do servidor.')
      } else {
        toast.error(err?.message || 'Erro ao redefinir senha.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!validToken) return null

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow-md p-8 rounded w-full max-w-md space-y-6">
          <h1 className="text-2xl font-bold text-center text-gray-800">Redefinir Senha</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-black">Código recebido por e-mail</label>
              <input {...register('code')} className="w-full border px-3 py-2 rounded text-black" />
              {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-black">Nova Senha</label>
              <PasswordField register={register('newPassword')} error={errors.newPassword} />
            </div>

            <div>
              <label className="block text-sm text-black">Confirme a nova senha</label>
              <PasswordField register={register('confirmPassword')} error={errors.confirmPassword} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-black py-2 rounded hover:bg-yellow-300 transition"
            >
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}

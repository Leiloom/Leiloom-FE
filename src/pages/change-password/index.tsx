'use client'
import Head from 'next/head'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { requestChangePassword, changePassword } from '@/services/authService'
import MainLayout from '@/layouts/MainLayout'

const schema = z.object({
  currentPassword: z.string().min(6, 'Senha atual obrigatória'),
  code: z.string().min(4, 'Código obrigatório'),
  newPassword: z.string()
    .min(6, 'Mínimo 6 caracteres')
    .regex(/[A-Z]/, '1 letra maiúscula')
    .regex(/[a-z]/, '1 letra minúscula')
    .regex(/[0-9]/, '1 número')
    .regex(/[^A-Za-z0-9]/, '1 caractere especial'),
  confirmPassword: z.string().min(6, 'Confirme a senha'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ChangePasswordPage() {
  const [loadingRequest, setLoadingRequest] = useState(false)
  const [loadingChange, setLoadingChange] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function handleSendCode() {
    setLoadingRequest(true)
    try {
      await requestChangePassword()
      toast.success('Código de verificação enviado para o seu e-mail.')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar código.')
    } finally {
      setLoadingRequest(false)
    }
  }

  async function onSubmit(data: FormData) {
    setLoadingChange(true)
    try {
      // TODO: Replace 'null' with the actual user object if available
      await changePassword(null, {
        currentPassword: data.currentPassword,
        code: data.code,
        newPassword: data.newPassword,
      })
      toast.success('Senha alterada com sucesso!')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao alterar senha.')
    } finally {
      setLoadingChange(false)
    }
  }

  return (
    <MainLayout>
      <Head>
        <title>Alterar Senha - Leiloom</title>
        <meta name="description" content="Altere sua senha na plataforma Leiloom" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow-md p-8 rounded w-full max-w-md space-y-6">
            <h1 className="text-2xl font-bold text-center text-gray-800">Alterar Senha</h1>

            <button
            onClick={handleSendCode}
            disabled={loadingRequest}
            className="text-sm text-yellow-600 hover:underline"
            >
            {loadingRequest ? 'Enviando código...' : 'Enviar código para meu e-mail'}
            </button>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm text-black">Senha atual</label>
                <input type="password" {...register('currentPassword')} className="w-full border px-3 py-2 rounded text-black" />
                {errors.currentPassword && <p className="text-red-500 text-xs">{errors.currentPassword.message}</p>}
            </div>

            <div>
                <label className="block text-sm text-black">Código recebido</label>
                <input {...register('code')} className="w-full border px-3 py-2 rounded text-black" />
                {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
            </div>

            <div>
                <label className="block text-sm text-black">Nova senha</label>
                <input type="password" {...register('newPassword')} className="w-full border px-3 py-2 rounded text-black" />
                {errors.newPassword && <p className="text-red-500 text-xs">{errors.newPassword.message}</p>}
            </div>

            <div>
                <label className="block text-sm text-black">Confirme a nova senha</label>
                <input type="password" {...register('confirmPassword')} className="w-full border px-3 py-2 rounded text-black" />
                {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
            </div>

            <button
                type="submit"
                disabled={loadingChange}
                className="w-full bg-yellow-400 text-black py-2 rounded hover:bg-yellow-300 transition"
            >
                {loadingChange ? 'Alterando...' : 'Alterar senha'}
            </button>
            </form>
        </div>
        </div>
    </MainLayout>
  )
}

'use client'
import Head from 'next/head'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'
import { forgotPassword } from '@/services/authService'
import MainLayout from '@/layouts/MainLayout'

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await forgotPassword({ email: data.email, context: 'CLIENT' }) 
      toast.success('Se houver uma conta com esse e-mail, enviamos as instruções.')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao solicitar redefinição de senha.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && (localStorage.getItem('backofficeToken')||localStorage.getItem('clientToken'))) {
      localStorage.removeItem('clientToken')
      localStorage.removeItem('backofficeToken')
    }
  }, [])

  return (
    <MainLayout>
      <Head>
        <title>Recuperar Senha - Leiloom</title>
        <meta name="description" content="Recupere sua senha na plataforma Leiloom" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow-md p-8 rounded w-full max-w-md space-y-6">
          <h1 className="text-2xl font-bold text-center text-gray-800">Recuperar Senha</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-black">Seu e-mail</label>
              <input
                type="email"
                {...register('email')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-black py-2 rounded hover:bg-yellow-300 transition"
              >
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
          <p className="text-sm text-gray-600 text-center">
            Você receberá um link e um código por e-mail caso exista uma conta associada.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}

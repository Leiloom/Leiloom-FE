'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRegisterClient } from '@/contexts/RegisterClientContext'
import { registerClient, registerClientUser } from '@/services/clientService'
import { toast } from 'react-toastify'
import { useState } from 'react'

const schema = z.object({
  companyName: z.string().min(3, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

export default function StepOneForm({ onNext }: { onNext: () => void }) {
  const { setFormData } = useRegisterClient()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true)
      const client = await registerClient(data.companyName, '')
      const clientUser = await registerClientUser(client.id, data.companyName, data.email, '', '', '')

      setFormData({
        companyName: data.companyName,
        email: data.email,
        clientId: client.id,
        clientUserId: clientUser.id
      })
      
      onNext()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao iniciar o cadastro.')
    }
    finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block mb-1 text-sm text-black">Nome (Pessoal ou Empresarial)</label>
        <input {...register('companyName')} className="w-full border px-3 py-2 rounded text-black" />
        {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
      </div>

      <div>
        <label className="block mb-1 text-sm text-black">Email</label>
        <input type="email" {...register('email')} className="w-full border px-3 py-2 rounded text-black" />
        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
      </div>

      <button
        type="submit"
        className="w-full bg-yellow-400 text-black py-2 rounded hover:bg-yellow-300 flex items-center justify-center"
        disabled={isLoading}
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 mr-2 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        ) : 'Avançar'}
      </button>
    </form>
  )
}

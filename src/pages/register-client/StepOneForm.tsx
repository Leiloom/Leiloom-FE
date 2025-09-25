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
    setIsLoading(true)
    try {
      // 1. Tenta criar o cliente
      const client = await registerClient(data.companyName, data.email, '')
      
      // 2. Tenta criar o usuário do cliente
      const clientUser = await registerClientUser(
        client.id, 
        data.companyName, 
        data.email, 
        '', // password vazio por enquanto
        '', // cpfCnpj vazio por enquanto  
        ''  // phone vazio por enquanto
      )

      // 3. Sucesso - salva dados no contexto
      setFormData({
        companyName: data.companyName,
        email: data.email,
        clientId: client.id,
        clientUserId: clientUser.id
      })
      
      toast.success('Dados iniciais salvos com sucesso!')
      onNext()
      
    } catch (err: any) {
      console.error('Erro no Step 1:', err)
      
      // ✅ SIMPLIFICADO: handleAuthError já trata tudo
      // Só precisa pegar a mensagem e mostrar
      const errorMessage = err?.message || 'Erro ao iniciar o cadastro. Tente novamente.'
      toast.error(errorMessage)
      
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block mb-1 text-sm text-black">Nome (Pessoal ou Empresarial)</label>
        <input 
          {...register('companyName')} 
          disabled={isLoading}
          className="w-full border px-3 py-2 rounded text-black disabled:bg-gray-100 disabled:cursor-not-allowed" 
        />
        {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
      </div>

      <div>
        <label className="block mb-1 text-sm text-black">Email</label>
        <input 
          type="email" 
          {...register('email')} 
          disabled={isLoading}
          className="w-full border px-3 py-2 rounded text-black disabled:bg-gray-100 disabled:cursor-not-allowed" 
        />
        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
      </div>

      <button
        type="submit"
        className="w-full bg-yellow-400 text-black py-2 rounded hover:bg-yellow-300 flex items-center justify-center disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            Criando conta...
          </>
        ) : (
          'Avançar'
        )}
      </button>
    </form>
  )
}
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRegisterClient } from '@/contexts/RegisterClientContext'
import { toast } from 'react-toastify'
import { verifyEmailCode } from '@/services/authService'

const schema = z.object({
  code: z.string().min(4, 'Código obrigatório'),
})

type FormData = z.infer<typeof schema>

export default function StepTwoEmailCode({
  onBack,
  onNext
}: {
  onBack: () => void
  onNext: () => void
}) {
  const { formData } = useRegisterClient()
  if (!formData?.email) return null;
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    try {
      await verifyEmailCode(formData.email, data.code)
      toast.success('Email verificado com sucesso!')
      onNext()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Código inválido ou expirado.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-sm text-gray-700">
        Um código foi enviado para o e-mail <strong>{formData.email}</strong>. Insira abaixo para confirmar:
      </p>

      <div>
        <label className="block mb-1 text-sm text-black">Código de Verificação</label>
        <input
          type="text"
          {...register('code')}
          className="w-full border px-3 py-2 rounded text-black"
        />
        {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-600 hover:underline"
        >
          Voltar
        </button>

        <button
          type="submit"
          className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-300 transition"
        >
          Verificar
        </button>
      </div>
    </form>
  )
}

'use client'

import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRegisterClient } from '@/contexts/RegisterClientContext'
import { acceptTerms, getCurrentTerms } from '@/services/termsService'
import { toast } from 'react-toastify'
import InfoTooltip from '@/components/shared/InfoToolTip'
import PasswordField from '@/components/shared/PasswordField'
import { updateClientUser, updateClient } from '@/services/clientService'
import { loginClient } from '@/services/authService'
import { useAuthContext } from '@/contexts/AuthContext'

const schema = z.object({
  cpfCnpj: z.string().min(11, 'CPF ou CNPJ obrigatório'),
  phone: z.string().min(10, 'Telefone obrigatório'),
  password: z.string()
    .min(6, 'Senha precisa ter pelo menos 6 caracteres')
    .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Deve conter ao menos um número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter ao menos um caractere especial'),
  confirmPassword: z.string().min(6, 'Confirme a senha'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar os Termos de Uso' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})


type FormData = z.infer<typeof schema>

export default function StepThreeDetails({ onNext }: { onNext: () => void }) {
  const [currentTerms, setCurrentTerms] = useState<{ id: string; fileUrl?: string } | null>(null)
  const { login } = useAuthContext()
  const { formData, setFormData } = useRegisterClient()
  if (!formData?.clientUserId) return null;
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cpfCnpj: formData.cpfCnpj,
      phone: formData.phone,
      password: formData.password
    }
  })
  useEffect(() => {
    getCurrentTerms().then(term => {
      if (!term) {
        toast.error('Termo de uso não encontrado.')
        return
      }
      setCurrentTerms(term)
    })
  }, [])

async function onSubmit(data: FormData) {
  try {
    // Faz login
    const token = await loginClient({
      login: formData.email,
      password: formData.password,
      context: 'CLIENT',
    })

    login(token, 'CLIENT')
    
    await acceptTerms({
      clientUserId: formData.clientUserId,
      termsId: currentTerms?.id || '',
    })

    await updateClientUser(
      formData.clientUserId,
      formData.companyName,
      formData.email,
      data.cpfCnpj,     
      data.phone,       
      data.password      
    )

    await updateClient(
      formData.clientId,
      formData.companyName,
      formData.email,
      data.cpfCnpj       
    )

    setFormData(data)
    
    toast.success('Dados salvos com sucesso!')
    onNext()
  } 
  catch (error) {
    console.error('Erro ao salvar dados:', error)
    toast.error('Erro ao salvar dados. Tente novamente.')
  }
}

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block mb-1 text-sm text-black">CPF ou CNPJ</label>
        <input {...register('cpfCnpj')} className="w-full border px-3 py-2 rounded text-black" />
        {errors.cpfCnpj && <p className="text-red-500 text-xs">{errors.cpfCnpj.message}</p>}
      </div>

      <div>
        <label className="block mb-1 text-sm text-black">Telefone</label>
        <input {...register('phone')} className="w-full border px-3 py-2 rounded text-black" />
        {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
      </div>
      <hr className="border-t border-gray-300 my-4" />
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 block mb-1 text-black">
          Senha
          <InfoTooltip
            text={
              <div className="text-xs space-y-1">
                <p>A senha deve conter:</p>
                <ul className="list-disc list-inside pl-2">
                  <li>Pelo menos <strong>6 caracteres</strong></li>
                  <li>Ao menos <strong>uma letra maiúscula</strong></li>
                  <li>Ao menos <strong>uma letra minúscula</strong></li>
                  <li>Ao menos <strong>um número</strong></li>
                  <li>Ao menos <strong>um caractere especial</strong> (ex: !@#$%)</li>
                </ul>
              </div>
            }
          />
        </label>
        <PasswordField register={register('password')} error={errors.password} />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block mb-1 text-sm text-black">Confirme a Senha</label>
        <PasswordField register={register('confirmPassword')} error={errors.confirmPassword} />
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
      </div>

      <div className="flex items-start gap-2">
        <input type="checkbox" {...register('acceptTerms')} className="mt-1" />
        <label className="text-sm text-black">
          Eu li e aceito os{' '}
          {currentTerms?.fileUrl ? (
            <a href={currentTerms.fileUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
              Termos de Uso
            </a>
          ) : (
            <span className="text-gray-500 cursor-not-allowed underline">Termos de Uso</span>
          )}{' '}
          da plataforma.
        </label>
      </div>

      {errors.acceptTerms && <p className="text-red-500 text-xs">{errors.acceptTerms.message}</p>}
      
      <button type="submit" className="w-full bg-yellow-400 text-black py-2 rounded hover:bg-yellow-300">
        Avançar
      </button>
    </form>
  )
}

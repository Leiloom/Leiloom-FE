'use client'

import { useForm, Controller } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRegisterClient } from '@/contexts/RegisterClientContext'
import { acceptTerms, getCurrentTerms } from '@/services/termsService'
import { toast } from 'react-toastify'
import InfoTooltip from '@/components/shared/InfoToolTip'
import PasswordField from '@/components/shared/PasswordField'
import ConfirmPassWordField from '@/components/shared/ConfirmPasswordField'
import { updateClientUser, updateClient } from '@/services/clientService'
import { loginClient } from '@/services/authService'
import { useAuthContext } from '@/contexts/AuthContext'
import CPF from '../../validations/cpf';
import CNPJ from '../../validations/cnpj';
import CNPJAlfanumerico from '../../validations/cnpjAlfanumerico';

const schema = z.object({
  cpfCnpj: z.string()
    .min(11, 'CPF ou CNPJ obrigatório')
    .refine((value) => {
      const cleanedValue = value.replace(/[./-]/g , '').replace(/[^\dA-Z]/gi, '');
        
      if (cleanedValue.length === 11 && /^\d+$/.test(cleanedValue)) {
        return CPF.isValid(value);
      }
      
      if (cleanedValue.length === 14) {
        if (/^\d+$/.test(cleanedValue)) {
          return CNPJ.isValid(value);
        }
        // CNPJ alfanumérico
        return CNPJAlfanumerico.isValid(value);
      }
      
      return false;
    }, { message: 'CPF ou CNPJ inválido' }),
  phone: z.string().min(10, 'Telefone precisa ter no mínimo 10 dígitos')
    .regex(/^\(?\d{2}\)?[\s-]?[\s9]?\d{4}-?\d{4}$/, 'Telefone no formato inválido'),
  password: z.string()
    .min(6, 'Senha precisa ter pelo menos 6 caracteres')
    .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Deve conter ao menos um número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter ao menos um caractere especial'),
  confirmPassword: z.string(),
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
  // helper to progressively format phone to (XX) XXXX-XXXX or (XX) 9XXXX-XXXX
  const formatPhone = (value = '') => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''

    // keep only up to 11 digits (2 area + up to 9 number)
    const cleaned = digits.slice(0, 11)

    // area code
    const area = cleaned.slice(0, 2)
    const rest = cleaned.slice(2)

    if (!rest) return `(${area}`

    // if rest is <= 4 digits show simple block
    if (rest.length <= 4) return `(${area}) ${rest}`

    // if rest has more than 4 digits, split last 4
    const first = rest.slice(0, rest.length - 4)
    const last = rest.slice(-4)

    return `(${area}) ${first}-${last}`
  }

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cpfCnpj: formData.cpfCnpj,
      // store default phone already formatted to the expected mask
      phone: formData.phone ? formatPhone(formData.phone) : '',
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
    
    // await acceptTerms({
    //   clientUserId: formData.clientUserId,
    //   termsId: currentTerms?.id || '',
    // })

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
        <label className="block mb-1 text-sm text-black ">CPF ou CNPJ <span className="text-red-500">*</span></label>
        <input {...register('cpfCnpj')} className="w-full border border-gray-300 rounded px-3 py-2 text-black" />
        {errors.cpfCnpj && <p className="text-red-500 text-xs">{errors.cpfCnpj.message}</p>}
      </div>

      <div>
        <label className="block mb-1 text-sm text-black">Telefone <span className="text-red-500">*</span></label>
        {/* Use Controller so we can format the phone as the user types */}
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <input
              {...field}
              onChange={(e) => {
                  // apply formatting while the user types (keeps optional leading 9)
                  const formatted = formatPhone(e.target.value)
                  field.onChange(formatted)
                }}
              value={field.value ?? ''}
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
            />
          )}
        />
        {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
      </div>
      <hr className="border-t border-gray-300 my-4" />
      <div>
        <label className="flex items-center gap-2 text-sm font-mediu mb-1 text-black">
          Senha <span className="text-red-500">*</span>
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
        <PasswordField register={register('password')} />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block mb-1 text-sm text-black">Confirme a Senha <span className="text-red-500">*</span></label>
        <ConfirmPassWordField register={register('confirmPassword')} />
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

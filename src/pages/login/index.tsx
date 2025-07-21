'use client'
import Head from 'next/head'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { loginClient } from '@/services/authService'
import MainLayout from '@/layouts/MainLayout'
import { useAuthContext } from '@/contexts/AuthContext'
import PasswordField from '@/components/shared/PasswordField'

const schema = z.object({
  personType: z.enum(['PF', 'PJ']),
  login: z.string().min(3, 'Informe CPF, CNPJ ou email'),
  password: z.string().min(6, 'Senha obrigatória'),
  cnpj: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [personType, setPersonType] = useState<'PF' | 'PJ'>('PF')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { user, login, isLoading } = useAuthContext()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      personType: 'PF',
      login: '',
      password: '',
      cnpj: '',
    }
  })
  
  useEffect(() => {
    setValue('personType', personType)
  }, [personType, setValue])

  useEffect(() => {
    // Aguarda o loading inicial terminar
    if (isLoading) return

    // Se já está autenticado, redireciona para o dashboard apropriado
    if (user) {
      if (user.context === 'CLIENT') {
        router.push('/dashboard-client')
      } else if (user.context === 'BACKOFFICE') {
        router.push('/dashboard-backoffice')
      }
      return
    }

    // Remove tokens existentes apenas após confirmar que não há usuário
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clientToken')
      localStorage.removeItem('backofficeToken')
    }
  }, [user, isLoading, router])

  const cnpjValue = watch('cnpj')
  
  useEffect(() => {
    if (isAdmin && cnpjValue) {
      setValue('login', cnpjValue)
    }
  }, [isAdmin, cnpjValue, setValue])

  const handlePersonTypeChange = (type: 'PF' | 'PJ') => {
    if (type === personType) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      setPersonType(type);
      if (type === 'PF') {
        setIsAdmin(false);
        setValue('cnpj', '');
        setValue('login', ''); // Limpa o campo login ao trocar para PF
      } else {
        // Ao trocar para PJ, limpa o campo login
        setValue('login', '');
      }
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 300);
  };

  async function onSubmit(data: FormData) {
    // Validação adicional para PJ
    if (personType === 'PJ' && !data.cnpj?.trim()) {
      toast.error('CNPJ ou E-mail da empresa é obrigatório.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        login: data.login,
        password: data.password,
        context: 'CLIENT' as const, 
        ...(personType === 'PJ' && {
          cnpj: data.cnpj,
          isAdmin,
        }),
      }
      
      const token = await loginClient(payload)
      login(token, 'CLIENT') 
      toast.success('Login realizado com sucesso!')
      router.push('/dashboard-client')
    } catch (err: any) {
      console.error('Erro no login:', err)
      if (err?.response?.status === 401) {
        toast.error('Email ou senha inválidos.')
      } else if (err?.response?.status === 403) {
        toast.error('Acesso negado.')
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
      <Head>
          <title>Login - Leiloom</title>
          <meta name="description" content="Faça login na plataforma Leiloom" />
        </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-16 pb-8">
        <div className="bg-white shadow-lg p-8 rounded-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">Entrar</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de pessoa - Estilizado */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 p-1 rounded-full flex gap-1 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => handlePersonTypeChange('PF')}
                  disabled={loading}
                  className={`flex-1 py-2 px-4 text-sm rounded-full transition-all duration-300 disabled:opacity-50 ${
                    personType === 'PF' 
                      ? 'bg-yellow-400 text-black font-medium shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pessoa Física
                </button>
                <button
                  type="button"
                  onClick={() => handlePersonTypeChange('PJ')}
                  disabled={loading}
                  className={`flex-1 py-2 px-4 text-sm rounded-full transition-all duration-300 disabled:opacity-50 ${
                    personType === 'PJ' 
                      ? 'bg-yellow-400 text-black font-medium shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pessoa Jurídica
                </button>
              </div>
            </div>

            {/* Área de conteúdo dinâmico com transição */}
            <div className={`space-y-4 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              {personType === 'PJ' && (
                <>
                  <div>
                    <label className="block text-sm text-black font-medium mb-1">
                      CNPJ ou E-mail da empresa *
                    </label>
                    <input
                      type="text"
                      {...register('cnpj')}
                      disabled={loading}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Digite o CNPJ ou e-mail da empresa"
                    />
                    {errors.cnpj && <p className="text-red-500 text-xs mt-1">{errors.cnpj.message}</p>}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-black">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          id="isAdmin"
                          checked={isAdmin}
                          disabled={loading}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setIsAdmin(checked)
                            if (checked && cnpjValue) {
                              setValue('login', cnpjValue)
                            } else {
                              setValue('login', '') // Limpa o campo se desmarcar
                            }
                          }}
                          className="sr-only" // Esconde o checkbox original
                        />
                        <div className={`w-5 h-5 border rounded transition-all duration-200 ${
                          isAdmin 
                            ? 'bg-yellow-400 border-yellow-500' 
                            : 'bg-white border-gray-300'
                        } ${loading ? 'opacity-50' : ''}`}>
                          {isAdmin && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto mt-0.5 text-black" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className={loading ? 'opacity-50' : ''}>Sou o administrador</span>
                    </label>
                  </div>
                </>
              )}

              {/* Campo de login apenas visível quando não é administrador em PJ */}
              {!(personType === 'PJ' && isAdmin) && (
                <div>
                  <label className="block text-sm text-black font-medium mb-1">
                    {personType === 'PF' ? 'CPF ou E-mail' : 'CNPJ ou E-mail'} *
                  </label>
                  <input
                    type="text"
                    {...register('login')}
                    disabled={loading}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-black focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder={personType === 'PF' ? 'Digite seu CPF ou e-mail' : 'Digite o CNPJ ou e-mail'}
                  />
                  {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login.message}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm text-black font-medium mb-1">Senha *</label>
                <PasswordField register={register('password')} error={errors.password} disabled={loading} />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div className="flex justify-between items-center text-sm">
                <a 
                  href="/forgot-password" 
                  className={`text-yellow-600 hover:underline font-medium transition-opacity ${
                    loading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  Esqueci a senha
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 text-black py-2.5 rounded-lg hover:bg-yellow-300 focus:ring-4 focus:ring-yellow-200 font-medium transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>

          {/* Separador */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">Ainda não tem uma conta?</p>
              <a
                href="/register-client"
                className="w-full inline-block bg-white text-yellow-600 border-2 border-yellow-400 py-2.5 rounded-lg hover:bg-yellow-50 focus:ring-4 focus:ring-yellow-200 font-medium transition-all duration-300 shadow-sm text-center"
              >
                Criar conta
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
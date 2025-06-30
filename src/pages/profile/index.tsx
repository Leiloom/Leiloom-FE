'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import MainLayout from '@/layouts/MainLayout'
import { useAuthContext } from '@/contexts/AuthContext'
import PasswordField from '@/components/shared/PasswordField'
import { requestChangePassword, changePassword } from '@/services/authService'
import { updateClientUser } from '@/services/clientService'
import { getClientUserById } from '@/services/clientUserService'
import { getUserById, updateUser } from '@/services/userService'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { UserCircleIcon, KeyIcon, PencilIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

// Schema para informações pessoais - CLIENT
const clientInfoSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
})

// Schema para informações pessoais - BACKOFFICE
const backofficeInfoSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
})

// Schema para mudança de senha
const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Senha atual obrigatória'),
  newPassword: z.string()
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .regex(/[A-Z]/, 'Deve conter uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter uma letra minúscula')
    .regex(/[0-9]/, 'Deve conter um número')
    .regex(/[^A-Za-z0-9]/, 'Deve conter um caractere especial'),
  confirmPassword: z.string().min(6, 'Confirme a nova senha'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

// Schema para código de confirmação
const codeSchema = z.object({
  code: z.string().min(4, 'Código obrigatório'),
})

type ClientInfoData = z.infer<typeof clientInfoSchema>
type BackofficeInfoData = z.infer<typeof backofficeInfoSchema>
type PasswordData = z.infer<typeof passwordSchema>
type CodeData = z.infer<typeof codeSchema>

export default function ProfilePage() {
  const { user, updateUserInfo, isLoading } = useAuthContext()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')
  const [editingInfo, setEditingInfo] = useState(false)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [codeRequested, setCodeRequested] = useState(false)
  const [loadingUserData, setLoadingUserData] = useState(false)
  const [requestingNewCode, setRequestingNewCode] = useState(false)
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null)
  const [isCodeExpired, setIsCodeExpired] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: ''
  })
  const [codeValue, setCodeValue] = useState('')

  // Forms separados por contexto
  const clientForm = useForm<ClientInfoData>({
    resolver: zodResolver(clientInfoSchema),
  })

  const backofficeForm = useForm<BackofficeInfoData>({
    resolver: zodResolver(backofficeInfoSchema),
  })

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  })

  const codeForm = useForm<CodeData>({
    resolver: zodResolver(codeSchema),
  })

  const activeForm = user?.context === 'CLIENT' ? clientForm : backofficeForm

  // Timer para expiração do código
  useEffect(() => {
    if (!codeExpiry || isCodeExpired) return

    const timer = setInterval(() => {
      const now = new Date()
      const diff = codeExpiry.getTime() - now.getTime()

      if (diff <= 0) {
        setIsCodeExpired(true)
        setTimeRemaining('Expirado')
        clearInterval(timer)
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(timer)
  }, [codeExpiry, isCodeExpired])

  useEffect(() => {
    // Aguarda o loading inicial terminar
    if (isLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    loadUserData()
  }, [user, isLoading, router])

  const loadUserData = async () => {
    if (!user) return
    
    setLoadingUserData(true)
    try {
      let userData;
      
      if (user.context === 'CLIENT') {
        userData = await getClientUserById(user.sub) 
        clientForm.reset({
          name: userData.name,
          email: userData.email,
          cpfCnpj: userData.cpfCnpj?.toString() || '',
          phone: userData.phone || '',
        })
      } else {
        userData = await getUserById(user.sub) 
        backofficeForm.reset({
          name: userData.name,
          email: userData.email,
        })
      }
      
      setFormData({
        name: userData.name,
        email: userData.email,
        cpfCnpj: user.context === 'CLIENT' && 'cpfCnpj' in userData && userData.cpfCnpj ? userData.cpfCnpj.toString() : '',
        phone: user.context === 'CLIENT' && 'phone' in userData && userData.phone ? userData.phone : ''
      })
      
    } catch (error: any) {
      toast.error('Erro ao carregar dados do usuário')
    } finally {
      setLoadingUserData(false)
    }
  }

  const handleUpdateInfo = async (data: ClientInfoData | BackofficeInfoData) => {
    if (!user) return

    setLoadingInfo(true)
    try {
      if (user.context === 'CLIENT') {
        const clientData = data as ClientInfoData
        await updateClientUser(
          user.sub,
          clientData.name,
          formData.email,
          clientData.cpfCnpj,
          clientData.phone
        )
      } else {
        const backofficeData = data as BackofficeInfoData
        await updateUser(user.sub, {
          name: backofficeData.name,
          email: formData.email,
        })
      }

      updateUserInfo({
        name: data.name,
        email: data.email,
      })

      toast.success('Informações atualizadas com sucesso!')
      setEditingInfo(false)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar informações')
    } finally {
      setLoadingInfo(false)
    }
  }

  // Solicitar código para mudança de senha
  const handleRequestPasswordChange = async () => {
    if (!user) return

    setRequestingNewCode(true)
    try {
      await requestChangePassword(user)
      setCodeRequested(true)
      setIsCodeExpired(false)
      setCodeValue('')
      // Define expiração para 30 minutos a partir de agora
      const expiry = new Date(Date.now() + 30 * 60 * 1000)
      setCodeExpiry(expiry)
      
      toast.success(`Código enviado para seu e-mail! Expira em ${expiry.toLocaleString('pt-BR')}`)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao solicitar código')
    } finally {
      setRequestingNewCode(false)
    }
  }

  // Alterar senha
  const handleChangePassword = async (passwordData: PasswordData, codeData: CodeData) => {
    if (!user) return

    if (isCodeExpired) {
      toast.error('Código expirado. Solicite um novo código.')
      return
    }

    setLoadingPassword(true)
    try {
      await changePassword(user, {
        code: codeData.code,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      toast.success('Senha alterada com sucesso!')
      passwordForm.reset()
      codeForm.reset()
      setCodeRequested(false)
      setCodeValue('')
      setCodeExpiry(null)
      setIsCodeExpired(false)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao alterar senha')
    } finally {
      setLoadingPassword(false)
    }
  }

  // Submissão combinada do formulário de senha
  const handlePasswordSubmit = async () => {
    const passwordData = passwordForm.getValues()
    const codeData = { code: codeValue }

    const passwordValid = await passwordForm.trigger()
    const codeValid = codeValue.length >= 4

    if (!codeValid) {
      toast.error('Código deve ter pelo menos 4 caracteres')
      return
    }

    if (passwordValid && codeValid) {
      await handleChangePassword(passwordData, codeData)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    try {
      if (user.context === 'CLIENT') {
        // Valida os dados do formData antes de enviar
        const validatedData = clientInfoSchema.parse(formData)
        await handleUpdateInfo(validatedData)
      } else {
        // Para backoffice, pega apenas name e email
        const backofficeData = {
          name: formData.name,
          email: formData.email
        }
        const validatedData = backofficeInfoSchema.parse(backofficeData)
        await handleUpdateInfo(validatedData)
      }
    } catch (error: any) {
      if (error.errors) {
        // Mostra erros de validação
        error.errors.forEach((err: any) => {
          toast.error(err.message)
        })
      }
    }
  }

  // Função para formatar role do usuário
  const formatUserRole = (role: string, context: string): string => {
    if (context === 'CLIENT') {
      return role === 'ClientOwner' ? 'Administrador' : 'Assinante'
    }
    return role === 'SuperUser' ? 'Administrador' : 'Operador'
  }

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando perfil...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!user) return null

  const isClient = user.context === 'CLIENT'

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <UserCircleIcon className="h-10 w-10 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
                <p className="text-gray-600">
                  {user.name} • {isClient ? 'Cliente' : 'Back Office'}
                </p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                  isClient ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {formatUserRole(user.role, user.context)}
                </span>
              </div>
              {loadingUserData && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Atualizando...
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('info')}
                  disabled={loadingUserData || loadingInfo}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition flex items-center gap-2 disabled:opacity-50 ${
                    activeTab === 'info'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <PencilIcon className="h-4 w-4" />
                  Informações Pessoais
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  disabled={loadingUserData || loadingPassword}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition flex items-center gap-2 disabled:opacity-50 ${
                    activeTab === 'password'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <KeyIcon className="h-4 w-4" />
                  Alterar Senha
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Tab: Informações Pessoais */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Informações Pessoais</h2>
                    {!editingInfo && (
                      <Button
                        variant="primary"
                        onClick={() => setEditingInfo(true)}
                        disabled={loadingUserData || loadingInfo}
                        className="flex items-center gap-2"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Editar
                      </Button>
                    )}
                  </div>

                  {loadingUserData ? (
                    // Skeleton loading para os campos
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(isClient ? 4 : 2)].map((_, index) => (
                          <div key={index} className="space-y-2">
                            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Digite seu nome"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            disabled={!editingInfo || loadingInfo}
                          />
                          {activeForm.formState.errors.name && (
                            <p className="text-red-500 text-xs mt-1">{activeForm.formState.errors.name.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Digite seu e-mail"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            disabled
                          />
                          {activeForm.formState.errors.email && (
                            <p className="text-red-500 text-xs mt-1">{activeForm.formState.errors.email.message}</p>
                          )}
                        </div>

                        {isClient && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">CPF/CNPJ</label>
                              <Input
                                id="cpfCnpj"
                                name="cpfCnpj"
                                type="text"
                                placeholder="Digite seu CPF ou CNPJ"
                                value={formData.cpfCnpj}
                                onChange={(e) => setFormData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                                disabled={!editingInfo || loadingInfo}
                              />
                              {clientForm.formState.errors.cpfCnpj && (
                                <p className="text-red-500 text-xs mt-1">{clientForm.formState.errors.cpfCnpj.message}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                              <Input
                                id="phone"
                                name="phone"
                                type="text"
                                placeholder="Digite seu telefone"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                disabled={!editingInfo || loadingInfo}
                              />
                              {clientForm.formState.errors.phone && (
                                <p className="text-red-500 text-xs mt-1">{clientForm.formState.errors.phone.message}</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {editingInfo && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          <Button
                            type="submit"
                            variant="primary"
                            disabled={loadingInfo}
                          >
                            {loadingInfo ? (
                              <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Salvando...
                              </span>
                            ) : (
                              'Salvar Alterações'
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="neutral"
                            disabled={loadingInfo}
                            onClick={() => {
                              setEditingInfo(false)
                              loadUserData()
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </form>
                  )}
                </div>
              )}

              {/* Tab: Alterar Senha */}
              {activeTab === 'password' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Alterar Senha</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Formulário de Senha */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Nova Senha</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
                        <PasswordField 
                          register={passwordForm.register('currentPassword')} 
                          error={passwordForm.formState.errors.currentPassword}
                          disabled={loadingPassword || codeRequested}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                        <PasswordField 
                          register={passwordForm.register('newPassword')} 
                          error={passwordForm.formState.errors.newPassword}
                          disabled={loadingPassword || codeRequested}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                        <PasswordField 
                          register={passwordForm.register('confirmPassword')} 
                          error={passwordForm.formState.errors.confirmPassword}
                          disabled={loadingPassword || codeRequested}
                        />
                      </div>

                      {!codeRequested && (
                        <Button
                          variant="primary"
                          onClick={handleRequestPasswordChange}
                          disabled={loadingPassword || requestingNewCode}
                          className="w-full"
                        >
                          {requestingNewCode ? (
                            <span className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Enviando código...
                            </span>
                          ) : (
                            'Solicitar Código de Confirmação'
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Formulário de Código */}
                    {codeRequested && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">Código de Confirmação</h3>
                          
                          {/* Status do código */}
                          <div className="flex items-center gap-2 text-sm">
                            {isCodeExpired ? (
                              <span className="flex items-center gap-1 text-red-600">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                                Código expirado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-green-600">
                                <ClockIcon className="h-4 w-4" />
                                {timeRemaining}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className={`border rounded-lg p-4 ${
                          isCodeExpired ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <p className={`text-sm ${
                            isCodeExpired ? 'text-red-800' : 'text-yellow-800'
                          }`}>
                            {isCodeExpired ? (
                              <>
                                ⏰ O código expirou. Solicite um novo código para continuar.
                              </>
                            ) : (
                              <>
                                📧 Enviamos um código de confirmação para seu e-mail. 
                                {codeExpiry && (
                                  <><br />
                                  <strong>Expira em:</strong> {codeExpiry.toLocaleString('pt-BR')}
                                  </>
                                )}
                              </>
                            )}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Código de Confirmação</label>
                          <Input
                            id="code"
                            name="code"
                            type="text"
                            placeholder="Digite o código de 6 dígitos"
                            value={codeValue}
                            onChange={(e) => setCodeValue(e.target.value)}
                            disabled={loadingPassword || isCodeExpired}
                          />
                        </div>

                        <div className="space-y-3">
                          {!isCodeExpired && (
                            <Button
                              variant="primary"
                              onClick={handlePasswordSubmit}
                              disabled={loadingPassword || !codeValue || isCodeExpired}
                              className="w-full"
                            >
                              {loadingPassword ? (
                                <span className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Alterando...
                                </span>
                              ) : (
                                'Alterar Senha'
                              )}
                            </Button>
                          )}
                          
                          {/* Botão para solicitar novo código */}
                          <Button
                            variant="neutral"
                            onClick={handleRequestPasswordChange}
                            disabled={requestingNewCode || loadingPassword}
                            className="w-full"
                          >
                            {requestingNewCode ? (
                              <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                Enviando novo código...
                              </span>
                            ) : (
                              'Solicitar Novo Código'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
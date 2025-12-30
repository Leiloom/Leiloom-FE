import { api } from './api'

/**
 * Handler centralizado para tratamento de erros de autenticação
 * Mapeia mensagens específicas do backend para UX melhor
 */
export function handleAuthError(error: any, defaultMessage: string = 'Erro ao realizar operação.') {
  const backendMessage = error?.response?.data?.message
  const status = error?.response?.status

  // Mapeamento de mensagens específicas do AuthService para UX melhor
  const messageMap: Record<string, string> = {
    'Usuário não encontrado.': 'Email, CPF ou CNPJ não encontrado.',
    'Usuário ainda não confirmou o e-mail.': 'Confirme seu email antes de fazer login.',
    'Usuário inativo. Entre em contato com o administrador.': 'Sua conta está inativa. Entre em contato com o suporte.',
    'Conta ainda não aprovada.': 'Sua conta ainda está pendente de aprovação.',
    'Credenciais inválidas.': 'Senha incorreta.',
    'Contexto de login inválido.': 'Erro no sistema. Tente novamente.',
    'Código inválido ou expirado.': 'Código de verificação inválido ou expirado.',
    'Senha atual incorreta.': 'A senha atual informada está incorreta.',
    'Token inválido ou expirado.': 'Link de redefinição expirado. Solicite um novo.',
    'Usuário já confirmado': 'Esta conta já foi confirmada anteriormente.',
    'Código inválido': 'Código de confirmação inválido.',
    'Usuário cliente não encontrado.': 'Email não encontrado no sistema.',
  }

  switch (status) {
    case 400:
      return Promise.reject({ 
        message: messageMap[backendMessage] || backendMessage || 'Dados inválidos. Verifique os campos preenchidos.' 
      })

    case 401:
      const userMessage = backendMessage && messageMap[backendMessage] 
        ? messageMap[backendMessage] 
        : (backendMessage || 'Email/CPF/CNPJ ou senha incorretos.')
      return Promise.reject({ message: userMessage })

    case 403:
      return Promise.reject({ 
        message: backendMessage || 'Acesso negado. Verifique suas permissões.' 
      })

    case 404:
      return Promise.reject({ 
        message: messageMap[backendMessage] || backendMessage || 'Recurso não encontrado.' 
      })

    case 409:
      return Promise.reject({ 
        message: backendMessage || 'Conflito de dados. Este email já está em uso.' 
      })

    case 422:
      return Promise.reject({ 
        message: backendMessage || 'Dados inválidos. Verifique os campos preenchidos.' 
      })

    case 429:
      return Promise.reject({ 
        message: 'Muitas tentativas. Tente novamente em alguns minutos.' 
      })

    case 500:
      return Promise.reject({ 
        message: 'Erro interno do servidor. Tente novamente mais tarde.' 
      })

    case 503:
      return Promise.reject({ 
        message: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.' 
      })

    default:
      // Para erros de rede (sem response)
      if (!error?.response) {
        return Promise.reject({ 
          message: 'Erro de conexão. Verifique sua internet e tente novamente.' 
        })
      }

      // Fallback final
      return Promise.reject({ 
        message: messageMap[backendMessage] || backendMessage || defaultMessage 
      })
  }
}

/**
 * Interface para o payload de login de cliente
 */
interface LoginClientPayload {
  login: string
  password: string
  context: 'CLIENT'
  cnpj?: string
  isAdmin?: boolean
}

/**
 * Realiza o login de um cliente
 * @param data Dados de login do cliente
 * @returns Token de acesso
 * @throws Objeto de erro com mensagem formatada de acordo com o backend
 */
export async function loginClient(data: LoginClientPayload) {
  try {
    const response = await api.post('/auth/login-client', data)
    return response.data.access_token
  } catch (error: any) {
    return handleAuthError(error, 'Erro ao realizar login.')
  }
}

/**
 * Interface para o payload de login no BackOffice
 */
interface BackOfficePayload {
  login: string
  password: string
  context: 'BACKOFFICE'
}

/**
 * Realiza o login no BackOffice
 * @param payload Dados de login do BackOffice
 * @returns Token de acesso
 * @throws Objeto de erro com mensagem formatada de acordo com o backend
 */
export async function loginBackOffice(payload: BackOfficePayload) {
  try {
    const response = await api.post('/auth/login-backoffice', payload)
    return response.data.access_token
  } catch (error: any) {
    return handleAuthError(error, 'Erro ao realizar login administrativo.')
  }
}

/**
 * Verifica um código de validação de email
 * @param email Email do usuário
 * @param code Código de verificação enviado ao email
 * @returns Dados da verificação
 * @throws Objeto de erro com mensagem formatada
 */
export async function verifyEmailCode(email: string, code: string) {
  try {
    const response = await api.post('/auth/verify-email-code', { email, code })
    return response.data
  } catch (error: any) {
    return handleAuthError(error, 'Erro ao verificar código de email.')
  }
}

/**
 * Solicita recuperação de senha
 * @param data Objeto contendo email e contexto de aplicação
 * @returns Dados da solicitação de recuperação
 * @throws Erro com mensagem formatada do backend
 */
export async function forgotPassword(data: { email: string; context: 'CLIENT' | 'BACKOFFICE' }) {
  try {
    const response = await api.post('/auth/forgot-password', data)
    return response.data
  } catch (error: any) {
    return handleAuthError(error, 'Erro ao solicitar recuperação de senha.')
  }
}

/**
 * Valida um token de redefinição de senha
 * @param token Token de redefinição de senha
 * @returns Dados da validação do token
 * @throws Erro com mensagem formatada do backend
 */
export async function validateResetToken(token: string) {
  try {
    const response = await api.get(`/auth/validate-reset-token?token=${token}`)
    return response.data
  } catch (error: any) {
    return handleAuthError(error, 'Erro ao validar token de redefinição.')
  }
}

/**
 * Redefine a senha do usuário usando um token de redefinição
 * @param payload Objeto contendo token, código e nova senha
 * @returns Dados da redefinição de senha
 * @throws Erro com mensagem formatada do backend
 */
export async function resetPassword(payload: {
  token: string
  code: string
  newPassword: string
}) {
  try {
    const response = await api.post('/auth/reset-password', payload)
    return response.data
  } catch (error: any) {
    return handleAuthError(error, 'Erro ao redefinir senha.')
  }
}

/**
 * Solicita alteração de senha do usuário logado
 * @param user Dados do usuário do contexto (opcional para compatibilidade)
 * @returns Dados da solicitação de alteração de senha
 * @throws Erro com mensagem formatada do backend
 */
export async function requestChangePassword(user?: any) {
  try {
    const response = await api.post('/auth/change-password-request')
    return response.data
  } catch (error: any) {
    return handleAuthError(error, 'Erro ao solicitar alteração de senha.')
  }
}

/**
 * Altera a senha do usuário logado
 * @param user Dados do usuário do contexto (opcional para compatibilidade)
 * @param payload Objeto contendo senha atual, código e nova senha
 * @returns Dados da alteração de senha
 * @throws Erro com mensagem formatada do backend
 */
export async function changePassword(user: any, payload: {
  currentPassword: string
  code: string
  newPassword: string
}) {
  try {
    const response = await api.post('/auth/change-password', payload)
    return response.data
  } catch (error: any) {
    return handleAuthError(error, 'Erro ao alterar senha.')
  }
}

/**
 * Valida a senha atual do usuário logado
 * @param password Senha atual a validar
 * @returns Objeto com { valid: boolean }
 * @throws Erro com mensagem formatada do backend
 */
export async function validateCurrentPassword(password: string): Promise<{ valid: boolean }> {
  try {
    const response = await api.post('/auth/validate-current-password', { password })
    return response.data
  } catch (error: any) {
    return Promise.reject({ 
      message: 'Senha atual incorreta.' 
    })
  }
}

export interface RequestPasswordResetDto {
  email: string
  context: 'BACKOFFICE' | 'CLIENT'
}

export interface ResetPasswordDto {
  code: string
  token: string
  newPassword: string
}

/**
 * Solicita redefinição de senha (envia email com código)
 */
export async function requestPasswordReset(data: RequestPasswordResetDto): Promise<{ message: string }> {
  try {
    const response = await api.post('/auth/forgot-password', data)
    return response.data
  } catch (error: any) {
    console.error('Erro ao solicitar redefinição de senha:', error)
    return Promise.reject({ message: 'Erro ao solicitar redefinição de senha.' })
  }
}

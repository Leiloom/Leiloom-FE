import { api } from './api'

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
 * @throws Objeto de erro com mensagem formatada de acordo com o status HTTP
 */
export async function loginClient(data: LoginClientPayload) {
  try {
    const response = await api.post('/auth/login-client', data)
    return response.data.access_token
  } catch (error: any) {
    if (error?.response?.status === 401) {
      return Promise.reject({ message: 'Login ou senha inválidos.' })
    }
    if (error?.response?.status === 403) {
      return Promise.reject({ message: 'Acesso negado.' })
    }
    if (error?.response?.status === 409) {
      return Promise.reject({ message: 'Este e-mail já está em uso.' })
    }
    if (error?.response?.status === 500) { 
      return Promise.reject({ message: 'Erro interno do servidor.' })
    }
    // Captura outros erros não mapeados
    return Promise.reject({ message: 'Erro ao realizar login.' })
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
 * @throws Objeto de erro com mensagem formatada de acordo com o status HTTP
 */
export async function loginBackOffice(payload: BackOfficePayload) {
  try {
    const response = await api.post('/auth/login-backoffice', payload)
    return response.data.access_token
  } catch (error: any) {
    if (error?.response?.status === 401) {
      return Promise.reject({ message: 'Login ou senha inválidos.' })
    }
    if (error?.response?.status === 403) {
      return Promise.reject({ message: 'Acesso negado.' })
    }
    if (error?.response?.status === 409) {
      return Promise.reject({ message: 'Este e-mail já está em uso.' })
    }
    if (error?.response?.status === 500) { 
      return Promise.reject({ message: 'Erro interno do servidor.' })
    }
    // Captura outros erros não mapeados
    return Promise.reject({ message: 'Erro ao realizar login.' })
  }
}

/**
 * Verifica um código de validação de email
 * @param email Email do usuário
 * @param code Código de verificação enviado ao email
 * @returns Dados da verificação
 * @throws Objeto de erro com mensagem padrão
 */
export async function verifyEmailCode(email: string, code: string) {
  try {
    const response = await api.post('/auth/verify-email-code', { email, code })
    return response.data
  } catch (error: any) {
    console.error('Erro ao verificar código de email:', error)
    return Promise.reject({ message: 'Erro ao registrar usuário.' })
  }
}

/**
 * Solicita recuperação de senha
 * @param data Objeto contendo email e contexto de aplicação
 * @returns Dados da solicitação de recuperação
 * @throws Erro em caso de falha na requisição
 */
export async function forgotPassword(data: { email: string; context: 'CLIENT' | 'BACKOFFICE' }) {
  try {
    const response = await api.post('/auth/forgot-password', data)
    return response.data
  } catch (error: any) {
    console.error('Erro ao solicitar recuperação de senha:', error)
    if (error?.response?.status === 404) {
      return Promise.reject({ message: 'Email não encontrado.' })
    }
    return Promise.reject({ message: 'Erro ao processar solicitação de recuperação de senha.' })
  }
}

/**
 * Valida um token de redefinição de senha
 * @param token Token de redefinição de senha
 * @returns Dados da validação do token
 * @throws Erro em caso de falha na requisição
 */
export async function validateResetToken(token: string) {
  try {
    return await api.get(`/auth/validate-reset-token?token=${token}`)
  } catch (error: any) {
    console.error('Erro ao validar token de redefinição:', error)
    if (error?.response?.status === 400 || error?.response?.status === 404) {
      return Promise.reject({ message: 'Token inválido ou expirado.' })
    }
    return Promise.reject({ message: 'Erro ao validar token de redefinição de senha.' })
  }
}

/**
 * Redefine a senha do usuário usando um token de redefinição
 * @param payload Objeto contendo token, código e nova senha
 * @returns Dados da redefinição de senha
 * @throws Erro em caso de falha na requisição
 */
export async function resetPassword(payload: {
  token: string
  code: string
  newPassword: string
}) {
  try {
    return await api.post('/auth/reset-password', payload)
  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error)
    if (error?.response?.status === 400) {
      return Promise.reject({ message: 'Dados inválidos para redefinição de senha.' })
    }
    if (error?.response?.status === 404) {
      return Promise.reject({ message: 'Token ou código inválido.' })
    }
    return Promise.reject({ message: 'Erro ao redefinir senha.' })
  }
}

/**
 * Solicita alteração de senha do usuário logado (versão que aceita user como parâmetro)
 * @param user Dados do usuário do contexto
 * @returns Dados da solicitação de alteração de senha
 * @throws Erro em caso de falha na requisição
 */
export async function requestChangePassword(user?: any) {
  try {
    const response = await api.post('/auth/change-password-request')
    return response.data
  } catch (error: any) {
    console.error('Erro ao solicitar alteração de senha:', error)
    if (error?.response?.status === 401) {
      return Promise.reject({ message: 'Usuário não autenticado.' })
    }
    return Promise.reject({ message: 'Erro ao solicitar alteração de senha.' })
  }
}



/**
 * Altera a senha do usuário logado (versão que aceita user como parâmetro)
 * @param user Dados do usuário do contexto  
 * @param payload Objeto contendo senha atual, código e nova senha
 * @returns Dados da alteração de senha
 * @throws Erro em caso de falha na requisição
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
    console.error('Erro ao alterar senha:', error)
    if (error?.response?.status === 400) {
      return Promise.reject({ message: 'Dados inválidos para alteração de senha.' })
    }
    if (error?.response?.status === 401) {
      return Promise.reject({ message: 'Senha atual incorreta ou código inválido.' })
    }
    return Promise.reject({ message: 'Erro ao alterar senha.' })
  }
}



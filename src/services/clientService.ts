import { Id } from 'react-toastify'
import { api } from './api'
import { handleAuthError } from './authService' // ✅ IMPORTAR
import Client from '@/services/Interfaces' 
import ClientReduced from '@/services/Interfaces' 

/**
 * Cadastra um novo cliente
 * @param name Nome da empresa
 * @param email Email da empresa
 * @param cpfCnpj CNPJ da empresa
 * @returns Dados do cliente cadastrado
 */
export async function registerClient(name: string, email: string, cpfCnpj: string) {
  try {
    const response = await api.post('/clients', {
      name,
      email,
      cpfCnpj,
    })
    return response.data
  } catch (error: any) {
    // ✅ USAR handleAuthError em vez de tratamento manual
    return handleAuthError(error, 'Erro ao registrar cliente.')
  }
}

/**
 * Atualiza um cliente
 * @param id da empresa
 * @param name Nome da empresa
 * @param email Email da empresa
 * @param cpfCnpj CNPJ da empresa
 * @returns Dados do cliente cadastrado
 */
export async function updateClient(id: Id, name: string, email: string, cpfCnpj: string) {
  try {
    const response = await api.patch(`/clients/${id}`, {
      name,
      email,
      cpfCnpj,
    })
    return response.data
  } catch (error: any) {
    // ✅ USAR handleAuthError
    return handleAuthError(error, 'Erro ao atualizar cliente.')
  }
}

/**
 * Cadastra um usuário para um cliente
 * @param clientId ID do cliente
 * @param name Nome do usuário
 * @param email Email do usuário
 * @param password Senha do usuário
 * @param cpfCnpj CPF ou CNPJ do usuário
 * @param phone Telefone do usuário
 * @returns Dados do usuário cadastrado
 */
export async function registerClientUser(
  clientId: string,
  name: string,
  email: string,
  password: string,
  cpfCnpj: string,
  phone: string,
) {
  try {
    const response = await api.post('/client-users', {
      clientId,
      name,
      email,
      password,
      cpfCnpj,
      phone,
      role: 'ClientOwner',
    })
    return response.data
  } catch (error: any) {
    // ✅ USAR handleAuthError
    return handleAuthError(error, 'Erro ao registrar usuário.')
  }
}

/**
 * Atualiza um usuário para um cliente
 * @param clientId ID do cliente
 * @param name Nome do usuário
 * @param email Email do usuário
 * @param cpfCnpj CPF ou CNPJ do usuário
 * @param phone Telefone do usuário
 * @param password Senha do usuário
 * @returns Dados do usuário cadastrado
 */
export async function updateClientUser(
  clientId: string,
  name: string,
  email: string,
  cpfCnpj: string,
  phone: string,
  password?: string,
) {
  try {
    const response = await api.patch(`/client-users/${clientId}`, {
      name,
      email,
      cpfCnpj,
      phone,
      password,
    })
    
    return response.data
  } catch (error: any) {
    // ✅ USAR handleAuthError
    return handleAuthError(error, 'Erro ao atualizar usuário.')
  }
}

/**
 * Lista todos os clientes
 */
export async function getAllClients(): Promise<Client[]> {
  try {
    const response = await api.get('/clients')
    return response.data
  } catch (error: any) {
    // ✅ USAR handleAuthError
    return handleAuthError(error, 'Erro ao listar os clientes.')
  }
}

/**
 * Busca um cliente por ID
 */
export async function getClientById(id: string): Promise<Client> {
  try {
    const response = await api.get(`/clients/${id}`)
    return response.data
  } catch (error: any) {
    // ✅ USAR handleAuthError
    return handleAuthError(error, 'Erro ao buscar cliente por ID.')
  }
}

/**
 * Atualiza os dados de um cliente
 */
export async function updateClientAll(id: string, data: Partial<Client>) {
  try {
    const dataToUpdate: Partial<ClientReduced> = {
      name: data.name,
      email: data.email,
      cpfCnpj: data.cpfCnpj,
      cep: data.cep,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      country: data.country,
      status: data.status,
      confirmationCode: data.confirmationCode,
      isConfirmed: data.isConfirmed,
      updatedOn: new Date().toISOString(),
    }
    const response = await api.patch(`/clients/${id}`, dataToUpdate)
    return response.data
  } catch (error: any) {
    // ✅ USAR handleAuthError
    return handleAuthError(error, 'Erro ao atualizar cliente.')
  }
}

/**
 * Altera status do cliente para EXCLUDED
 */
export async function excludeClient(id: string) {
  try {
    const response = await api.patch(`/clients/${id}`, { status: 'EXCLUDED' })
    return response.data
  } catch (error: any) {
    // ✅ USAR handleAuthError
    return handleAuthError(error, 'Erro ao excluir cliente.')
  }
}

/**
 * Cria um novo cliente
 * @param client Dados do cliente a ser criado
 * @returns Dados do cliente criado
 */
export async function createClient(client: Omit<Client, 'id' | 'status' | 'isConfirmed' | 'createdOn' | 'updatedOn'>) {
  try {
    const response = await api.post('/clients', {
      ...client,
    })
    return response.data
  } catch (error: any) {
    // ✅ USAR handleAuthError
    return handleAuthError(error, 'Erro ao criar cliente.')
  }
}
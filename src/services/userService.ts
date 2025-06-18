// src/services/userService.ts
import { api } from './api'

export interface User {
  id: string
  name: string
  email: string
  role: string
  createdOn: string
  updatedOn: string
}

export interface UpdateUserDto {
  name?: string
  email?: string
}

/**
 * Busca um usuário do back office por ID
 */
export async function getUserById(id: string): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`)
    return response.data
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error)
    return Promise.reject({ message: 'Erro ao buscar usuário por ID.' })
  }
}

/**
 * Atualiza um usuário do back office
 */
export async function updateUser(id: string, data: UpdateUserDto): Promise<User> {
  try {
    const response = await api.patch(`/users/${id}`, data)
    return response.data
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error)
    return Promise.reject({ message: 'Erro ao atualizar usuário.' })
  }
}

/**
 * Lista todos os usuários (para admin)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await api.get('/users')
    return response?.data
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error)
    return Promise.reject({ message: 'Erro ao listar usuários.' })
  }
}
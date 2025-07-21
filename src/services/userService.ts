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

export interface CreateUserDto {
  name: string
  email: string
  password: string
  role: string
}

export interface UpdateUserDto {
  name?: string
  email?: string
  password?: string
  role?: string
}

/**
 * Cria um novo usuário do back office
 */
export async function createUser(data: CreateUserDto): Promise<User> {
  try {
    const response = await api.post('/users', data)
    return response.data
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error)
    return Promise.reject({ message: 'Erro ao criar usuário.' })
  }
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
 * Remove um usuário do back office
 */
export async function deleteUser(id: string): Promise<void> {
  try {
    await api.delete(`/users/${id}`)
  } catch (error: any) {
    console.error('Erro ao remover usuário:', error)
    return Promise.reject({ message: 'Erro ao remover usuário.' })
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
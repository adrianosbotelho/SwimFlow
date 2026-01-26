import { apiConfig } from '../config/api'
import type { Role, CreateRoleData, UpdateRoleData } from '../types/role'

export const roleService = {
  // Listar todas as funções
  async getAllRoles(): Promise<Role[]> {
    const response = await fetch(`${apiConfig.baseURL}/api/roles`)
    if (!response.ok) {
      throw new Error('Erro ao buscar funções')
    }
    return response.json()
  },

  // Buscar função por ID
  async getRoleById(id: string): Promise<Role> {
    const response = await fetch(`${apiConfig.baseURL}/api/roles/${id}`)
    if (!response.ok) {
      throw new Error('Erro ao buscar função')
    }
    return response.json()
  },

  // Criar nova função
  async createRole(data: CreateRoleData): Promise<Role> {
    const response = await fetch(`${apiConfig.baseURL}/api/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Erro ao criar função')
    }
    return response.json()
  },

  // Atualizar função
  async updateRole(id: string, data: UpdateRoleData): Promise<Role> {
    const response = await fetch(`${apiConfig.baseURL}/api/roles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Erro ao atualizar função')
    }
    return response.json()
  },

  // Desativar função
  async deactivateRole(id: string): Promise<void> {
    const response = await fetch(`${apiConfig.baseURL}/api/roles/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Erro ao desativar função')
    }
  },

  // Reativar função
  async activateRole(id: string): Promise<Role> {
    const response = await fetch(`${apiConfig.baseURL}/api/roles/${id}/activate`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error('Erro ao reativar função')
    }
    return response.json()
  }
}
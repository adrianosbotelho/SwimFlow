import { api } from '../config/api'
import type { Role, CreateRoleData, UpdateRoleData } from '../types/role'

export const roleService = {
  // Listar todas as funções
  async getAllRoles(): Promise<Role[]> {
    const response = await api.get('/roles')
    return response.data
  },

  // Buscar função por ID
  async getRoleById(id: string): Promise<Role> {
    const response = await api.get(`/roles/${id}`)
    return response.data
  },

  // Criar nova função
  async createRole(data: CreateRoleData): Promise<Role> {
    const response = await api.post('/roles', data)
    return response.data
  },

  // Atualizar função
  async updateRole(id: string, data: UpdateRoleData): Promise<Role> {
    const response = await api.put(`/roles/${id}`, data)
    return response.data
  },

  // Desativar função
  async deactivateRole(id: string): Promise<void> {
    await api.delete(`/roles/${id}`)
  },

  // Reativar função
  async activateRole(id: string): Promise<Role> {
    const response = await api.post(`/roles/${id}/activate`)
    return response.data
  }
}
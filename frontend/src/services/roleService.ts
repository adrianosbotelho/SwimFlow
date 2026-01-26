import { apiConfig } from '../config/api'
import type { Role, CreateRoleData, UpdateRoleData } from '../types/role'

export const roleService = {
  // Listar todas as funções
  async getAllRoles(): Promise<Role[]> {
    try {
      console.log('Fetching roles from:', `${apiConfig.baseURL}/api/roles`);
      const response = await fetch(`${apiConfig.baseURL}/api/roles`)
      console.log('Roles response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Roles fetch error:', errorText);
        throw new Error('Erro ao buscar funções')
      }
      
      const data = await response.json();
      console.log('Roles data received:', data);
      return data
    } catch (error) {
      console.error('Error in getAllRoles:', error);
      throw error;
    }
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
    try {
      console.log('Creating role with data:', data);
      console.log('POST URL:', `${apiConfig.baseURL}/api/roles`);
      
      const response = await fetch(`${apiConfig.baseURL}/api/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      console.log('Create role response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create role error:', errorText);
        throw new Error('Erro ao criar função')
      }
      
      const result = await response.json();
      console.log('Role created successfully:', result);
      return result
    } catch (error) {
      console.error('Error in createRole:', error);
      throw error;
    }
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
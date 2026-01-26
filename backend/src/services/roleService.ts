import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateRoleData {
  name: string
  description?: string
}

export interface UpdateRoleData {
  name?: string
  description?: string
  isActive?: boolean
}

export class RoleService {
  // Listar todas as funções ativas
  static async getAllRoles() {
    return await prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  }

  // Buscar função por ID
  static async getRoleById(id: string) {
    return await prisma.role.findUnique({
      where: { id }
    })
  }

  // Buscar função por nome
  static async getRoleByName(name: string) {
    return await prisma.role.findUnique({
      where: { name }
    })
  }

  // Criar nova função
  static async createRole(data: CreateRoleData) {
    // Verificar se já existe uma função com esse nome
    const existingRole = await this.getRoleByName(data.name)
    if (existingRole) {
      throw new Error('Já existe uma função com esse nome')
    }

    return await prisma.role.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null
      }
    })
  }

  // Atualizar função
  static async updateRole(id: string, data: UpdateRoleData) {
    // Verificar se a função existe
    const existingRole = await this.getRoleById(id)
    if (!existingRole) {
      throw new Error('Função não encontrada')
    }

    // Se está alterando o nome, verificar se não existe outro com o mesmo nome
    if (data.name && data.name !== existingRole.name) {
      const roleWithSameName = await this.getRoleByName(data.name)
      if (roleWithSameName) {
        throw new Error('Já existe uma função com esse nome')
      }
    }

    return await prisma.role.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    })
  }

  // Desativar função (soft delete)
  static async deactivateRole(id: string) {
    // Verificar se a função existe
    const existingRole = await this.getRoleById(id)
    if (!existingRole) {
      throw new Error('Função não encontrada')
    }

    // Não permitir desativar funções padrão
    if (['admin', 'professor'].includes(existingRole.name)) {
      throw new Error('Não é possível desativar funções padrão do sistema')
    }

    return await prisma.role.update({
      where: { id },
      data: { isActive: false }
    })
  }

  // Reativar função
  static async activateRole(id: string) {
    return await prisma.role.update({
      where: { id },
      data: { isActive: true }
    })
  }

  // Inicializar funções padrão (para ser chamado no startup)
  static async initializeDefaultRoles() {
    const defaultRoles = [
      { name: 'admin', description: 'Administrador do sistema' },
      { name: 'professor', description: 'Professor de natação' }
    ]

    for (const roleData of defaultRoles) {
      const existingRole = await this.getRoleByName(roleData.name)
      if (!existingRole) {
        await this.createRole(roleData)
      }
    }
  }
}
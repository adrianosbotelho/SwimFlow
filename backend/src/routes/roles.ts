import { Router } from 'express'
import { RoleService, CreateRoleData, UpdateRoleData } from '../services/roleService'
import { authenticateToken } from '../middleware/auth'
import { devAuthenticateToken } from '../middleware/devAuth'

const router = Router()

// Apply authentication middleware to all routes
// Use dev auth in development, real auth in production
const authMiddleware = process.env.NODE_ENV === 'development' ? devAuthenticateToken : authenticateToken
router.use(authMiddleware)

// GET /api/roles - Listar todas as funções
router.get('/', async (req, res) => {
  try {
    const roles = await RoleService.getAllRoles()
    res.json(roles)
  } catch (error) {
    console.error('Error fetching roles:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/roles/:id - Buscar função por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const role = await RoleService.getRoleById(id)
    
    if (!role) {
      return res.status(404).json({ error: 'Função não encontrada' })
    }
    
    res.json(role)
  } catch (error) {
    console.error('Error fetching role:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/roles - Criar nova função
router.post('/', async (req, res) => {
  try {
    const { name, description }: CreateRoleData = req.body

    // Validações básicas
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome da função é obrigatório' })
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Nome da função deve ter pelo menos 2 caracteres' })
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Nome da função deve ter no máximo 100 caracteres' })
    }

    // Validar caracteres especiais
    if (!/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/.test(name.trim())) {
      return res.status(400).json({ error: 'Nome da função contém caracteres inválidos' })
    }

    if (description && description.trim().length > 500) {
      return res.status(400).json({ error: 'Descrição deve ter no máximo 500 caracteres' })
    }

    const role = await RoleService.createRole({
      name: name.trim(),
      description: description?.trim()
    })

    res.status(201).json(role)
  } catch (error) {
    console.error('Error creating role:', error)
    
    if (error instanceof Error && error.message === 'Já existe uma função com esse nome') {
      return res.status(409).json({ error: error.message })
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// PUT /api/roles/:id - Atualizar função
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, isActive }: UpdateRoleData = req.body

    // Validações básicas
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Nome da função é obrigatório' })
      }

      if (name.trim().length < 2) {
        return res.status(400).json({ error: 'Nome da função deve ter pelo menos 2 caracteres' })
      }

      if (name.trim().length > 100) {
        return res.status(400).json({ error: 'Nome da função deve ter no máximo 100 caracteres' })
      }

      // Validar caracteres especiais
      if (!/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/.test(name.trim())) {
        return res.status(400).json({ error: 'Nome da função contém caracteres inválidos' })
      }
    }

    if (description !== undefined && description && description.trim().length > 500) {
      return res.status(400).json({ error: 'Descrição deve ter no máximo 500 caracteres' })
    }

    const role = await RoleService.updateRole(id, {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() }),
      ...(isActive !== undefined && { isActive })
    })

    res.json(role)
  } catch (error) {
    console.error('Error updating role:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Função não encontrada') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message === 'Já existe uma função com esse nome') {
        return res.status(409).json({ error: error.message })
      }
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// DELETE /api/roles/:id - Desativar função
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await RoleService.deactivateRole(id)
    res.status(204).send()
  } catch (error) {
    console.error('Error deactivating role:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Função não encontrada') {
        return res.status(404).json({ error: error.message })
      }
      if (error.message === 'Não é possível desativar funções padrão do sistema') {
        return res.status(400).json({ error: error.message })
      }
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/roles/:id/activate - Reativar função
router.post('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params
    
    const role = await RoleService.activateRole(id)
    res.json(role)
  } catch (error) {
    console.error('Error activating role:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router
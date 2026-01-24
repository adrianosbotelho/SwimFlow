import { Router, Request, Response } from 'express'
import { UserService, CreateUserData, UpdateUserData, UserFilters } from '../services/userService'
import { authenticateToken, requireAdmin, requireProfessorOrAdmin, AuthenticatedRequest } from '../middleware/auth'
import { UserRole } from '@prisma/client'

const router = Router()

// All user routes require authentication
router.use(authenticateToken)

// Create user (admin only)
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: CreateUserData = req.body
    const user = await UserService.createUser(userData)

    res.status(201).json({
      message: 'User created successfully',
      user,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Create user error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Validation error')) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString()
        })
        return
      }

      if (error.message === 'Email already exists') {
        res.status(409).json({
          code: 'DUPLICATE_ENTRY',
          message: 'Email already exists',
          timestamp: new Date().toISOString()
        })
        return
      }
    }

    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to create user',
      timestamp: new Date().toISOString()
    })
  }
})

// Get all users (admin only)
router.get('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: UserFilters = {}
    
    if (req.query.role && typeof req.query.role === 'string') {
      filters.role = req.query.role as UserRole
    }
    
    if (req.query.search && typeof req.query.search === 'string') {
      filters.search = req.query.search
    }

    const users = await UserService.listUsers(filters)

    res.json({
      users,
      total: users.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('List users error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve users',
      timestamp: new Date().toISOString()
    })
  }
})

// Get user by ID (admin or own profile)
router.get('/:id', requireProfessorOrAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Check if user is trying to access their own profile or is admin
    if (req.user?.role !== 'admin' && req.user?.id !== id) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only access your own profile',
        timestamp: new Date().toISOString()
      })
      return
    }

    const user = await UserService.getUser(id)

    if (!user) {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'User not found',
        timestamp: new Date().toISOString()
      })
      return
    }

    res.json({
      user,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve user',
      timestamp: new Date().toISOString()
    })
  }
})

// Update user (admin or own profile)
router.put('/:id', requireProfessorOrAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const updateData: UpdateUserData = req.body

    // Check permissions
    if (req.user?.role !== 'admin' && req.user?.id !== id) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only update your own profile',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Non-admin users cannot change their role
    if (req.user?.role !== 'admin' && updateData.role) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You cannot change your own role',
        timestamp: new Date().toISOString()
      })
      return
    }

    const user = await UserService.updateUser(id, updateData)

    res.json({
      message: 'User updated successfully',
      user,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Update user error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Validation error')) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString()
        })
        return
      }

      if (error.message === 'User not found') {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString()
        })
        return
      }

      if (error.message === 'Email already exists') {
        res.status(409).json({
          code: 'DUPLICATE_ENTRY',
          message: 'Email already exists',
          timestamp: new Date().toISOString()
        })
        return
      }
    }

    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to update user',
      timestamp: new Date().toISOString()
    })
  }
})

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Prevent admin from deleting themselves
    if (req.user?.id === id) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'You cannot delete your own account',
        timestamp: new Date().toISOString()
      })
      return
    }

    await UserService.deleteUser(id)

    res.json({
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Delete user error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString()
        })
        return
      }

      if (error.message.includes('Cannot delete user with associated')) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString()
        })
        return
      }
    }

    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to delete user',
      timestamp: new Date().toISOString()
    })
  }
})

// Get user statistics (admin or own profile)
router.get('/:id/stats', requireProfessorOrAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Check permissions
    if (req.user?.role !== 'admin' && req.user?.id !== id) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only access your own statistics',
        timestamp: new Date().toISOString()
      })
      return
    }

    const stats = await UserService.getUserStats(id)

    res.json({
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get user stats error:', error)
    
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'User not found',
        timestamp: new Date().toISOString()
      })
      return
    }

    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve user statistics',
      timestamp: new Date().toISOString()
    })
  }
})

export default router
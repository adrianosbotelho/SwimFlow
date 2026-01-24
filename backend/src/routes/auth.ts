import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import Joi from 'joi'
import { PrismaClient } from '@prisma/client'
import { AuthService, authenticateToken, AuthenticatedRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
})

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
})

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.details.map(d => d.message),
        timestamp: new Date().toISOString()
      })
      return
    }

    const { email, password } = value

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
        profileImage: true
      }
    })

    if (!user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    }

    const { accessToken, refreshToken } = AuthService.generateTokenPair(tokenPayload)

    // Return user data and tokens
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage
      },
      accessToken,
      refreshToken,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Login failed',
      timestamp: new Date().toISOString()
    })
  }
})

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const { error, value } = refreshTokenSchema.validate(req.body)
    if (error) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Refresh token is required',
        timestamp: new Date().toISOString()
      })
      return
    }

    const { refreshToken } = value

    // Verify refresh token
    const decoded = AuthService.verifyRefreshToken(refreshToken)
    
    if (decoded.type !== 'refresh') {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid token type',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true, profileImage: true }
    })

    if (!user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    }

    const { accessToken, refreshToken: newRefreshToken } = AuthService.generateTokenPair(tokenPayload)

    res.json({
      message: 'Token refreshed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage
      },
      accessToken,
      refreshToken: newRefreshToken,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
        timestamp: new Date().toISOString()
      })
      return
    }

    console.error('Token refresh error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Token refresh failed',
      timestamp: new Date().toISOString()
    })
  }
})

// Logout endpoint (client-side token invalidation)
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // In a production system, you might want to maintain a blacklist of tokens
    // For now, we'll just return success as the client should remove the tokens
    res.json({
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Logout failed',
      timestamp: new Date().toISOString()
    })
  }
})

// Get current user endpoint
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
        timestamp: new Date().toISOString()
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true
      }
    })

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
    console.error('Get current user error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to get user information',
      timestamp: new Date().toISOString()
    })
  }
})

export default router
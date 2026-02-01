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

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  role: Joi.string().valid('admin', 'professor').default('professor')
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

// Register endpoint
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.details.map(d => d.message),
        timestamp: new Date().toISOString()
      })
      return
    }

    const { name, email, password, role } = value

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      res.status(409).json({
        code: 'USER_EXISTS',
        message: 'User with this email already exists',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        createdAt: true
      }
    })

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    }

    const { accessToken, refreshToken } = AuthService.generateTokenPair(tokenPayload)

    // Return user data and tokens
    res.status(201).json({
      message: 'User registered successfully',
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
    console.error('Registration error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Registration failed',
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

// Validation schemas for password recovery
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
})

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
})

// Forgot password endpoint
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const { error, value } = forgotPasswordSchema.validate(req.body)
    if (error) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.details.map(d => d.message),
        timestamp: new Date().toISOString()
      })
      return
    }

    const { email } = value

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true }
    })

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = AuthService.generateResetToken(user.id)
    
    // In a real application, you would send an email here
    // For now, we'll just log the token (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Password reset token for ${user.email}: ${resetToken}`)
      console.log(`Reset URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`)
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to process password reset request',
      timestamp: new Date().toISOString()
    })
  }
})

// Verify reset token endpoint
router.get('/verify-reset-token/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params

    if (!token) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Reset token is required',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Verify reset token
    const decoded = AuthService.verifyResetToken(token)
    
    // Get user email for display
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true }
    })

    if (!user) {
      res.status(400).json({
        valid: false,
        message: 'Invalid or expired reset token',
        timestamp: new Date().toISOString()
      })
      return
    }

    res.json({
      valid: true,
      email: user.email,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      res.status(400).json({
        valid: false,
        message: 'Invalid or expired reset token',
        timestamp: new Date().toISOString()
      })
      return
    }

    console.error('Verify reset token error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to verify reset token',
      timestamp: new Date().toISOString()
    })
  }
})

// Reset password endpoint
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const { error, value } = resetPasswordSchema.validate(req.body)
    if (error) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.details.map(d => d.message),
        timestamp: new Date().toISOString()
      })
      return
    }

    const { token, newPassword } = value

    // Verify reset token
    const decoded = AuthService.verifyResetToken(token)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true }
    })

    if (!user) {
      res.status(400).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired reset token',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Hash new password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    })

    res.json({
      message: 'Password has been reset successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      res.status(400).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired reset token',
        timestamp: new Date().toISOString()
      })
      return
    }

    console.error('Reset password error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to reset password',
      timestamp: new Date().toISOString()
    })
  }
})

export default router
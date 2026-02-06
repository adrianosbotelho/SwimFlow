import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import Joi from 'joi'
import { PrismaClient } from '@prisma/client'
import { AuthService, authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { EmailService } from '../services/emailService'

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
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
})

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
})

const googleLoginSchema = Joi.object({
  credential: Joi.string().required()
})

const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required()
})

const verifyEmailSchema = Joi.object({
  token: Joi.string().required()
})

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const createVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return { token, expires }
}

const ensureVerificationToken = async (userId: string) => {
  const { token, expires } = createVerificationToken()
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpires: expires
    }
  })
  return { token, expires }
}

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
        profileImage: true,
        emailVerified: true
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
    if (!user.passwordHash) {
      res.status(400).json({
        code: 'PASSWORD_LOGIN_NOT_AVAILABLE',
        message: 'Use Google login for this account',
        timestamp: new Date().toISOString()
      })
      return
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      })
      return
    }

    if (!user.emailVerified) {
      const { token } = await ensureVerificationToken(user.id)
      await EmailService.sendVerificationEmail({
        email: user.email,
        name: user.name,
        token
      })

      res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required. Check your inbox.',
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
        profileImage: user.profileImage,
        emailVerified: user.emailVerified
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

    const { name, email, password } = value

    // Determine role based on email - only adrianosbotelho@gmail.com gets admin role
    const role = email.toLowerCase() === 'adrianosbotelho@gmail.com' ? 'admin' : 'professor'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      res.status(409).json({
        code: 'USER_EXISTS',
        message: existingUser.authProvider === 'google' ? 'Account uses Google login' : 'User with this email already exists',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const verification = createVerificationToken()

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        authProvider: 'local',
        emailVerified: false,
        emailVerificationToken: verification.token,
        emailVerificationExpires: verification.expires
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        createdAt: true,
        emailVerified: true
      }
    })

    await EmailService.sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verification.token
    })

    res.status(201).json({
      message: 'Verification email sent. Please confirm your email to continue.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
        emailVerified: user.emailVerified
      },
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
      select: { id: true, email: true, role: true, name: true, profileImage: true, emailVerified: true }
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
        profileImage: user.profileImage,
        emailVerified: user.emailVerified
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

// Verify email endpoint
router.get('/verify-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = verifyEmailSchema.validate(req.query)
    if (error) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Verification token is required',
        timestamp: new Date().toISOString()
      })
      return
    }

    const { token } = value
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() }
      }
    })

    if (!user) {
      res.status(400).json({
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired verification token',
        timestamp: new Date().toISOString()
      })
      return
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    })

    res.json({
      message: 'Email verified successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Verify email error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to verify email',
      timestamp: new Date().toISOString()
    })
  }
})

// Resend verification email
router.post('/resend-verification', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = resendVerificationSchema.validate(req.body)
    if (error) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        timestamp: new Date().toISOString()
      })
      return
    }

    const { email } = value
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true, emailVerified: true }
    })

    if (user && !user.emailVerified) {
      const { token } = await ensureVerificationToken(user.id)
      await EmailService.sendVerificationEmail({
        email: user.email,
        name: user.name,
        token
      })
    }

    res.json({
      message: 'If an account exists, a verification email has been sent.',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to resend verification email',
      timestamp: new Date().toISOString()
    })
  }
})

// Google login endpoint
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = googleLoginSchema.validate(req.body)
    if (error) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        timestamp: new Date().toISOString()
      })
      return
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      res.status(500).json({
        code: 'CONFIG_ERROR',
        message: 'Google login is not configured',
        timestamp: new Date().toISOString()
      })
      return
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: value.credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    if (!payload || !payload.email) {
      res.status(400).json({
        code: 'INVALID_GOOGLE_TOKEN',
        message: 'Invalid Google token',
        timestamp: new Date().toISOString()
      })
      return
    }

    const email = payload.email.toLowerCase()
    const googleId = payload.sub
    const name = payload.name || email.split('@')[0]
    const profileImage = payload.picture || null
    const emailVerified = payload.email_verified ?? true

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }]
      }
    })

    if (!user) {
      const role = email === 'adrianosbotelho@gmail.com' ? 'admin' : 'professor'
      user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: null,
          role,
          profileImage,
          authProvider: 'google',
          googleId,
          emailVerified
        }
      })
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || googleId,
          authProvider: user.authProvider,
          emailVerified: user.emailVerified || emailVerified,
          profileImage: user.profileImage || profileImage
        }
      })
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    }

    const { accessToken, refreshToken } = AuthService.generateTokenPair(tokenPayload)

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
        emailVerified: user.emailVerified
      },
      accessToken,
      refreshToken,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Google login error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Google login failed',
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
        emailVerified: true,
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

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
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

// Change password endpoint (for logged-in users)
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Validate input
    const { error, value } = changePasswordSchema.validate(req.body)
    if (error) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.details.map(d => d.message),
        timestamp: new Date().toISOString()
      })
      return
    }

    const { currentPassword, newPassword } = value

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, passwordHash: true }
    })

    if (!user) {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'User not found',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Verify current password
    if (!user.passwordHash) {
      res.status(400).json({
        code: 'PASSWORD_LOGIN_NOT_AVAILABLE',
        message: 'Use Google login for this account',
        timestamp: new Date().toISOString()
      })
      return
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        code: 'INVALID_PASSWORD',
        message: 'Current password is incorrect',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash)
    if (isSamePassword) {
      res.status(400).json({
        code: 'SAME_PASSWORD',
        message: 'New password must be different from current password',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Hash new password
    const saltRounds = 12
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    })

    res.json({
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to change password',
      timestamp: new Date().toISOString()
    })
  }
})

export default router
    if (!user.emailVerified) {
      res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required',
        timestamp: new Date().toISOString()
      })
      return
    }

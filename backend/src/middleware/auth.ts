import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
  type: 'access' | 'refresh'
}

export class AuthService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key'
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key'
  private static readonly RESET_TOKEN_SECRET = process.env.JWT_RESET_SECRET || 'reset-secret-key'
  private static readonly ACCESS_TOKEN_EXPIRES_IN = '15m'
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d'
  private static readonly RESET_TOKEN_EXPIRES_IN = '1h'

  static generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      this.ACCESS_TOKEN_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRES_IN }
    )
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' },
      this.REFRESH_TOKEN_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    )
  }

  static generateResetToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'reset' },
      this.RESET_TOKEN_SECRET,
      { expiresIn: this.RESET_TOKEN_EXPIRES_IN }
    )
  }

  static verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as JWTPayload
  }

  static verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as JWTPayload
  }

  static verifyResetToken(token: string): { userId: string; type: string } {
    return jwt.verify(token, this.RESET_TOKEN_SECRET) as { userId: string; type: string }
  }

  static generateTokenPair(payload: Omit<JWTPayload, 'type'>) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    }
  }
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Access token is required',
        timestamp: new Date().toISOString()
      })
      return
    }

    const decoded = AuthService.verifyAccessToken(token)
    
    if (decoded.type !== 'access') {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid token type',
        timestamp: new Date().toISOString()
      })
      return
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true, emailVerified: true }
    })

    if (!user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'User not found',
        timestamp: new Date().toISOString()
      })
      return
    }

    if (!user.emailVerified) {
      res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required',
        timestamp: new Date().toISOString()
      })
      return
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      })
      return
    }

    console.error('Authentication error:', error)
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Authentication failed',
      timestamp: new Date().toISOString()
    })
  }
}

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
        timestamp: new Date().toISOString()
      })
      return
    }

    next()
  }
}

export const requireAdmin = requireRole(['admin'])
export const requireProfessorOrAdmin = requireRole(['professor', 'admin'])

// Alias for backward compatibility
export const authMiddleware = authenticateToken

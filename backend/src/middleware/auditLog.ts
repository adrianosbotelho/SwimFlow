import { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './auth'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export const auditLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now()

  res.on('finish', () => {
    if (!MUTATING_METHODS.has(req.method)) {
      return
    }

    const authReq = req as AuthenticatedRequest
    const durationMs = Date.now() - startTime
    const userId = authReq.user?.id || 'anonymous'
    const userRole = authReq.user?.role || 'unknown'

    console.log(
      `[AUDIT] ${new Date().toISOString()} method=${req.method} path=${req.originalUrl} status=${res.statusCode} durationMs=${durationMs} ip=${req.ip} user=${userId} role=${userRole}`
    )
  })

  next()
}

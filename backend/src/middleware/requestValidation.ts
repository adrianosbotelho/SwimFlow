import { Request, Response, NextFunction } from 'express'

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH'])
const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'multipart/form-data',
  'application/x-www-form-urlencoded'
]

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  if (BODY_METHODS.has(req.method)) {
    const contentType = req.headers['content-type'] || ''
    const isAllowed = ALLOWED_CONTENT_TYPES.some(type => contentType.includes(type))

    if (!isAllowed) {
      res.status(415).json({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Content-Type must be application/json, multipart/form-data, or application/x-www-form-urlencoded',
        timestamp: new Date().toISOString()
      })
      return
    }

    if (contentType.includes('application/json')) {
      if (req.body === null || Array.isArray(req.body)) {
        res.status(400).json({
          code: 'INVALID_BODY',
          message: 'Request body must be a JSON object',
          timestamp: new Date().toISOString()
        })
        return
      }
    }
  }

  next()
}

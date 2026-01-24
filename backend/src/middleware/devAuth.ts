import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

// Development middleware that bypasses authentication
export const devAuthenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // In development, create a mock user
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: 'dev-user-1',
      email: 'dev@swimflow.com',
      role: 'professor'
    };
    next();
    return;
  }

  // In production, this should not be used
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Development auth middleware should not be used in production',
    timestamp: new Date().toISOString()
  });
};
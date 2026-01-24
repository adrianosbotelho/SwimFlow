import express from 'express';
import { devAuthenticateToken } from '../middleware/devAuth';

const router = express.Router();

// Test endpoint to check if dev auth is working
router.get('/dev-auth', devAuthenticateToken, (req: any, res) => {
  res.json({
    success: true,
    message: 'Development authentication is working',
    user: req.user,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

export default router;
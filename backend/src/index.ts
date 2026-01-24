import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { productionConfig } from './config/production'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'

// Security middleware
app.use(helmet())

// CORS configuration
const corsOptions = isProduction ? productionConfig.cors : {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}
app.use(cors(corsOptions))

// Rate limiting
const limiter = rateLimit({
  windowMs: isProduction ? productionConfig.security.rateLimitWindowMs : 15 * 60 * 1000,
  max: isProduction ? productionConfig.security.rateLimitMax : 100,
  message: 'Too many requests from this IP, please try again later.',
})
app.use('/api', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Static file serving for uploaded images
app.use('/uploads', express.static('uploads'))

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$queryRaw`SELECT 1`
    await prisma.$disconnect()

    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      version: '1.0.0'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(503).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? error : 'Database connection failed'
    })
  }
})

// Import routes
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import studentRoutes from './routes/students'
import poolRoutes from './routes/pools'
import classRoutes from './routes/classes'
import trainingRoutes from './routes/trainings'
import evaluationRoutes from './routes/evaluations'
import testRoutes from './routes/test'

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/pools', poolRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/trainings', trainingRoutes)
app.use('/api/evaluations', evaluationRoutes)
app.use('/api/test', testRoutes)

app.get('/api', (req, res) => {
  res.json({ 
    message: 'SwimFlow API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message)
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🏊‍♂️ SwimFlow API running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})
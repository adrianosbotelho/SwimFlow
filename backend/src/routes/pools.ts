import express from 'express'
import { PoolService } from '../services/poolService'
import { authenticateToken } from '../middleware/auth'
import { devAuthenticateToken } from '../middleware/devAuth'

const router = express.Router()

// Apply authentication middleware to all routes
// Use dev auth in development, real auth in production
const authMiddleware = process.env.NODE_ENV === 'development' ? devAuthenticateToken : authenticateToken
router.use(authMiddleware)

// GET /api/pools - List pools with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = {
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    }

    const result = await PoolService.listPools(filters)
    
    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Error listing pools:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/pools/stats - Get pool statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await PoolService.getPoolStats()
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('Error getting pool stats:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/pools/:id - Get specific pool
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const pool = await PoolService.getPool(id)
    
    res.json({
      success: true,
      data: pool
    })
  } catch (error: any) {
    console.error('Error getting pool:', error)
    const status = error.message.includes('not found') ? 404 : 500
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// POST /api/pools - Create new pool
router.post('/', async (req, res) => {
  try {
    const pool = await PoolService.createPool(req.body)
    
    res.status(201).json({
      success: true,
      data: pool,
      message: 'Pool created successfully'
    })
  } catch (error: any) {
    console.error('Error creating pool:', error)
    const status = error.message.includes('Validation error') ? 400 : 500
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// PUT /api/pools/:id - Update pool
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const pool = await PoolService.updatePool(id, req.body)
    
    res.json({
      success: true,
      data: pool,
      message: 'Pool updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating pool:', error)
    let status = 500
    if (error.message.includes('not found')) status = 404
    if (error.message.includes('Validation error')) status = 400
    
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// DELETE /api/pools/:id - Delete pool
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await PoolService.deletePool(id)
    
    res.json({
      success: true,
      message: 'Pool deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting pool:', error)
    let status = 500
    if (error.message.includes('not found')) status = 404
    if (error.message.includes('Cannot delete pool')) status = 400
    
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

export default router
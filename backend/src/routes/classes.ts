import express from 'express'
import { ClassService } from '../services/classService'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

// GET /api/classes - List classes with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = {
      search: req.query.search as string,
      professorId: req.query.professorId as string,
      poolId: req.query.poolId as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    }

    const result = await ClassService.listClasses(filters)
    
    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Error listing classes:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/classes/stats - Get class statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await ClassService.getClassStats()
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('Error getting class stats:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/classes/:id - Get specific class
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const classData = await ClassService.getClass(id)
    
    res.json({
      success: true,
      data: classData
    })
  } catch (error: any) {
    console.error('Error getting class:', error)
    const status = error.message.includes('not found') ? 404 : 500
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// POST /api/classes - Create new class
router.post('/', async (req, res) => {
  try {
    const classData = await ClassService.createClass(req.body)
    
    res.status(201).json({
      success: true,
      data: classData,
      message: 'Class created successfully'
    })
  } catch (error: any) {
    console.error('Error creating class:', error)
    let status = 500
    if (error.message.includes('Validation error')) status = 400
    if (error.message.includes('not found')) status = 404
    if (error.message.includes('capacity')) status = 400
    
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// PUT /api/classes/:id - Update class
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const classData = await ClassService.updateClass(id, req.body)
    
    res.json({
      success: true,
      data: classData,
      message: 'Class updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating class:', error)
    let status = 500
    if (error.message.includes('not found')) status = 404
    if (error.message.includes('Validation error')) status = 400
    if (error.message.includes('capacity')) status = 400
    
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// DELETE /api/classes/:id - Delete class
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await ClassService.deleteClass(id)
    
    res.json({
      success: true,
      message: 'Class deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting class:', error)
    const status = error.message.includes('not found') ? 404 : 500
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// POST /api/classes/:id/students/:studentId - Add student to class
router.post('/:id/students/:studentId', async (req, res) => {
  try {
    const { id: classId, studentId } = req.params
    await ClassService.addStudentToClass(classId, studentId)
    
    res.json({
      success: true,
      message: 'Student added to class successfully'
    })
  } catch (error: any) {
    console.error('Error adding student to class:', error)
    let status = 500
    if (error.message.includes('not found')) status = 404
    if (error.message.includes('capacity') || error.message.includes('already enrolled')) status = 400
    
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// DELETE /api/classes/:id/students/:studentId - Remove student from class
router.delete('/:id/students/:studentId', async (req, res) => {
  try {
    const { id: classId, studentId } = req.params
    await ClassService.removeStudentFromClass(classId, studentId)
    
    res.json({
      success: true,
      message: 'Student removed from class successfully'
    })
  } catch (error: any) {
    console.error('Error removing student from class:', error)
    let status = 500
    if (error.message.includes('not enrolled')) status = 404
    
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

export default router
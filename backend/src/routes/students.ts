import express from 'express'
import { StudentService } from '../services/studentService'
import { authenticateToken } from '../middleware/auth'
import { uploadProfileImage, handleUploadError, deleteImageFile, getImageUrl } from '../middleware/upload'
import path from 'path'

const router = express.Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

// GET /api/students - List students with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = {
      search: req.query.search as string,
      level: req.query.level as any,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    }

    const result = await StudentService.listStudents(filters)
    
    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Error listing students:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/students/stats - Get student statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await StudentService.getStudentStats()
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('Error getting student stats:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/students/:id - Get specific student
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const student = await StudentService.getStudent(id)
    
    res.json({
      success: true,
      data: student
    })
  } catch (error: any) {
    console.error('Error getting student:', error)
    const status = error.message.includes('not found') ? 404 : 500
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/students/:id/with-history - Get student with level history
router.get('/:id/with-history', async (req, res) => {
  try {
    const { id } = req.params
    const student = await StudentService.getStudentWithLevelHistory(id)
    
    res.json({
      success: true,
      data: student
    })
  } catch (error: any) {
    console.error('Error getting student with history:', error)
    const status = error.message.includes('not found') ? 404 : 500
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/students/:id/level-history - Get student level history
router.get('/:id/level-history', async (req, res) => {
  try {
    const { id } = req.params
    const levelHistory = await StudentService.getStudentLevelHistory(id)
    
    res.json({
      success: true,
      data: levelHistory
    })
  } catch (error: any) {
    console.error('Error getting level history:', error)
    const status = error.message.includes('not found') ? 404 : 500
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// POST /api/students - Create new student
router.post('/', async (req, res) => {
  try {
    const studentData = {
      ...req.body,
      birthDate: new Date(req.body.birthDate)
    }

    // Get user ID from token for level history tracking
    const userId = (req as any).user?.id

    const student = await StudentService.createStudent(studentData, userId)
    
    res.status(201).json({
      success: true,
      data: student,
      message: 'Student created successfully'
    })
  } catch (error: any) {
    console.error('Error creating student:', error)
    const status = error.message.includes('Validation error') ? 400 : 500
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// PUT /api/students/:id - Update student
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = {
      ...req.body,
      ...(req.body.birthDate && { birthDate: new Date(req.body.birthDate) })
    }

    // Get user ID from token for level change tracking
    const userId = (req as any).user?.id

    const student = await StudentService.updateStudent(id, updateData, userId)
    
    res.json({
      success: true,
      data: student,
      message: 'Student updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating student:', error)
    let status = 500
    if (error.message.includes('not found')) status = 404
    if (error.message.includes('Validation error')) status = 400
    
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// PUT /api/students/:id/change-level - Change student level
router.put('/:id/change-level', async (req, res) => {
  try {
    const { id } = req.params
    const { newLevel, reason } = req.body
    
    // Get user ID from token for tracking who made the change
    const userId = (req as any).user?.id

    const student = await StudentService.changeStudentLevel(id, {
      newLevel,
      reason,
      changedBy: userId
    })
    
    res.json({
      success: true,
      data: student,
      message: 'Student level changed successfully'
    })
  } catch (error: any) {
    console.error('Error changing student level:', error)
    let status = 500
    if (error.message.includes('not found')) status = 404
    if (error.message.includes('Validation error')) status = 400
    
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// DELETE /api/students/:id - Delete student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Get student to check for existing profile image
    const student = await StudentService.getStudent(id)
    
    // Delete the student
    await StudentService.deleteStudent(id)
    
    // Delete associated profile image if it exists
    if (student.profileImage) {
      const imagePath = path.join(process.cwd(), 'uploads', 'profile-images', path.basename(student.profileImage))
      deleteImageFile(imagePath)
    }
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting student:', error)
    const status = error.message.includes('not found') ? 404 : 500
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
})

// POST /api/students/:id/upload-image - Upload profile image
router.post('/:id/upload-image', uploadProfileImage.single('profileImage'), async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      })
    }

    // Get current student to check for existing image
    const currentStudent = await StudentService.getStudent(id)
    
    // Generate image URL
    const imageUrl = getImageUrl(req.file.filename)
    
    // Update student with new image
    const student = await StudentService.updateProfileImage(id, imageUrl)
    
    // Delete old image if it exists
    if (currentStudent.profileImage) {
      const oldImagePath = path.join(process.cwd(), 'uploads', 'profile-images', path.basename(currentStudent.profileImage))
      deleteImageFile(oldImagePath)
    }
    
    res.json({
      success: true,
      data: student,
      message: 'Profile image uploaded successfully'
    })
  } catch (error: any) {
    console.error('Error uploading image:', error)
    
    // Delete uploaded file if there was an error
    if (req.file) {
      deleteImageFile(req.file.path)
    }
    
    const status = error.message.includes('not found') ? 404 : 500
    res.status(status).json({
      success: false,
      error: error.message
    })
  }
}, handleUploadError)

export default router
import request from 'supertest'
import type { Server } from 'http'
import express from 'express'
import cors from 'cors'

// Mock the StudentService
jest.mock('../../services/studentService', () => ({
  StudentService: {
    createStudent: jest.fn(),
    getStudent: jest.fn(),
    listStudents: jest.fn(),
    updateStudent: jest.fn(),
    deleteStudent: jest.fn(),
    getStudentStats: jest.fn(),
    updateProfileImage: jest.fn(),
  }
}))

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: '1', email: 'test@example.com', role: 'professor' }
    next()
  }
}))

jest.mock('../../middleware/devAuth', () => ({
  devAuthenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: '1', email: 'test@example.com', role: 'professor' }
    next()
  }
}))

// Mock upload middleware
jest.mock('../../middleware/upload', () => ({
  uploadProfileImage: {
    single: () => (req: any, res: any, next: any) => next()
  },
  handleUploadError: (req: any, res: any, next: any) => next(),
  deleteImageFile: jest.fn(),
  getImageUrl: jest.fn((filename: string) => `/uploads/profile-images/${filename}`)
}))

const { StudentService } = require('../../services/studentService')
const mockStudentService = StudentService as jest.Mocked<typeof StudentService>

const studentRoutes = require('../students').default

const toJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value))

// Create test app
const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/students', studentRoutes)

let server: Server

beforeAll((done) => {
  server = app.listen(0, '127.0.0.1', done)
})

afterAll((done) => {
  server.close(done)
})

describe('Student Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/students', () => {
    it('should return paginated students list', async () => {
      const mockResult = {
        students: [
          { 
            id: '1', 
            name: 'João Silva', 
            email: 'joao@example.com',
            phone: null,
            birthDate: new Date('2000-01-01'),
            level: 'intermediario' as const,
            objectives: 'Melhorar técnica',
            medicalNotes: null,
            profileImage: null,
            lastEvaluationDate: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      }

      mockStudentService.listStudents.mockResolvedValue(mockResult)

      const response = await request(server)
        .get('/api/students')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: toJson(mockResult)
      })
      expect(mockStudentService.listStudents).toHaveBeenCalledWith({
        search: undefined,
        level: undefined,
        page: undefined,
        limit: undefined
      })
    })

    it('should apply query filters', async () => {
      const mockResult = {
        students: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      }

      mockStudentService.listStudents.mockResolvedValue(mockResult)

      const response = await request(server)
        .get('/api/students')
        .query({ search: 'João', level: 'intermediario', page: 1, limit: 10 })
        .expect(200)

      expect(mockStudentService.listStudents).toHaveBeenCalledWith({
        search: 'João',
        level: 'intermediario',
        page: 1,
        limit: 10
      })
    })
  })

  describe('GET /api/students/:id', () => {
    it('should return student by id', async () => {
      const mockStudent = {
        id: '1',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: null,
        birthDate: new Date('2000-01-01'),
        level: 'intermediario' as const,
        objectives: 'Melhorar técnica',
        medicalNotes: null,
        profileImage: null,
        lastEvaluationDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockStudentService.getStudent.mockResolvedValue(mockStudent)

      const response = await request(server)
        .get('/api/students/1')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: toJson(mockStudent)
      })
      expect(mockStudentService.getStudent).toHaveBeenCalledWith('1')
    })

    it('should return 404 when student not found', async () => {
      mockStudentService.getStudent.mockRejectedValue(new Error('Student not found'))

      const response = await request(server)
        .get('/api/students/nonexistent')
        .expect(404)

      expect(response.body).toEqual({
        success: false,
        error: 'Student not found'
      })
    })
  })

  describe('POST /api/students', () => {
    it('should create new student', async () => {
      const studentData = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '(11) 99999-9999',
        birthDate: '2000-01-01',
        level: 'intermediario',
        objectives: 'Melhorar técnica de crawl',
        medicalNotes: 'Nenhuma restrição'
      }

      const createdStudent = {
        id: '1',
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone,
        birthDate: new Date(studentData.birthDate),
        level: 'intermediario' as const,
        objectives: studentData.objectives,
        medicalNotes: studentData.medicalNotes,
        profileImage: null,
        lastEvaluationDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockStudentService.createStudent.mockResolvedValue(createdStudent)

      const response = await request(server)
        .post('/api/students')
        .send(studentData)
        .expect(201)

      expect(response.body).toEqual({
        success: true,
        data: toJson(createdStudent),
        message: 'Student created successfully'
      })
      expect(mockStudentService.createStudent).toHaveBeenCalledWith({
        ...studentData,
        birthDate: new Date(studentData.birthDate)
      }, '1')
    })

    it('should return 400 for validation errors', async () => {
      mockStudentService.createStudent.mockRejectedValue(new Error('Validation error: Name is required'))

      const response = await request(server)
        .post('/api/students')
        .send({ name: '' })
        .expect(400)

      expect(response.body).toEqual({
        success: false,
        error: 'Validation error: Name is required'
      })
    })
  })

  describe('PUT /api/students/:id', () => {
    it('should update student', async () => {
      const updateData = {
        name: 'João Silva Updated',
        level: 'avancado'
      }

      const updatedStudent = {
        id: '1',
        name: 'João Silva Updated',
        email: null,
        phone: null,
        birthDate: new Date('2000-01-01'),
        level: 'avancado' as const,
        objectives: 'Melhorar técnica',
        medicalNotes: null,
        profileImage: null,
        lastEvaluationDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockStudentService.updateStudent.mockResolvedValue(updatedStudent)

      const response = await request(server)
        .put('/api/students/1')
        .send(updateData)
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: toJson(updatedStudent),
        message: 'Student updated successfully'
      })
      expect(mockStudentService.updateStudent).toHaveBeenCalledWith('1', updateData, '1')
    })
  })

  describe('DELETE /api/students/:id', () => {
    it('should delete student', async () => {
      const mockStudent = {
        id: '1',
        name: 'João Silva',
        email: null,
        phone: null,
        birthDate: new Date('2000-01-01'),
        level: 'intermediario' as const,
        objectives: 'Melhorar técnica',
        medicalNotes: null,
        profileImage: null,
        lastEvaluationDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockStudentService.getStudent.mockResolvedValue(mockStudent)
      mockStudentService.deleteStudent.mockResolvedValue()

      const response = await request(server)
        .delete('/api/students/1')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        message: 'Student deleted successfully'
      })
      expect(mockStudentService.deleteStudent).toHaveBeenCalledWith('1')
    })
  })

  describe('GET /api/students/stats', () => {
    it('should return student statistics', async () => {
      const mockStats = {
        total: 10,
        byLevel: {
          iniciante: 4,
          intermediario: 3,
          avancado: 3
        },
        recentlyAdded: 2
      }

      mockStudentService.getStudentStats.mockResolvedValue(mockStats)

      const response = await request(server)
        .get('/api/students/stats')
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        data: mockStats
      })
    })
  })
})

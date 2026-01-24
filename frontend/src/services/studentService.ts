import axios from 'axios'
import { apiConfig } from '../config/api'
import type { 
  Student, 
  CreateStudentData, 
  UpdateStudentData, 
  StudentFilters, 
  PaginatedStudents,
  StudentStats 
} from '../types/student'

// Create axios instance
const api = axios.create(apiConfig)

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const studentService = {
  // Get all students with filters
  async getStudents(filters?: StudentFilters): Promise<PaginatedStudents> {
    const params = new URLSearchParams()
    
    if (filters?.search) params.append('search', filters.search)
    if (filters?.level) params.append('level', filters.level)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/api/students?${params.toString()}`)
    return response.data.data
  },

  // Get student by ID
  async getStudent(id: string): Promise<Student> {
    const response = await api.get(`/api/students/${id}`)
    return response.data.data
  },

  // Create new student
  async createStudent(data: CreateStudentData): Promise<Student> {
    const response = await api.post('/api/students', data)
    return response.data.data
  },

  // Update student
  async updateStudent(id: string, data: UpdateStudentData): Promise<Student> {
    const response = await api.put(`/api/students/${id}`, data)
    return response.data.data
  },

  // Delete student
  async deleteStudent(id: string): Promise<void> {
    await api.delete(`/api/students/${id}`)
  },

  // Upload profile image
  async uploadProfileImage(id: string, file: File): Promise<Student> {
    const formData = new FormData()
    formData.append('profileImage', file)

    const response = await api.post(`/api/students/${id}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },

  // Get student statistics
  async getStudentStats(): Promise<StudentStats> {
    const response = await api.get('/api/students/stats')
    return response.data.data
  },
}
import axios from 'axios'
import { apiConfig } from '../config/api'
import type { 
  Class, 
  CreateClassData, 
  UpdateClassData, 
  ClassFilters, 
  ClassStats 
} from '../types/class'

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

export const classService = {
  // Get all classes with filters
  async listClasses(filters?: ClassFilters): Promise<Class[]> {
    const params = new URLSearchParams()
    
    if (filters?.search) params.append('search', filters.search)
    if (filters?.professorId) params.append('professorId', filters.professorId)
    if (filters?.poolId) params.append('poolId', filters.poolId)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/api/classes?${params.toString()}`)
    
    // Handle the API response structure
    if (response.data.success && response.data.data) {
      const data = response.data.data
      // Check if it's paginated response with classes array
      if (data.classes && Array.isArray(data.classes)) {
        return data.classes
      }
      // Or if it's a direct array
      if (Array.isArray(data)) {
        return data
      }
    }
    
    return []
  },

  // Get class by ID
  async getClass(id: string): Promise<Class> {
    const response = await api.get(`/api/classes/${id}`)
    return response.data.success ? response.data.data : response.data
  },

  // Create new class
  async createClass(data: CreateClassData): Promise<Class> {
    const response = await api.post('/api/classes', data)
    return response.data
  },

  // Update class
  async updateClass(id: string, data: UpdateClassData): Promise<Class> {
    const response = await api.put(`/api/classes/${id}`, data)
    return response.data
  },

  // Delete class
  async deleteClass(id: string): Promise<void> {
    await api.delete(`/api/classes/${id}`)
  },

  // Add student to class
  async addStudent(classId: string, studentId: string): Promise<void> {
    await api.post(`/api/classes/${classId}/students/${studentId}`)
  },

  // Remove student from class
  async removeStudent(classId: string, studentId: string): Promise<void> {
    await api.delete(`/api/classes/${classId}/students/${studentId}`)
  },

  // Get class statistics
  async getClassStats(): Promise<ClassStats> {
    const response = await api.get('/api/classes/stats')
    return response.data
  },
}

export default classService
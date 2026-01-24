import axios from 'axios'
import { apiConfig } from '../config/api'
import type { 
  Pool, 
  CreatePoolData, 
  UpdatePoolData, 
  PoolFilters, 
  PoolStats 
} from '../types/pool'

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

export const poolService = {
  // Get all pools with filters
  async listPools(filters?: PoolFilters): Promise<Pool[]> {
    const params = new URLSearchParams()
    
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/api/pools?${params.toString()}`)
    return response.data.data.pools
  },

  // Get pool by ID
  async getPool(id: string): Promise<Pool> {
    const response = await api.get(`/api/pools/${id}`)
    return response.data.data
  },

  // Create new pool
  async createPool(data: CreatePoolData): Promise<Pool> {
    const response = await api.post('/api/pools', data)
    return response.data.data
  },

  // Update pool
  async updatePool(id: string, data: UpdatePoolData): Promise<Pool> {
    const response = await api.put(`/api/pools/${id}`, data)
    return response.data.data
  },

  // Delete pool
  async deletePool(id: string): Promise<void> {
    await api.delete(`/api/pools/${id}`)
  },

  // Get pool statistics
  async getPoolStats(): Promise<PoolStats> {
    const response = await api.get('/api/pools/stats')
    return response.data.data
  },
}

export default poolService
// API configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://swimflow-backend.onrender.com')

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
}

// API endpoints
export const endpoints = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
  },
  users: {
    list: '/api/users',
    create: '/api/users',
    get: (id: string) => `/api/users/${id}`,
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
    stats: (id: string) => `/api/users/${id}/stats`,
  },
  students: {
    list: '/api/students',
    create: '/api/students',
    get: (id: string) => `/api/students/${id}`,
    update: (id: string) => `/api/students/${id}`,
    delete: (id: string) => `/api/students/${id}`,
    stats: '/api/students/stats',
    uploadImage: (id: string) => `/api/students/${id}/upload-image`,
  },
}

export default apiConfig
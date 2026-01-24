export interface Pool {
  id: string
  name: string
  capacity: number
  length?: number | null
  lanes?: number | null
  temperature?: number | null
  description?: string | null
  createdAt: string
  classes?: PoolClass[]
}

export interface PoolClass {
  id: string
  name: string
  _count?: {
    students: number
  }
}

export interface CreatePoolData {
  name: string
  capacity: number
  length?: number
  lanes?: number
  temperature?: number
  description?: string
}

export interface UpdatePoolData {
  name?: string
  capacity?: number
  length?: number
  lanes?: number
  temperature?: number
  description?: string
}

export interface PoolFilters {
  search?: string
  page?: number
  limit?: number
}

export interface PaginatedPools {
  pools: Pool[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PoolStats {
  total: number
  totalCapacity: number
  averageCapacity: number
  withClasses: number
}
import { PrismaClient, Pool } from '@prisma/client'
import Joi from 'joi'
import { cacheGet, cacheSet, cacheDelete } from '../utils/cache'

const prisma = new PrismaClient()
const POOL_STATS_CACHE_KEY = 'stats:pools'
const STATS_CACHE_TTL_MS = 60_000

// Validation schemas
export const createPoolSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  capacity: Joi.number().integer().min(1).required(),
  length: Joi.number().positive().optional().allow(null),
  lanes: Joi.number().integer().min(1).optional().allow(null),
  temperature: Joi.number().min(0).max(50).optional().allow(null),
  description: Joi.string().max(2000).optional().allow(null, '')
})

export const updatePoolSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  capacity: Joi.number().integer().min(1).optional(),
  length: Joi.number().positive().optional().allow(null),
  lanes: Joi.number().integer().min(1).optional().allow(null),
  temperature: Joi.number().min(0).max(50).optional().allow(null),
  description: Joi.string().max(2000).optional().allow(null, '')
})

export const poolFiltersSchema = Joi.object({
  search: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})

// Types
export interface CreatePoolData {
  name: string
  capacity: number
  length?: number | null
  lanes?: number | null
  temperature?: number | null
  description?: string | null
}

export interface UpdatePoolData {
  name?: string
  capacity?: number
  length?: number | null
  lanes?: number | null
  temperature?: number | null
  description?: string | null
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

// Service functions
export class PoolService {
  static async createPool(data: CreatePoolData): Promise<Pool> {
    const { error } = createPoolSchema.validate(data)
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`)
    }

    try {
      const pool = await prisma.pool.create({
        data: {
          name: data.name,
          capacity: data.capacity,
          length: data.length || null,
          lanes: data.lanes || null,
          temperature: data.temperature || null,
          description: data.description || null
        }
      })

      return pool
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Pool with this name already exists')
      }
      throw new Error(`Failed to create pool: ${error.message}`)
    } finally {
      cacheDelete(POOL_STATS_CACHE_KEY)
    }
  }

  static async updatePool(id: string, data: UpdatePoolData): Promise<Pool> {
    const { error } = updatePoolSchema.validate(data)
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`)
    }

    try {
      const pool = await prisma.pool.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.capacity && { capacity: data.capacity }),
          ...(data.length !== undefined && { length: data.length }),
          ...(data.lanes !== undefined && { lanes: data.lanes }),
          ...(data.temperature !== undefined && { temperature: data.temperature }),
          ...(data.description !== undefined && { description: data.description || null })
        }
      })

      return pool
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Pool not found')
      }
      if (error.code === 'P2002') {
        throw new Error('Pool with this name already exists')
      }
      throw new Error(`Failed to update pool: ${error.message}`)
    } finally {
      cacheDelete(POOL_STATS_CACHE_KEY)
    }
  }

  static async getPool(id: string): Promise<Pool & { classes: any[] }> {
    try {
      const pool = await prisma.pool.findUnique({
        where: { id },
        include: {
          classes: {
            include: {
              schedules: {
                include: {
                  professor: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              },
              students: {
                include: {
                  student: {
                    select: {
                      id: true,
                      name: true,
                      level: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (!pool) {
        throw new Error('Pool not found')
      }

      return pool
    } catch (error: any) {
      throw new Error(`Failed to get pool: ${error.message}`)
    }
  }

  static async listPools(filters: PoolFilters = {}): Promise<PaginatedPools> {
    const { error } = poolFiltersSchema.validate(filters)
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`)
    }

    const { search, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit

    try {
      const where: any = {}

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }

      const [pools, total] = await Promise.all([
        prisma.pool.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            name: 'asc'
          },
          include: {
            classes: {
              select: {
                id: true,
                name: true,
                _count: {
                  select: {
                    students: true
                  }
                }
              }
            }
          }
        }),
        prisma.pool.count({ where })
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        pools,
        total,
        page,
        limit,
        totalPages
      }
    } catch (error: any) {
      throw new Error(`Failed to list pools: ${error.message}`)
    }
  }

  static async deletePool(id: string): Promise<void> {
    try {
      // Check if pool has associated classes
      const classCount = await prisma.class.count({
        where: { poolId: id }
      })

      if (classCount > 0) {
        throw new Error('Cannot delete pool with associated classes')
      }

      await prisma.pool.delete({
        where: { id }
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Pool not found')
      }
      throw error
    } finally {
      cacheDelete(POOL_STATS_CACHE_KEY)
    }
  }

  static async getPoolStats(): Promise<{
    total: number
    totalCapacity: number
    averageCapacity: number
    withClasses: number
  }> {
    const cached = cacheGet<{
      total: number
      totalCapacity: number
      averageCapacity: number
      withClasses: number
    }>(POOL_STATS_CACHE_KEY)
    if (cached) return cached

    try {
      const [total, pools, withClasses] = await Promise.all([
        prisma.pool.count(),
        prisma.pool.findMany({
          select: {
            capacity: true
          }
        }),
        prisma.pool.count({
          where: {
            classes: {
              some: {}
            }
          }
        })
      ])

      const totalCapacity = pools.reduce((sum, pool) => sum + pool.capacity, 0)
      const averageCapacity = total > 0 ? Math.round(totalCapacity / total) : 0

      const result = {
        total,
        totalCapacity,
        averageCapacity,
        withClasses
      }
      cacheSet(POOL_STATS_CACHE_KEY, result, STATS_CACHE_TTL_MS)
      return result
    } catch (error: any) {
      throw new Error(`Failed to get pool stats: ${error.message}`)
    }
  }
}

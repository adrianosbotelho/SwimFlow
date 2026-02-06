import { PrismaClient, Class, ClassSchedule } from '@prisma/client'
import Joi from 'joi'
import { cacheGet, cacheSet, cacheDelete } from '../utils/cache'

const prisma = new PrismaClient()
const CLASS_STATS_CACHE_KEY = 'stats:classes'
const STATS_CACHE_TTL_MS = 60_000

// Validation schemas
export const createClassSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  poolId: Joi.string().uuid().required(),
  maxCapacity: Joi.number().integer().min(1).required(),
  schedules: Joi.array().items(
    Joi.object({
      dayOfWeek: Joi.number().integer().min(0).max(6).required(),
      startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      professorId: Joi.string().uuid().required()
    })
  ).min(1).required()
})

export const updateClassSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  poolId: Joi.string().uuid().optional(),
  maxCapacity: Joi.number().integer().min(1).optional(),
  schedules: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().optional(),
      dayOfWeek: Joi.number().integer().min(0).max(6).required(),
      startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      professorId: Joi.string().uuid().required()
    })
  ).min(1).optional()
})

export const classFiltersSchema = Joi.object({
  search: Joi.string().optional(),
  professorId: Joi.string().uuid().optional(),
  poolId: Joi.string().uuid().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})

// Types
export interface CreateClassData {
  name: string
  poolId: string
  maxCapacity: number
  schedules: {
    dayOfWeek: number
    startTime: string
    endTime: string
    professorId: string
  }[]
}

export interface UpdateClassData {
  name?: string
  poolId?: string
  maxCapacity?: number
  schedules?: {
    id?: string
    dayOfWeek: number
    startTime: string
    endTime: string
    professorId: string
  }[]
}

export interface ClassFilters {
  search?: string
  professorId?: string
  poolId?: string
  page?: number
  limit?: number
}

export interface PaginatedClasses {
  classes: Class[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Helper function to convert time string to Date object
function timeStringToDate(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  // Use a fixed date (1970-01-01) in UTC to represent just the time
  const date = new Date('1970-01-01T00:00:00.000Z')
  date.setUTCHours(hours, minutes, 0, 0)
  return date
}

// Service functions
export class ClassService {
  static async createClass(data: CreateClassData): Promise<Class> {
    const { error } = createClassSchema.validate(data)
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`)
    }

    try {
      // Verify all professors exist
      const professorIds = [...new Set(data.schedules.map(s => s.professorId))]
      const professors = await prisma.user.findMany({
        where: { 
          id: { in: professorIds },
          role: 'professor'
        }
      })
      
      if (professors.length !== professorIds.length) {
        throw new Error('One or more professors not found or not valid professors')
      }

      // Verify pool exists
      const pool = await prisma.pool.findUnique({
        where: { id: data.poolId }
      })
      if (!pool) {
        throw new Error('Pool not found')
      }

      // Validate max capacity doesn't exceed pool capacity
      if (data.maxCapacity > pool.capacity) {
        throw new Error('Class capacity cannot exceed pool capacity')
      }

      // Create class with schedules in a transaction
      const classWithSchedules = await prisma.$transaction(async (tx) => {
        const newClass = await tx.class.create({
          data: {
            name: data.name,
            poolId: data.poolId,
            maxCapacity: data.maxCapacity
          }
        })

        // Create schedules
        await tx.classSchedule.createMany({
          data: data.schedules.map(schedule => ({
            classId: newClass.id,
            professorId: schedule.professorId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: timeStringToDate(schedule.startTime),
            endTime: timeStringToDate(schedule.endTime)
          }))
        })

        return newClass
      })

      return classWithSchedules
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Class with this name already exists')
      }
      throw error
    } finally {
      cacheDelete(CLASS_STATS_CACHE_KEY)
    }
  }

  static async updateClass(id: string, data: UpdateClassData): Promise<Class> {
    const { error } = updateClassSchema.validate(data)
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`)
    }

    try {
      // Verify class exists
      const existingClass = await prisma.class.findUnique({
        where: { id }
      })
      if (!existingClass) {
        throw new Error('Class not found')
      }

      // Verify all professors if schedules provided
      if (data.schedules) {
        const professorIds = [...new Set(data.schedules.map(s => s.professorId))]
        const professors = await prisma.user.findMany({
          where: { 
            id: { in: professorIds },
            role: 'professor'
          }
        })
        
        if (professors.length !== professorIds.length) {
          throw new Error('One or more professors not found or not valid professors')
        }
      }

      // Verify pool if provided
      if (data.poolId) {
        const pool = await prisma.pool.findUnique({
          where: { id: data.poolId }
        })
        if (!pool) {
          throw new Error('Pool not found')
        }

        // Validate max capacity doesn't exceed pool capacity
        const maxCapacity = data.maxCapacity || existingClass.maxCapacity
        if (maxCapacity > pool.capacity) {
          throw new Error('Class capacity cannot exceed pool capacity')
        }
      }

      // Update class and schedules in a transaction
      const updatedClass = await prisma.$transaction(async (tx) => {
        const updated = await tx.class.update({
          where: { id },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.poolId && { poolId: data.poolId }),
            ...(data.maxCapacity && { maxCapacity: data.maxCapacity })
          }
        })

        // Update schedules if provided
        if (data.schedules) {
          // Delete existing schedules
          await tx.classSchedule.deleteMany({
            where: { classId: id }
          })

          // Create new schedules
          await tx.classSchedule.createMany({
            data: data.schedules.map(schedule => ({
              classId: id,
              professorId: schedule.professorId,
              dayOfWeek: schedule.dayOfWeek,
              startTime: timeStringToDate(schedule.startTime),
              endTime: timeStringToDate(schedule.endTime)
            }))
          })
        }

        return updated
      })

      return updatedClass
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Class not found')
      }
      if (error.code === 'P2002') {
        throw new Error('Class with this name already exists')
      }
      throw error
    } finally {
      cacheDelete(CLASS_STATS_CACHE_KEY)
    }
  }

  static async getClass(id: string): Promise<Class & { 
    pool: any, 
    schedules: (ClassSchedule & { professor: any })[], 
    students: any[],
    _count: { students: number }
  }> {
    try {
      const classData = await prisma.class.findUnique({
        where: { id },
        include: {
          pool: {
            select: {
              id: true,
              name: true,
              capacity: true,
              length: true,
              lanes: true,
              temperature: true
            }
          },
          schedules: {
            include: {
              professor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true
                }
              }
            },
            orderBy: {
              dayOfWeek: 'asc'
            }
          },
          students: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                  profileImage: true,
                  lastEvaluationDate: true
                }
              }
            },
            orderBy: {
              student: {
                name: 'asc'
              }
            }
          },
          _count: {
            select: {
              students: true
            }
          }
        }
      })

      if (!classData) {
        throw new Error('Class not found')
      }

      return classData
    } catch (error: any) {
      throw new Error(`Failed to get class: ${error.message}`)
    }
  }

  static async listClasses(filters: ClassFilters = {}): Promise<PaginatedClasses> {
    const { error } = classFiltersSchema.validate(filters)
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`)
    }

    const { search, professorId, poolId, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit

    try {
      const where: any = {}

      if (search) {
        where.name = { contains: search, mode: 'insensitive' }
      }

      if (professorId) {
        where.schedules = {
          some: {
            professorId: professorId
          }
        }
      }

      if (poolId) {
        where.poolId = poolId
      }

      const [classes, total] = await Promise.all([
        prisma.class.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            name: 'asc'
          },
          include: {
            pool: {
              select: {
                id: true,
                name: true
              }
            },
            schedules: {
              include: {
                professor: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },
              orderBy: {
                dayOfWeek: 'asc'
              }
            },
            _count: {
              select: {
                students: true
              }
            }
          }
        }),
        prisma.class.count({ where })
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        classes,
        total,
        page,
        limit,
        totalPages
      }
    } catch (error: any) {
      throw new Error(`Failed to list classes: ${error.message}`)
    }
  }

  static async deleteClass(id: string): Promise<void> {
    try {
      await prisma.class.delete({
        where: { id }
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Class not found')
      }
      throw new Error(`Failed to delete class: ${error.message}`)
    } finally {
      cacheDelete(CLASS_STATS_CACHE_KEY)
    }
  }

  static async addStudentToClass(classId: string, studentId: string): Promise<void> {
    try {
      // Verify class exists and get capacity info
      const classData = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          _count: {
            select: {
              students: true
            }
          }
        }
      })

      if (!classData) {
        throw new Error('Class not found')
      }

      // Check if class is at capacity
      if (classData._count.students >= classData.maxCapacity) {
        throw new Error('Class is at maximum capacity')
      }

      // Verify student exists
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      })

      if (!student) {
        throw new Error('Student not found')
      }

      // Add student to class
      await prisma.classStudent.create({
        data: {
          classId,
          studentId
        }
      })
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Student is already enrolled in this class')
      }
      throw error
    } finally {
      cacheDelete(CLASS_STATS_CACHE_KEY)
    }
  }

  static async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    try {
      await prisma.classStudent.delete({
        where: {
          classId_studentId: {
            classId,
            studentId
          }
        }
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Student is not enrolled in this class')
      }
      throw new Error(`Failed to remove student from class: ${error.message}`)
    } finally {
      cacheDelete(CLASS_STATS_CACHE_KEY)
    }
  }

  static async getClassStats(): Promise<{
    total: number
    totalStudents: number
    averageStudentsPerClass: number
    byProfessor: Record<string, number>
  }> {
    const cached = cacheGet<{
      total: number
      totalStudents: number
      averageStudentsPerClass: number
      byProfessor: Record<string, number>
    }>(CLASS_STATS_CACHE_KEY)
    if (cached) return cached

    try {
      const [total, classes] = await Promise.all([
        prisma.class.count(),
        prisma.class.findMany({
          include: {
            schedules: {
              include: {
                professor: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            _count: {
              select: {
                students: true
              }
            }
          }
        })
      ])

      const totalStudents = classes.reduce((sum, cls) => sum + cls._count.students, 0)
      const averageStudentsPerClass = total > 0 ? Math.round(totalStudents / total) : 0

      // Count classes by professor (a class can have multiple professors)
      const byProfessor = classes.reduce((acc, cls) => {
        const professors = [...new Set(cls.schedules.map(s => s.professor.name))]
        professors.forEach(professorName => {
          acc[professorName] = (acc[professorName] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>)

      const result = {
        total,
        totalStudents,
        averageStudentsPerClass,
        byProfessor
      }
      cacheSet(CLASS_STATS_CACHE_KEY, result, STATS_CACHE_TTL_MS)
      return result
    } catch (error: any) {
      throw new Error(`Failed to get class stats: ${error.message}`)
    }
  }
}

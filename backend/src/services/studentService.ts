import { PrismaClient, Student, Level, LevelHistory } from '@prisma/client'
import Joi from 'joi'
import { cacheGet, cacheSet, cacheDelete } from '../utils/cache'

const prisma = new PrismaClient()
const STUDENT_STATS_CACHE_KEY = 'stats:students'
const STATS_CACHE_TTL_MS = 60_000

// Validation schemas
export const createStudentSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().allow(null, ''),
  birthDate: Joi.date().max('now').required(),
  level: Joi.string().valid('iniciante', 'intermediario', 'avancado').required(),
  objectives: Joi.string().max(1000).required(),
  medicalNotes: Joi.string().max(2000).optional().allow(null, ''),
  profileImage: Joi.string().max(500).optional().allow(null, '')
})

export const updateStudentSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().allow(null, ''),
  birthDate: Joi.date().max('now').optional(),
  level: Joi.string().valid('iniciante', 'intermediario', 'avancado').optional(),
  objectives: Joi.string().max(1000).optional(),
  medicalNotes: Joi.string().max(2000).optional().allow(null, ''),
  profileImage: Joi.string().max(500).optional().allow(null, '')
})

export const studentFiltersSchema = Joi.object({
  search: Joi.string().optional(),
  level: Joi.string().valid('iniciante', 'intermediario', 'avancado').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})

export const changeLevelSchema = Joi.object({
  newLevel: Joi.string().valid('iniciante', 'intermediario', 'avancado').required(),
  reason: Joi.string().max(500).optional().allow(null, ''),
  changedBy: Joi.string().uuid().optional()
})

// Types
export interface CreateStudentData {
  name: string
  email?: string | null
  phone?: string | null
  birthDate: Date
  level: Level
  objectives: string
  medicalNotes?: string | null
  profileImage?: string | null
}

export interface UpdateStudentData {
  name?: string
  email?: string | null
  phone?: string | null
  birthDate?: Date
  level?: Level
  objectives?: string
  medicalNotes?: string | null
  profileImage?: string | null
}

export interface StudentFilters {
  search?: string
  level?: Level
  page?: number
  limit?: number
}

export interface PaginatedStudents {
  students: Student[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ChangeLevelData {
  newLevel: Level
  reason?: string | null
  changedBy?: string
}

export interface StudentWithLevelHistory extends Student {
  levelHistory: LevelHistory[]
}

// Service functions
export class StudentService {
  static async createStudent(data: CreateStudentData, createdBy?: string): Promise<Student> {
    const { error } = createStudentSchema.validate(data)
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`)
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create student
        const student = await tx.student.create({
          data: {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            birthDate: data.birthDate,
            level: data.level,
            objectives: data.objectives,
            medicalNotes: data.medicalNotes || null,
            profileImage: data.profileImage || null
          }
        })

        // Create initial level history record
        await tx.levelHistory.create({
          data: {
            studentId: student.id,
            fromLevel: null, // Initial level has no previous level
            toLevel: data.level,
            reason: 'Initial level assignment',
            changedBy: createdBy || null
          }
        })

        return student
      })

      return result
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Student with this email already exists')
      }
      throw new Error(`Failed to create student: ${error.message}`)
    } finally {
      cacheDelete(STUDENT_STATS_CACHE_KEY)
    }
  }

  static async updateStudent(id: string, data: UpdateStudentData, changedBy?: string): Promise<Student> {
    const { error } = updateStudentSchema.validate(data)
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`)
    }

    try {
      // If level is being changed, use the level change method
      if (data.level) {
        const currentStudent = await prisma.student.findUnique({
          where: { id }
        })

        if (!currentStudent) {
          throw new Error('Student not found')
        }

        // If level is different, use changeStudentLevel
        if (currentStudent.level !== data.level) {
          await this.changeStudentLevel(id, {
            newLevel: data.level,
            reason: 'Updated via student profile',
            changedBy
          })
        }
      }

      const student = await prisma.student.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email !== undefined && { email: data.email || null }),
          ...(data.phone !== undefined && { phone: data.phone || null }),
          ...(data.birthDate && { birthDate: data.birthDate }),
          ...(data.level && { level: data.level }),
          ...(data.objectives && { objectives: data.objectives }),
          ...(data.medicalNotes !== undefined && { medicalNotes: data.medicalNotes || null }),
          ...(data.profileImage !== undefined && { profileImage: data.profileImage || null })
        }
      })

      return student
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Student not found')
      }
      if (error.code === 'P2002') {
        throw new Error('Student with this email already exists')
      }
      throw new Error(`Failed to update student: ${error.message}`)
    } finally {
      cacheDelete(STUDENT_STATS_CACHE_KEY)
    }
  }

  static async getStudent(id: string): Promise<Student> {
    try {
      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          classStudents: {
            include: {
              class: {
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
                  pool: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          evaluations: {
            orderBy: {
              date: 'desc'
            },
            take: 5,
            include: {
              professor: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      })

      if (!student) {
        throw new Error('Student not found')
      }

      return student
    } catch (error: any) {
      throw new Error(`Failed to get student: ${error.message}`)
    }
  }

  static async listStudents(filters: StudentFilters = {}): Promise<PaginatedStudents> {
    const { error } = studentFiltersSchema.validate(filters)
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`)
    }

    const { search, level, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit

    try {
      const where: any = {}

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (level) {
        where.level = level
      }

      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            name: 'asc'
          },
          include: {
            classStudents: {
              include: {
                class: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }),
        prisma.student.count({ where })
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        students,
        total,
        page,
        limit,
        totalPages
      }
    } catch (error: any) {
      throw new Error(`Failed to list students: ${error.message}`)
    }
  }

  static async deleteStudent(id: string): Promise<void> {
    try {
      await prisma.student.delete({
        where: { id }
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Student not found')
      }
      throw new Error(`Failed to delete student: ${error.message}`)
    } finally {
      cacheDelete(STUDENT_STATS_CACHE_KEY)
    }
  }

  static async updateProfileImage(id: string, imagePath: string): Promise<Student> {
    try {
      const student = await prisma.student.update({
        where: { id },
        data: { profileImage: imagePath }
      })

      return student
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Student not found')
      }
      throw new Error(`Failed to update profile image: ${error.message}`)
    }
  }

  static async changeStudentLevel(id: string, data: ChangeLevelData): Promise<Student> {
    const { error } = changeLevelSchema.validate(data)
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`)
    }

    try {
      // Get current student to check current level
      const currentStudent = await prisma.student.findUnique({
        where: { id }
      })

      if (!currentStudent) {
        throw new Error('Student not found')
      }

      // Don't create history if level is the same
      if (currentStudent.level === data.newLevel) {
        return currentStudent
      }

      // Use transaction to ensure consistency
      const result = await prisma.$transaction(async (tx) => {
        // Update student level
        const updatedStudent = await tx.student.update({
          where: { id },
          data: { level: data.newLevel }
        })

        // Create level history record
        await tx.levelHistory.create({
          data: {
            studentId: id,
            fromLevel: currentStudent.level,
            toLevel: data.newLevel,
            reason: data.reason || null,
            changedBy: data.changedBy || null
          }
        })

        return updatedStudent
      })

      return result
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Student not found')
      }
      throw new Error(`Failed to change student level: ${error.message}`)
    } finally {
      cacheDelete(STUDENT_STATS_CACHE_KEY)
    }
  }

  static async getStudentLevelHistory(id: string): Promise<LevelHistory[]> {
    try {
      const levelHistory = await prisma.levelHistory.findMany({
        where: { studentId: id },
        orderBy: { changedAt: 'desc' }
      })

      return levelHistory
    } catch (error: any) {
      throw new Error(`Failed to get level history: ${error.message}`)
    }
  }

  static async getStudentWithLevelHistory(id: string): Promise<StudentWithLevelHistory> {
    try {
      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          levelHistory: {
            orderBy: { changedAt: 'desc' }
          },
          classStudents: {
            include: {
              class: {
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
                  pool: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          evaluations: {
            orderBy: {
              date: 'desc'
            },
            take: 5,
            include: {
              professor: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      })

      if (!student) {
        throw new Error('Student not found')
      }

      return student as StudentWithLevelHistory
    } catch (error: any) {
      throw new Error(`Failed to get student with level history: ${error.message}`)
    }
  }

  static async getStudentStats(): Promise<{
    total: number
    byLevel: Record<Level, number>
    recentlyAdded: number
  }> {
    const cached = cacheGet<{
      total: number
      byLevel: Record<Level, number>
      recentlyAdded: number
    }>(STUDENT_STATS_CACHE_KEY)
    if (cached) return cached

    try {
      const [total, byLevel, recentlyAdded] = await Promise.all([
        prisma.student.count(),
        prisma.student.groupBy({
          by: ['level'],
          _count: {
            level: true
          }
        }),
        prisma.student.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ])

      const levelStats = byLevel.reduce((acc, item) => {
        acc[item.level] = item._count.level
        return acc
      }, {} as Record<Level, number>)

      // Ensure all levels are represented
      const allLevels: Level[] = ['iniciante', 'intermediario', 'avancado']
      allLevels.forEach(level => {
        if (!levelStats[level]) {
          levelStats[level] = 0
        }
      })

      const result = {
        total,
        byLevel: levelStats,
        recentlyAdded
      }
      cacheSet(STUDENT_STATS_CACHE_KEY, result, STATS_CACHE_TTL_MS)
      return result
    } catch (error: any) {
      throw new Error(`Failed to get student stats: ${error.message}`)
    }
  }
}

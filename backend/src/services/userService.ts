import bcrypt from 'bcrypt'
import { PrismaClient, User } from '@prisma/client'
import Joi from 'joi'

// Create a singleton instance that can be mocked in tests
let prisma: PrismaClient

// Initialize prisma instance
if (process.env.NODE_ENV === 'test') {
  // In test environment, prisma will be mocked
  prisma = {} as PrismaClient
} else {
  prisma = new PrismaClient()
}

export interface CreateUserData {
  email: string
  password: string
  name: string
  role: UserRole
  profileImage?: string
}

export interface UpdateUserData {
  email?: string
  name?: string
  role?: UserRole
  profileImage?: string
  password?: string
}

export interface UserFilters {
  role?: UserRole
  search?: string
}

export class UserService {
  private static readonly SALT_ROUNDS = 12

  // Validation schemas
  static readonly createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      }),
    name: Joi.string().min(2).max(255).required(),
    role: Joi.string().valid('admin', 'professor').required(),
    profileImage: Joi.string().uri().optional()
  })

  static readonly updateUserSchema = Joi.object({
    email: Joi.string().email().optional(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).optional()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      }),
    name: Joi.string().min(2).max(255).optional(),
    role: Joi.string().valid('admin', 'professor').optional(),
    profileImage: Joi.string().uri().allow('').optional()
  })

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS)
  }

  static async createUser(data: CreateUserData): Promise<Omit<User, 'passwordHash'>> {
    // Validate input
    const { error, value } = this.createUserSchema.validate(data)
    if (error) {
      throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`)
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: value.email.toLowerCase() }
    })

    if (existingUser) {
      throw new Error('Email already exists')
    }

    // Hash password
    const passwordHash = await this.hashPassword(value.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: value.email.toLowerCase(),
        passwordHash,
        name: value.name,
        role: value.role as UserRole,
        profileImage: value.profileImage
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return user
  }

  static async updateUser(id: string, data: UpdateUserData): Promise<Omit<User, 'passwordHash'>> {
    // Validate input
    const { error, value } = this.updateUserSchema.validate(data)
    if (error) {
      throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`)
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      throw new Error('User not found')
    }

    // Check if email is being changed and if it already exists
    if (value.email && value.email.toLowerCase() !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: value.email.toLowerCase() }
      })

      if (emailExists) {
        throw new Error('Email already exists')
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (value.email) updateData.email = value.email.toLowerCase()
    if (value.name) updateData.name = value.name
    if (value.role) updateData.role = value.role as UserRole
    if (value.profileImage !== undefined) updateData.profileImage = value.profileImage || null
    if (value.password) updateData.passwordHash = await this.hashPassword(value.password)

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return user
  }

  static async getUser(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return user
  }

  static async listUsers(filters?: UserFilters): Promise<Omit<User, 'passwordHash'>[]> {
    const where: any = {}

    if (filters?.role) {
      where.role = filters.role
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    })

    return users
  }

  static async deleteUser(id: string): Promise<void> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        classes: true,
        evaluations: true
      }
    })

    if (!existingUser) {
      throw new Error('User not found')
    }

    // Check if user has associated data
    if (existingUser.classes.length > 0) {
      throw new Error('Cannot delete user with associated classes')
    }

    if (existingUser.evaluations.length > 0) {
      throw new Error('Cannot delete user with associated evaluations')
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    })
  }

  static async getUserStats(id: string): Promise<{
    totalClasses: number
    totalEvaluations: number
    totalStudents: number
  }> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            students: true
          }
        },
        evaluations: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const totalClasses = user.classes.length
    const totalEvaluations = user.evaluations.length
    const totalStudents = user.classes.reduce((acc: number, cls: any) => acc + cls.students.length, 0)

    return {
      totalClasses,
      totalEvaluations,
      totalStudents
    }
  }
}
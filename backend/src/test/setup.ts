// Jest setup file for backend tests
import { PrismaClient } from '@prisma/client'

// Mock Prisma Client for tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}))

// Global test timeout
jest.setTimeout(10000)
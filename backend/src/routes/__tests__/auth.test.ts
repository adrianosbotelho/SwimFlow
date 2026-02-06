import request from 'supertest'
import express from 'express'
import cors from 'cors'

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  }
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

const mockVerifyIdToken = jest.fn()

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  }))
}))

jest.mock('../../services/emailService', () => ({
  EmailService: {
    sendVerificationEmail: jest.fn(),
  }
}))

const authRoutes = require('../auth').default
const bcrypt = require('bcrypt')
const { EmailService } = require('../../services/emailService')

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
  })

  it('registers user and sends verification email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    bcrypt.hash.mockResolvedValue('hashed-password')
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'user@swimflow.com',
      name: 'User Test',
      role: 'professor',
      profileImage: null,
      emailVerified: false,
    })

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Test',
        email: 'user@swimflow.com',
        password: 'password123',
        confirmPassword: 'password123'
      })
      .expect(201)

    expect(response.body.accessToken).toBeUndefined()
    expect(response.body.message).toContain('Verification email sent')
    expect(EmailService.sendVerificationEmail).toHaveBeenCalled()
  })

  it('blocks login when email not verified', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@swimflow.com',
      passwordHash: 'hashed',
      name: 'User Test',
      role: 'professor',
      profileImage: null,
      emailVerified: false,
    })
    bcrypt.compare.mockResolvedValue(true)
    mockPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'user@swimflow.com',
      name: 'User Test',
      role: 'professor',
      emailVerified: false,
    })

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@swimflow.com',
        password: 'password123'
      })
      .expect(403)

    expect(response.body.code).toBe('EMAIL_NOT_VERIFIED')
    expect(EmailService.sendVerificationEmail).toHaveBeenCalled()
  })

  it('verifies email with token', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@swimflow.com',
    })
    mockPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      emailVerified: true,
    })

    const response = await request(app)
      .get('/api/auth/verify-email?token=test-token')
      .expect(200)

    expect(response.body.message).toContain('Email verified')
    expect(mockPrisma.user.update).toHaveBeenCalled()
  })

  it('logs in with Google credential', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-123',
        email: 'google@swimflow.com',
        name: 'Google User',
        picture: 'https://example.com/avatar.png',
        email_verified: true,
      })
    })
    mockPrisma.user.findFirst.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-google',
      email: 'google@swimflow.com',
      name: 'Google User',
      role: 'professor',
      profileImage: 'https://example.com/avatar.png',
      emailVerified: true,
    })

    const response = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'google-token' })
      .expect(200)

    expect(response.body.accessToken).toBeDefined()
    expect(response.body.user.email).toBe('google@swimflow.com')
  })
})

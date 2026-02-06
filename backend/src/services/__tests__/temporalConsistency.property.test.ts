import fc from 'fast-check'

const mockPrisma = {
  strokeEvaluation: {
    findMany: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
    count: jest.fn(),
  },
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}))

import evolutionService from '../evolutionService'

describe('Property 14: Temporal Data Consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.strokeEvaluation.findMany.mockResolvedValue([])
  })

  it('never queries evolution data with a start date in the future', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constantFrom('3months', '6months', '1year', 'all'),
          fc.string()
        ),
        async (timeRange) => {
          const now = new Date()
          await evolutionService.getDetailedEvolutionMetrics('student-1', undefined, timeRange)

          const call = (mockPrisma.strokeEvaluation.findMany as jest.Mock).mock.calls.at(-1)?.[0]
          const gte = call?.where?.evaluation?.date?.gte as Date | undefined

          if (['3months', '6months', '1year'].includes(timeRange)) {
            expect(gte).toBeInstanceOf(Date)
            if (!gte) {
              throw new Error('Expected date filter to be defined')
            }
            expect(gte.getTime()).toBeLessThanOrEqual(now.getTime() + 1000)
          } else {
            expect(gte).toBeUndefined()
          }
        }
      ),
      { numRuns: 50 }
    )
  })
})

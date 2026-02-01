import evolutionService from '../evolutionService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    strokeEvaluation: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  })),
}));

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('EvolutionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDetailedEvolutionMetrics', () => {
    it('should return empty array when no data available', async () => {
      (mockPrisma.strokeEvaluation.findMany as jest.Mock).mockResolvedValue([]);

      const result = await evolutionService.getDetailedEvolutionMetrics('student-1');

      expect(result).toEqual([]);
      expect(mockPrisma.strokeEvaluation.findMany).toHaveBeenCalledWith({
        where: {
          evaluation: {
            studentId: 'student-1'
          }
        },
        include: {
          evaluation: {
            select: {
              id: true,
              date: true
            }
          }
        },
        orderBy: {
          evaluation: {
            date: 'asc'
          }
        }
      });
    });

    it('should handle time range filtering', async () => {
      (mockPrisma.strokeEvaluation.findMany as jest.Mock).mockResolvedValue([]);

      await evolutionService.getDetailedEvolutionMetrics('student-1', undefined, '3months');

      const call = (mockPrisma.strokeEvaluation.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.evaluation.date).toBeDefined();
      expect(call.where.evaluation.date.gte).toBeInstanceOf(Date);
    });

    it('should filter by stroke type when provided', async () => {
      (mockPrisma.strokeEvaluation.findMany as jest.Mock).mockResolvedValue([]);

      await evolutionService.getDetailedEvolutionMetrics('student-1', 'crawl');

      const call = (mockPrisma.strokeEvaluation.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.strokeType).toBe('crawl');
    });
  });

  describe('getComparativeAnalysis', () => {
    it('should throw error when student not found', async () => {
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(evolutionService.getComparativeAnalysis('invalid-id'))
        .rejects.toThrow('Student not found');
    });

    it('should return comparative analysis for valid student', async () => {
      const mockStudent = { level: 'intermediario' };
      (mockPrisma.student.findUnique as jest.Mock).mockResolvedValue(mockStudent);
      (mockPrisma.strokeEvaluation.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.strokeEvaluation.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.strokeEvaluation.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.student.count as jest.Mock).mockResolvedValue(10);

      const result = await evolutionService.getComparativeAnalysis('student-1');

      expect(result).toEqual([]);
      expect(mockPrisma.student.findUnique).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        select: { level: true }
      });
    });
  });

  describe('getEvolutionSummary', () => {
    it('should return default summary when no metrics available', async () => {
      (mockPrisma.strokeEvaluation.findMany as jest.Mock).mockResolvedValue([]);

      const result = await evolutionService.getEvolutionSummary('student-1');

      expect(result).toEqual({
        overallProgress: 0,
        strongestStroke: null,
        weakestStroke: null,
        recentTrend: 'stable',
        daysToNextLevel: null,
        recommendedFocus: ['Registrar mais avaliações para análise']
      });
    });
  });
});
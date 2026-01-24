import request from 'supertest';
import express from 'express';
import evaluationRoutes from '../evaluations';
import evaluationService from '../../services/evaluationService';

// Mock the evaluation service
jest.mock('../../services/evaluationService');
const mockEvaluationService = evaluationService as jest.Mocked<typeof evaluationService>;

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'professor-1', role: 'professor' };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/evaluations', evaluationRoutes);

describe('Evaluation Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/evaluations', () => {
    it('should create new evaluation successfully', async () => {
      const evaluationData = {
        studentId: 'student-1',
        professorId: 'professor-1',
        date: '2024-01-15',
        strokeEvaluations: [
          {
            strokeType: 'crawl',
            technique: 8,
            timeSeconds: 30.5,
            resistance: 7,
            notes: 'Boa técnica'
          }
        ],
        generalNotes: 'Progresso excelente'
      };

      const createdEvaluation = {
        id: 'eval-1',
        ...evaluationData,
        date: new Date('2024-01-15'),
        strokeEvaluations: [
          {
            id: 'stroke-1',
            evaluationId: 'eval-1',
            ...evaluationData.strokeEvaluations[0]
          }
        ],
        student: {
          id: 'student-1',
          name: 'João Silva',
          level: 'intermediario'
        },
        professor: {
          id: 'professor-1',
          name: 'Prof. Maria'
        },
        createdAt: new Date()
      };

      mockEvaluationService.createEvaluation.mockResolvedValue(createdEvaluation as any);

      const response = await request(app)
        .post('/api/evaluations')
        .send(evaluationData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'eval-1',
          studentId: 'student-1',
          professorId: 'professor-1'
        }),
        message: 'Evaluation created successfully'
      });

      expect(mockEvaluationService.createEvaluation).toHaveBeenCalledWith(evaluationData);
    });

    it('should handle validation errors', async () => {
      mockEvaluationService.createEvaluation.mockRejectedValue(
        new Error('Validation error: Student ID is required')
      );

      await request(app)
        .post('/api/evaluations')
        .send({})
        .expect(400);

      expect(mockEvaluationService.createEvaluation).toHaveBeenCalled();
    });
  });

  describe('GET /api/evaluations', () => {
    it('should list evaluations with filters', async () => {
      const mockEvaluations = [
        {
          id: 'eval-1',
          studentId: 'student-1',
          professorId: 'professor-1',
          date: new Date('2024-01-15'),
          strokeEvaluations: [],
          student: { id: 'student-1', name: 'João Silva', level: 'intermediario' },
          professor: { id: 'professor-1', name: 'Prof. Maria' },
          createdAt: new Date()
        }
      ];

      mockEvaluationService.listEvaluations.mockResolvedValue(mockEvaluations as any);

      const response = await request(app)
        .get('/api/evaluations?studentId=student-1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockEvaluations,
        count: 1
      });

      expect(mockEvaluationService.listEvaluations).toHaveBeenCalledWith('student-1', undefined);
    });
  });

  describe('GET /api/evaluations/:id', () => {
    it('should return evaluation by id', async () => {
      const mockEvaluation = {
        id: 'eval-1',
        studentId: 'student-1',
        professorId: 'professor-1',
        date: new Date('2024-01-15'),
        strokeEvaluations: [
          {
            id: 'stroke-1',
            strokeType: 'crawl',
            technique: 8,
            resistance: 7
          }
        ],
        student: { id: 'student-1', name: 'João Silva', level: 'intermediario' },
        professor: { id: 'professor-1', name: 'Prof. Maria' },
        createdAt: new Date()
      };

      mockEvaluationService.getEvaluation.mockResolvedValue(mockEvaluation as any);

      const response = await request(app)
        .get('/api/evaluations/eval-1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockEvaluation
      });
    });

    it('should return 404 for non-existent evaluation', async () => {
      mockEvaluationService.getEvaluation.mockResolvedValue(null);

      await request(app)
        .get('/api/evaluations/non-existent')
        .expect(404);
    });
  });

  describe('GET /api/evaluations/student/:studentId/evolution', () => {
    it('should return evolution data for student', async () => {
      const mockEvolutionData = [
        {
          studentId: 'student-1',
          strokeType: 'crawl',
          evaluations: [
            {
              date: new Date('2024-01-15'),
              technique: 8,
              resistance: 7,
              timeSeconds: 30.5
            }
          ]
        }
      ];

      mockEvaluationService.getEvolutionData.mockResolvedValue(mockEvolutionData as any);

      const response = await request(app)
        .get('/api/evaluations/student/student-1/evolution')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockEvolutionData
      });

      expect(mockEvaluationService.getEvolutionData).toHaveBeenCalledWith('student-1', undefined);
    });
  });

  describe('PUT /api/evaluations/:id', () => {
    it('should update evaluation successfully', async () => {
      const updateData = {
        generalNotes: 'Updated notes'
      };

      const updatedEvaluation = {
        id: 'eval-1',
        studentId: 'student-1',
        professorId: 'professor-1',
        date: new Date('2024-01-15'),
        generalNotes: 'Updated notes',
        strokeEvaluations: [],
        student: { id: 'student-1', name: 'João Silva', level: 'intermediario' },
        professor: { id: 'professor-1', name: 'Prof. Maria' },
        createdAt: new Date()
      };

      mockEvaluationService.updateEvaluation.mockResolvedValue(updatedEvaluation as any);

      const response = await request(app)
        .put('/api/evaluations/eval-1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: updatedEvaluation,
        message: 'Evaluation updated successfully'
      });

      expect(mockEvaluationService.updateEvaluation).toHaveBeenCalledWith('eval-1', updateData);
    });
  });

  describe('DELETE /api/evaluations/:id', () => {
    it('should delete evaluation successfully', async () => {
      mockEvaluationService.deleteEvaluation.mockResolvedValue();

      const response = await request(app)
        .delete('/api/evaluations/eval-1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Evaluation deleted successfully'
      });

      expect(mockEvaluationService.deleteEvaluation).toHaveBeenCalledWith('eval-1');
    });
  });
});
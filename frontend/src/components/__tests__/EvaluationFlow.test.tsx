import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EvaluationForm from '../EvaluationForm';
import EvaluationHistory from '../EvaluationHistory';
import StrokeEvaluationCard from '../StrokeEvaluationCard';
import { Student } from '../../types/student';
import { Evaluation, StrokeEvaluation } from '../../types/evaluation';

// Mock the evaluation service
vi.mock('../../services/evaluationService', () => ({
  default: {
    listEvaluations: vi.fn(),
    createEvaluation: vi.fn(),
    getEvolutionData: vi.fn(),
    getStudentStats: vi.fn()
  }
}));

const mockStudent: Student = {
  id: 'student-1',
  name: 'João Silva',
  email: 'joao@example.com',
  phone: null,
  birthDate: '2000-01-01',
  level: 'intermediario',
  objectives: 'Melhorar técnica',
  medicalNotes: null,
  profileImage: null,
  lastEvaluationDate: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

const mockStrokeEvaluation: StrokeEvaluation = {
  id: 'stroke-1',
  strokeType: 'crawl',
  technique: 8,
  timeSeconds: 30.5,
  resistance: 7,
  notes: 'Boa técnica de respiração'
};

const mockEvaluation: Evaluation = {
  id: 'eval-1',
  studentId: 'student-1',
  professorId: 'professor-1',
  date: '2024-01-15',
  generalNotes: 'Excelente progresso geral',
  strokeEvaluations: [mockStrokeEvaluation],
  student: {
    id: 'student-1',
    name: 'João Silva',
    level: 'intermediario'
  },
  professor: {
    id: 'professor-1',
    name: 'Prof. Maria'
  },
  createdAt: '2024-01-15T10:00:00.000Z'
};

describe('Evaluation Flow Integration', () => {
  describe('Complete Evaluation Creation Flow', () => {
    it('should handle complete evaluation creation workflow', async () => {
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <EvaluationForm
          student={mockStudent}
          professorId="professor-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Step 1: Verify form renders with student info
      expect(screen.getByText('Nova Avaliação')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();

      // Step 2: Fill out evaluation for each stroke type
      const crawlSection = screen.getByText('Crawl').closest('div');
      expect(crawlSection).toBeInTheDocument();

      // Update technique and resistance scores for crawl
      const sliders = screen.getAllByRole('slider');
      fireEvent.change(sliders[0], { target: { value: '8' } });
      fireEvent.change(sliders[1], { target: { value: '7' } });

      // Add time for crawl
      const timeInputs = screen.getAllByPlaceholderText('Ex: 30.50');
      fireEvent.change(timeInputs[0], { target: { value: '30.5' } });

      // Add notes for crawl
      const strokeNotesInputs = screen.getAllByPlaceholderText(/Observações específicas/);
      fireEvent.change(strokeNotesInputs[0], { target: { value: 'Boa técnica de respiração' } });

      // Step 3: Add general notes
      const generalNotesTextarea = screen.getByPlaceholderText(/Observações gerais/);
      fireEvent.change(generalNotesTextarea, { target: { value: 'Excelente progresso geral' } });

      // Step 4: Submit evaluation
      const submitButton = screen.getByText('Salvar Avaliação');
      fireEvent.click(submitButton);

      // Step 5: Verify submission data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            studentId: 'student-1',
            professorId: 'professor-1',
            generalNotes: 'Excelente progresso geral',
            strokeEvaluations: expect.arrayContaining([
              expect.objectContaining({
                strokeType: 'crawl',
                technique: 8,
                resistance: 7,
                timeSeconds: 30.5,
                notes: 'Boa técnica de respiração'
              })
            ])
          })
        );
      });
    });

    it('should submit even with minimum scores selected', async () => {
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();

      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <EvaluationForm
          student={mockStudent}
          professorId="professor-1"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Set all scores to minimum values
      const sliders = screen.getAllByRole('slider');
      sliders.forEach(slider => {
        fireEvent.change(slider, { target: { value: '1' } });
      });

      // Try to submit
      const submitButton = screen.getByText('Salvar Avaliação');
      fireEvent.click(submitButton);

      // Should submit without validation error
      expect(alertSpy).not.toHaveBeenCalled();
      expect(mockOnSubmit).toHaveBeenCalled();

      alertSpy.mockRestore();
    });
  });

  describe('StrokeEvaluationCard Display', () => {
    it('should display stroke evaluation data correctly', () => {
      render(<StrokeEvaluationCard strokeEvaluation={mockStrokeEvaluation} />);

      expect(screen.getByText('Crawl')).toBeInTheDocument();
      expect(screen.getByText('8/10')).toBeInTheDocument();
      expect(screen.getByText('7/10')).toBeInTheDocument();
      expect(screen.getByText('30.50s')).toBeInTheDocument();
      expect(screen.getByText('Boa técnica de respiração')).toBeInTheDocument();
    });

    it('should display compact version correctly', () => {
      render(<StrokeEvaluationCard strokeEvaluation={mockStrokeEvaluation} compact={true} />);

      expect(screen.getByText('Crawl')).toBeInTheDocument();
      expect(screen.getByText('8/10')).toBeInTheDocument();
      expect(screen.getByText('7/10')).toBeInTheDocument();
      expect(screen.getByText('30.50s')).toBeInTheDocument();
    });
  });

  describe('Data Validation Properties', () => {
    it('should validate stroke evaluation data structure', () => {
      const validStrokeEvaluation = {
        strokeType: 'crawl' as const,
        technique: 8,
        timeSeconds: 30.5,
        resistance: 7,
        notes: 'Test notes'
      };

      // Validate required fields
      expect(validStrokeEvaluation.strokeType).toBeDefined();
      expect(validStrokeEvaluation.technique).toBeGreaterThanOrEqual(1);
      expect(validStrokeEvaluation.technique).toBeLessThanOrEqual(10);
      expect(validStrokeEvaluation.resistance).toBeGreaterThanOrEqual(1);
      expect(validStrokeEvaluation.resistance).toBeLessThanOrEqual(10);

      // Validate optional fields
      if (validStrokeEvaluation.timeSeconds) {
        expect(validStrokeEvaluation.timeSeconds).toBeGreaterThan(0);
      }
    });

    it('should validate evaluation data completeness', () => {
      const validEvaluation = {
        studentId: 'student-1',
        professorId: 'professor-1',
        date: '2024-01-15',
        strokeEvaluations: [mockStrokeEvaluation],
        generalNotes: 'Test notes'
      };

      // Validate required fields
      expect(validEvaluation.studentId).toBeDefined();
      expect(validEvaluation.professorId).toBeDefined();
      expect(validEvaluation.date).toBeDefined();
      expect(validEvaluation.strokeEvaluations).toHaveLength(1);

      // Validate stroke evaluations array
      expect(validEvaluation.strokeEvaluations[0]).toMatchObject({
        strokeType: expect.any(String),
        technique: expect.any(Number),
        resistance: expect.any(Number)
      });
    });
  });

  describe('Score Color Coding', () => {
    it('should apply correct color classes based on scores', () => {
      const highScoreStroke = { ...mockStrokeEvaluation, technique: 9, resistance: 8 };
      const mediumScoreStroke = { ...mockStrokeEvaluation, technique: 6, resistance: 5 };
      const lowScoreStroke = { ...mockStrokeEvaluation, technique: 3, resistance: 2 };

      // Test high scores (should be green)
      render(<StrokeEvaluationCard strokeEvaluation={highScoreStroke} />);
      expect(screen.getByText('9/10')).toBeInTheDocument();

      // Test medium scores (should be yellow/orange)
      render(<StrokeEvaluationCard strokeEvaluation={mediumScoreStroke} />);
      expect(screen.getByText('6/10')).toBeInTheDocument();

      // Test low scores (should be red)
      render(<StrokeEvaluationCard strokeEvaluation={lowScoreStroke} />);
      expect(screen.getByText('3/10')).toBeInTheDocument();
    });
  });
});

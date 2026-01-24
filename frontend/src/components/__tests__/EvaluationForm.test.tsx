import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EvaluationForm from '../EvaluationForm';
import { Student } from '../../types/student';

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

describe('EvaluationForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const professorId = 'professor-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render evaluation form with student information', () => {
    render(
      <EvaluationForm
        student={mockStudent}
        professorId={professorId}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Nova Avaliação')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('intermediario')).toBeInTheDocument();
  });

  it('should render all stroke types', () => {
    render(
      <EvaluationForm
        student={mockStudent}
        professorId={professorId}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Crawl')).toBeInTheDocument();
    expect(screen.getByText('Costas')).toBeInTheDocument();
    expect(screen.getByText('Peito')).toBeInTheDocument();
    expect(screen.getByText('Borboleta')).toBeInTheDocument();
  });

  it('should update stroke evaluation scores', () => {
    render(
      <EvaluationForm
        student={mockStudent}
        professorId={professorId}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Find technique sliders and update them
    const techniqueSliders = screen.getAllByDisplayValue('5');
    fireEvent.change(techniqueSliders[0], { target: { value: '8' } });

    // Check if the score display updated
    expect(screen.getByText('8/10')).toBeInTheDocument();
  });

  it('should call onSubmit with correct data', async () => {
    render(
      <EvaluationForm
        student={mockStudent}
        professorId={professorId}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Update some scores
    const techniqueSliders = screen.getAllByDisplayValue('5');
    fireEvent.change(techniqueSliders[0], { target: { value: '8' } });

    // Add general notes
    const generalNotesTextarea = screen.getByPlaceholderText(/Observações gerais/);
    fireEvent.change(generalNotesTextarea, { target: { value: 'Excelente progresso' } });

    // Submit form
    const submitButton = screen.getByText('Salvar Avaliação');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'student-1',
          professorId: 'professor-1',
          generalNotes: 'Excelente progresso',
          strokeEvaluations: expect.arrayContaining([
            expect.objectContaining({
              strokeType: 'crawl',
              technique: 8,
              resistance: 5
            })
          ])
        })
      );
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <EvaluationForm
        student={mockStudent}
        professorId={professorId}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(
      <EvaluationForm
        student={mockStudent}
        professorId={professorId}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    expect(screen.getByText('Salvando...')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeDisabled();
  });
});
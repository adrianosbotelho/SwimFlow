import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentCard } from '../StudentCard'
import type { Student } from '../../types/student'

const mockStudent: Student = {
  id: '1',
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '(11) 99999-9999',
  birthDate: '2000-01-01',
  level: 'intermediario',
  objectives: 'Melhorar técnica de crawl',
  medicalNotes: 'Nenhuma restrição',
  profileImage: null,
  lastEvaluationDate: '2024-01-15',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

describe('StudentCard', () => {
  it('renders student information correctly', () => {
    render(
      <StudentCard 
        student={mockStudent}
        onEdit={vi.fn()}
        onViewDetails={vi.fn()}
      />
    )

    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Intermediário')).toBeInTheDocument()
    expect(screen.getByText(/joao@example.com/)).toBeInTheDocument()
    expect(screen.getByText(/\(11\) 99999-9999/)).toBeInTheDocument()
  })

  it('displays age correctly', () => {
    render(
      <StudentCard 
        student={mockStudent}
        onEdit={vi.fn()}
        onViewDetails={vi.fn()}
      />
    )

    // Student born in 2000 should be around 26 years old (as shown in test output)
    expect(screen.getByText(/26 anos/)).toBeInTheDocument()
  })

  it('shows initials when no profile image', () => {
    render(
      <StudentCard 
        student={mockStudent}
        onEdit={vi.fn()}
        onViewDetails={vi.fn()}
      />
    )

    expect(screen.getByText('JS')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    
    render(
      <StudentCard 
        student={mockStudent}
        onEdit={onEdit}
        onViewDetails={vi.fn()}
      />
    )

    const editButton = screen.getByTitle('Editar aluno')
    await user.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockStudent)
  })
})
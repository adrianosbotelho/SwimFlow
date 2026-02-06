import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '../DashboardPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../services/authService', () => {
  return {
    default: {
      getUser: () => ({
        id: 'user-1',
        name: 'Maria Silva',
        email: 'maria@swimflow.com',
        role: 'admin',
        profileImage: null,
      }),
    },
  }
})

vi.mock('../../components/UserProfileHighlight', () => {
  return {
    UserProfileHighlight: ({ onNavigateToProfile, onQuickAction }: any) => (
      <div>
        <button onClick={onNavigateToProfile}>Ver Perfil</button>
        <button onClick={onQuickAction}>Acao Rapida</button>
      </div>
    ),
  }
})

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  )

describe('DashboardPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders main dashboard sections', () => {
    renderDashboard()

    expect(screen.getByText('SwimFlow')).toBeInTheDocument()
    expect(screen.getByText('Acessos Rapidos')).toBeInTheDocument()
    expect(screen.getByText('Atividades Recentes')).toBeInTheDocument()
    expect(screen.getByText('Total de Alunos')).toBeInTheDocument()
  })

  it('navigates to profile from highlight component', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await user.click(screen.getByText('Ver Perfil'))

    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })

  it('navigates to quick action based on role', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await user.click(screen.getByText('Acao Rapida'))

    expect(mockNavigate).toHaveBeenCalledWith('/professors')
  })
})

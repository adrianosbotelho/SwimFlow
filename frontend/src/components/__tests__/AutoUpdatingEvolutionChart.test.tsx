import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AutoUpdatingEvolutionChart } from '../AutoUpdatingEvolutionChart';

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock the WebSocket service entirely
vi.mock('../services/websocketService', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribeToStudent: vi.fn(),
    unsubscribeFromStudent: vi.fn(),
    addEventListener: vi.fn(() => vi.fn()),
    isConnected: vi.fn(() => true),
    getConnectionState: vi.fn(() => ({ connected: true, reconnectAttempts: 0 }))
  }
}));

// Mock the hooks and services
vi.mock('../hooks/useEvolutionData', () => ({
  useEvolutionData: vi.fn(() => ({
    summary: {
      overallProgress: 15.5,
      strongestStroke: 'crawl',
      weakestStroke: 'borboleta',
      recentTrend: 'improving',
      daysToNextLevel: 45,
      recommendedFocus: ['Focar em técnica de borboleta', 'Manter ritmo atual de crawl']
    },
    loading: false,
    error: null,
    lastUpdated: new Date('2024-01-15T10:30:00Z'),
    refresh: vi.fn()
  }))
}));

vi.mock('../hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    isConnected: true
  })),
  useStudentWebSocketEvents: vi.fn()
}));

// Mock the EvolutionChart component
vi.mock('../EvaluationChart', () => ({
  EvolutionChart: ({ studentId, metric }: { studentId: string; metric: string }) => (
    <div data-testid="evolution-chart">
      Chart for student {studentId} - metric: {metric}
    </div>
  )
}));

describe('AutoUpdatingEvolutionChart', () => {
  const mockStudentId = 'student-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render chart controls and summary', async () => {
    render(<AutoUpdatingEvolutionChart studentId={mockStudentId} />);

    // Check for controls
    expect(screen.getByLabelText('Nado:')).toBeInTheDocument();
    expect(screen.getByLabelText('Métrica:')).toBeInTheDocument();
    expect(screen.getByLabelText('Período:')).toBeInTheDocument();
    expect(screen.getByLabelText('Atualização automática')).toBeInTheDocument();

    // Check for summary stats
    await waitFor(() => {
      expect(screen.getByText('+15.5%')).toBeInTheDocument();
      expect(screen.getByText('Crawl')).toBeInTheDocument();
      expect(screen.getByText('45d')).toBeInTheDocument();
    });

    // Check for chart
    expect(screen.getByTestId('evolution-chart')).toBeInTheDocument();
  });

  it('should show connection status', () => {
    render(<AutoUpdatingEvolutionChart studentId={mockStudentId} />);

    // Should show connected status
    expect(screen.getByText('Conectado')).toBeInTheDocument();
    expect(screen.getByTitle('Atualizações em tempo real ativas')).toBeInTheDocument();
  });

  it('should display recommendations', async () => {
    render(<AutoUpdatingEvolutionChart studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText('Recomendações de Foco')).toBeInTheDocument();
      expect(screen.getByText('Focar em técnica de borboleta')).toBeInTheDocument();
      expect(screen.getByText('Manter ritmo atual de crawl')).toBeInTheDocument();
    });
  });

  it('should show last updated time', async () => {
    render(<AutoUpdatingEvolutionChart studentId={mockStudentId} />);

    await waitFor(() => {
      expect(screen.getByText(/Última atualização:/)).toBeInTheDocument();
    });
  });
});
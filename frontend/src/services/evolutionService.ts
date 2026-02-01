import axios from 'axios';
import { apiConfig } from '../config/api';
import { StrokeType } from '../types/evaluation';

// Create axios instance
const api = axios.create(apiConfig);

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface EvolutionTrendData {
  studentId: string;
  strokeType: StrokeType;
  evaluations: {
    date: string;
    technique: number;
    timeSeconds?: number;
    resistance: number;
  }[];
  trends: {
    technique: TrendAnalysis;
    resistance: TrendAnalysis;
    overall: TrendAnalysis;
  };
  statistics: {
    totalEvaluations: number;
    averageScores: {
      technique: number;
      resistance: number;
      overall: number;
    };
    bestScores: {
      technique: number;
      resistance: number;
      overall: number;
    };
    latestScores: {
      technique: number;
      resistance: number;
      overall: number;
    };
    improvementRate: number;
  };
}

export interface TrendAnalysis {
  slope: number;
  direction: 'improving' | 'declining' | 'stable';
  improvement: number;
}

export interface ProgressionAnalysis {
  studentId: string;
  currentLevel: string;
  levelHistory: {
    fromLevel: string | null;
    toLevel: string;
    changedAt: string;
    reason: string;
  }[];
  readinessForNextLevel: {
    score: number;
    level: 'ready' | 'almost_ready' | 'needs_improvement' | 'not_ready';
    factors: string[];
  };
  recommendedActions: string[];
  recentProgressionEvaluations: number;
  overallTrend: 'improving' | 'stable' | 'declining';
}

export interface ChartDataPoint {
  date: string;
  technique: number;
  resistance: number;
  overall: number;
  timeSeconds?: number;
}

export interface ChartData {
  strokeType: StrokeType;
  data: ChartDataPoint[];
  trend: TrendAnalysis;
  statistics: EvolutionTrendData['statistics'];
}

export interface EvolutionMetrics {
  studentId: string;
  strokeType: StrokeType;
  timeRange: string;
  dataPoints: {
    date: string;
    technique: number;
    resistance: number;
    overall: number;
    timeSeconds?: number;
    evaluationId: string;
  }[];
  trends: {
    technique: {
      slope: number;
      correlation: number;
      direction: 'improving' | 'declining' | 'stable';
      confidence: number;
    };
    resistance: {
      slope: number;
      correlation: number;
      direction: 'improving' | 'declining' | 'stable';
      confidence: number;
    };
    overall: {
      slope: number;
      correlation: number;
      direction: 'improving' | 'declining' | 'stable';
      confidence: number;
    };
  };
  predictions: {
    nextEvaluationPrediction: {
      technique: number;
      resistance: number;
      overall: number;
      confidence: number;
    };
    timeToNextLevel: {
      estimatedDays: number | null;
      confidence: number;
      requiredImprovement: number;
    };
  };
  milestones: {
    date: string;
    type: 'improvement' | 'decline' | 'plateau' | 'breakthrough';
    description: string;
    impact: 'high' | 'medium' | 'low';
    strokeType: StrokeType;
  }[];
}

export interface ComparisonMetrics {
  studentId: string;
  level: string;
  strokeType: StrokeType;
  studentAverage: number;
  levelAverage: number;
  percentile: number;
  ranking: number;
  totalStudentsInLevel: number;
}

export interface EvolutionSummary {
  overallProgress: number;
  strongestStroke: StrokeType | null;
  weakestStroke: StrokeType | null;
  recentTrend: 'improving' | 'stable' | 'declining';
  daysToNextLevel: number | null;
  recommendedFocus: string[];
}

class EvolutionService {
  async getEvolutionTrends(
    studentId: string, 
    strokeType?: StrokeType, 
    timeRange?: string
  ): Promise<EvolutionTrendData[]> {
    const params = new URLSearchParams();
    if (strokeType) params.append('strokeType', strokeType);
    if (timeRange) params.append('timeRange', timeRange);
    
    const response = await api.get(`/evaluations/student/${studentId}/trends?${params}`);
    return response.data.data;
  }

  async getProgressionAnalysis(studentId: string): Promise<ProgressionAnalysis> {
    const response = await api.get(`/evaluations/student/${studentId}/progression`);
    return response.data.data;
  }

  async getChartData(
    studentId: string,
    strokeType?: StrokeType,
    timeRange?: string,
    metric?: string
  ): Promise<{
    data: ChartData[];
    metadata: {
      timeRange: string;
      metric: string;
      totalStrokes: number;
    };
  }> {
    const params = new URLSearchParams();
    if (strokeType) params.append('strokeType', strokeType);
    if (timeRange) params.append('timeRange', timeRange);
    if (metric) params.append('metric', metric);
    
    const response = await api.get(`/evaluations/student/${studentId}/chart-data?${params}`);
    return {
      data: response.data.data,
      metadata: response.data.metadata
    };
  }

  async getDetailedMetrics(
    studentId: string,
    strokeType?: StrokeType,
    timeRange?: string
  ): Promise<EvolutionMetrics[]> {
    const params = new URLSearchParams();
    if (strokeType) params.append('strokeType', strokeType);
    if (timeRange) params.append('timeRange', timeRange);
    
    const response = await api.get(`/evaluations/student/${studentId}/detailed-metrics?${params}`);
    return response.data.data;
  }

  async getComparativeAnalysis(studentId: string): Promise<ComparisonMetrics[]> {
    const response = await api.get(`/evaluations/student/${studentId}/comparison`);
    return response.data.data;
  }

  async getEvolutionSummary(studentId: string): Promise<EvolutionSummary> {
    const response = await api.get(`/evaluations/student/${studentId}/summary`);
    return response.data.data;
  }

  // Enhanced method to get evolution data for charts
  async getEvolutionData(
    studentId: string,
    strokeType?: StrokeType
  ): Promise<{
    studentId: string;
    strokeType: StrokeType;
    evaluations: {
      date: string;
      technique: number;
      resistance: number;
      overall: number;
      timeSeconds?: number;
    }[];
  }[]> {
    const response = await api.get(`/evaluations/student/${studentId}/evolution`, {
      params: { strokeType }
    });
    return response.data.data;
  }

  // Method to generate timeline events from milestones
  async getTimelineEvents(studentId: string): Promise<{
    id: string;
    date: string;
    type: 'improvement' | 'decline' | 'plateau' | 'breakthrough' | 'level_change' | 'evaluation';
    title: string;
    description: string;
    strokeType?: StrokeType;
    impact?: 'high' | 'medium' | 'low';
    value?: number;
    previousValue?: number;
    metadata?: {
      evaluationId?: string;
      fromLevel?: string;
      toLevel?: string;
      professorName?: string;
    };
  }[]> {
    try {
      const [metrics, evaluations] = await Promise.all([
        this.getDetailedMetrics(studentId),
        api.get(`/evaluations/student/${studentId}`)
      ]);

      const events: any[] = [];

      // Add milestone events from metrics
      metrics.forEach(metric => {
        metric.milestones.forEach((milestone, index) => {
          events.push({
            id: `milestone-${metric.strokeType}-${index}`,
            date: milestone.date,
            type: milestone.type,
            title: milestone.description,
            description: milestone.description,
            strokeType: milestone.strokeType,
            impact: milestone.impact
          });
        });
      });

      // Add evaluation events
      if (evaluations.data.data) {
        evaluations.data.data.slice(0, 10).forEach((evaluation: any) => {
          const avgScore = evaluation.strokeEvaluations.reduce(
            (sum: number, se: any) => sum + (se.technique + se.resistance) / 2, 0
          ) / evaluation.strokeEvaluations.length;

          events.push({
            id: `evaluation-${evaluation.id}`,
            date: evaluation.date,
            type: 'evaluation' as const,
            title: 'Nova Avaliação',
            description: `Avaliação registrada com média de ${avgScore.toFixed(1)}/10`,
            value: avgScore,
            metadata: {
              evaluationId: evaluation.id,
              professorName: evaluation.professor?.name
            }
          });
        });
      }

      // Sort by date (most recent first)
      return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching timeline events:', error);
      return [];
    }
  }

  // Utility methods for data processing
  formatTrendDirection(direction: 'improving' | 'declining' | 'stable'): string {
    switch (direction) {
      case 'improving': return 'Melhorando';
      case 'declining': return 'Declinando';
      case 'stable': return 'Estável';
      default: return 'Desconhecido';
    }
  }

  getTrendColor(direction: 'improving' | 'declining' | 'stable'): string {
    switch (direction) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      case 'stable': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  }

  getTrendIcon(direction: 'improving' | 'declining' | 'stable'): string {
    switch (direction) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  }

  formatReadinessLevel(level: 'ready' | 'almost_ready' | 'needs_improvement' | 'not_ready'): {
    label: string;
    color: string;
    bgColor: string;
  } {
    switch (level) {
      case 'ready':
        return {
          label: 'Pronto',
          color: 'text-green-800',
          bgColor: 'bg-green-100'
        };
      case 'almost_ready':
        return {
          label: 'Quase Pronto',
          color: 'text-yellow-800',
          bgColor: 'bg-yellow-100'
        };
      case 'needs_improvement':
        return {
          label: 'Precisa Melhorar',
          color: 'text-orange-800',
          bgColor: 'bg-orange-100'
        };
      case 'not_ready':
        return {
          label: 'Não Pronto',
          color: 'text-red-800',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          label: 'Desconhecido',
          color: 'text-gray-800',
          bgColor: 'bg-gray-100'
        };
    }
  }

  calculateProgressPercentage(current: number, target: number): number {
    return Math.min(Math.round((current / target) * 100), 100);
  }

  formatTimeEstimate(days: number | null): string {
    if (!days) return 'Não estimado';
    
    if (days < 30) return `${days} dias`;
    if (days < 365) return `${Math.round(days / 30)} meses`;
    return `${Math.round(days / 365)} anos`;
  }

  getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.8) return 'Alta confiança';
    if (confidence >= 0.6) return 'Média confiança';
    if (confidence >= 0.4) return 'Baixa confiança';
    return 'Muito baixa confiança';
  }

  getMilestoneIcon(type: 'improvement' | 'decline' | 'plateau' | 'breakthrough'): string {
    switch (type) {
      case 'improvement': return '⬆️';
      case 'decline': return '⬇️';
      case 'plateau': return '➡️';
      case 'breakthrough': return '🚀';
      default: return '📊';
    }
  }

  getMilestoneColor(impact: 'high' | 'medium' | 'low'): string {
    switch (impact) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  }
}

export default new EvolutionService();
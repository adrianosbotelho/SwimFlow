import axios from 'axios';
import { apiConfig } from '../config/api';
import chartCacheService, { ChartCacheKey } from './chartCacheService';
import type { EvolutionData, StrokeType } from '../types/evaluation';

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

export interface EvolutionTrends {
  studentId: string;
  strokeType: StrokeType;
  evaluations: Array<{
    date: Date;
    technique: number;
    timeSeconds?: number;
    resistance: number;
  }>;
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

export interface EvolutionSummary {
  overallProgress: number;
  strongestStroke: StrokeType | null;
  weakestStroke: StrokeType | null;
  recentTrend: 'improving' | 'stable' | 'declining';
  daysToNextLevel: number | null;
  recommendedFocus: string[];
}

export interface DetailedMetrics {
  studentId: string;
  strokeType: StrokeType;
  timeRange: string;
  dataPoints: Array<{
    date: Date;
    technique: number;
    resistance: number;
    overall: number;
    timeSeconds?: number;
    evaluationId: string;
  }>;
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
  milestones: Array<{
    date: Date;
    type: 'improvement' | 'decline' | 'plateau' | 'breakthrough';
    description: string;
    impact: 'high' | 'medium' | 'low';
    strokeType: StrokeType;
  }>;
}

class EvolutionService {
  private loadingStates = new Map<string, boolean>();
  private errorStates = new Map<string, string | null>();
  private listeners = new Set<(studentId: string, type: 'loading' | 'error' | 'success', data?: any) => void>();

  // Event listeners for state changes
  addStateListener(callback: (studentId: string, type: 'loading' | 'error' | 'success', data?: any) => void): () => void {
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(studentId: string, type: 'loading' | 'error' | 'success', data?: any): void {
    this.listeners.forEach(callback => {
      try {
        callback(studentId, type, data);
      } catch (error) {
        console.error('Error in evolution service listener:', error);
      }
    });
  }

  private setLoading(key: string, loading: boolean): void {
    this.loadingStates.set(key, loading);
  }

  private setError(key: string, error: string | null): void {
    this.errorStates.set(key, error);
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  getError(key: string): string | null {
    return this.errorStates.get(key) || null;
  }

  async getEvolutionData(
    studentId: string, 
    strokeType?: StrokeType,
    useCache: boolean = true
  ): Promise<EvolutionData[]> {
    const cacheKey: ChartCacheKey = { studentId, strokeType };
    const loadingKey = `evolution-${studentId}-${strokeType || 'all'}`;

    // Check cache first
    if (useCache) {
      const cached = chartCacheService.get<EvolutionData[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Set loading state
    this.setLoading(loadingKey, true);
    this.setError(loadingKey, null);
    this.notifyListeners(studentId, 'loading');

    try {
      const params = new URLSearchParams();
      if (strokeType) params.append('strokeType', strokeType);
      
      const response = await api.get(`/api/evaluations/student/${studentId}/evolution?${params.toString()}`);
      const data = response.data.data;

      // Cache the result
      chartCacheService.set(cacheKey, data);

      this.setLoading(loadingKey, false);
      this.notifyListeners(studentId, 'success', data);
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch evolution data';
      this.setError(loadingKey, errorMessage);
      this.setLoading(loadingKey, false);
      this.notifyListeners(studentId, 'error', errorMessage);
      
      throw error;
    }
  }

  async getEvolutionTrends(
    studentId: string,
    strokeType?: StrokeType,
    timeRange?: string,
    useCache: boolean = true
  ): Promise<EvolutionTrends[]> {
    const cacheKey: ChartCacheKey = { studentId, strokeType, timeRange };
    const loadingKey = `trends-${studentId}-${strokeType || 'all'}-${timeRange || 'all'}`;

    // Check cache first
    if (useCache) {
      const cached = chartCacheService.get<EvolutionTrends[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Set loading state
    this.setLoading(loadingKey, true);
    this.setError(loadingKey, null);
    this.notifyListeners(studentId, 'loading');

    try {
      const params = new URLSearchParams();
      if (strokeType) params.append('strokeType', strokeType);
      if (timeRange) params.append('timeRange', timeRange);
      
      const response = await api.get(`/api/evaluations/student/${studentId}/trends?${params.toString()}`);
      const data = response.data.data;

      // Cache the result
      chartCacheService.set(cacheKey, data);

      this.setLoading(loadingKey, false);
      this.notifyListeners(studentId, 'success', data);
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch evolution trends';
      this.setError(loadingKey, errorMessage);
      this.setLoading(loadingKey, false);
      this.notifyListeners(studentId, 'error', errorMessage);
      
      throw error;
    }
  }

  async getDetailedMetrics(
    studentId: string,
    strokeType?: StrokeType,
    timeRange?: string,
    useCache: boolean = true
  ): Promise<DetailedMetrics[]> {
    const cacheKey: ChartCacheKey = { studentId, strokeType, timeRange };
    const loadingKey = `detailed-${studentId}-${strokeType || 'all'}-${timeRange || 'all'}`;

    // Check cache first
    if (useCache) {
      const cached = chartCacheService.get<DetailedMetrics[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Set loading state
    this.setLoading(loadingKey, true);
    this.setError(loadingKey, null);
    this.notifyListeners(studentId, 'loading');

    try {
      const params = new URLSearchParams();
      if (strokeType) params.append('strokeType', strokeType);
      if (timeRange) params.append('timeRange', timeRange);
      
      const response = await api.get(`/api/evaluations/student/${studentId}/detailed-metrics?${params.toString()}`);
      const data = response.data.data;

      // Cache the result
      chartCacheService.set(cacheKey, data);

      this.setLoading(loadingKey, false);
      this.notifyListeners(studentId, 'success', data);
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch detailed metrics';
      this.setError(loadingKey, errorMessage);
      this.setLoading(loadingKey, false);
      this.notifyListeners(studentId, 'error', errorMessage);
      
      throw error;
    }
  }

  async getEvolutionSummary(
    studentId: string,
    useCache: boolean = true
  ): Promise<EvolutionSummary> {
    const cacheKey: ChartCacheKey = { studentId };
    const loadingKey = `summary-${studentId}`;

    // Check cache first
    if (useCache) {
      const cached = chartCacheService.get<EvolutionSummary>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Set loading state
    this.setLoading(loadingKey, true);
    this.setError(loadingKey, null);
    this.notifyListeners(studentId, 'loading');

    try {
      const response = await api.get(`/api/evaluations/student/${studentId}/summary`);
      const data = response.data.data;

      // Cache the result
      chartCacheService.set(cacheKey, data);

      this.setLoading(loadingKey, false);
      this.notifyListeners(studentId, 'success', data);
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch evolution summary';
      this.setError(loadingKey, errorMessage);
      this.setLoading(loadingKey, false);
      this.notifyListeners(studentId, 'error', errorMessage);
      
      throw error;
    }
  }

  // Invalidate cache when evaluations change
  invalidateStudentCache(studentId: string): void {
    chartCacheService.invalidateStudent(studentId);
    
    // Clear loading and error states
    const keysToClean = Array.from(this.loadingStates.keys()).filter(key => key.includes(studentId));
    keysToClean.forEach(key => {
      this.loadingStates.delete(key);
      this.errorStates.delete(key);
    });

    // Notify listeners that cache was invalidated
    this.notifyListeners(studentId, 'success', { cacheInvalidated: true });
  }

  // Force refresh data (bypass cache)
  async refreshEvolutionData(studentId: string, strokeType?: StrokeType): Promise<EvolutionData[]> {
    return this.getEvolutionData(studentId, strokeType, false);
  }

  async refreshEvolutionTrends(studentId: string, strokeType?: StrokeType, timeRange?: string): Promise<EvolutionTrends[]> {
    return this.getEvolutionTrends(studentId, strokeType, timeRange, false);
  }

  async refreshDetailedMetrics(studentId: string, strokeType?: StrokeType, timeRange?: string): Promise<DetailedMetrics[]> {
    return this.getDetailedMetrics(studentId, strokeType, timeRange, false);
  }

  async refreshEvolutionSummary(studentId: string): Promise<EvolutionSummary> {
    return this.getEvolutionSummary(studentId, false);
  }

  // Preload data for better UX
  async preloadStudentData(studentId: string): Promise<void> {
    try {
      // Preload basic evolution data
      await this.getEvolutionData(studentId);
      
      // Preload trends for different time ranges
      const timeRanges = ['3months', '6months', '1year', 'all'];
      await Promise.all(
        timeRanges.map(timeRange => 
          this.getEvolutionTrends(studentId, undefined, timeRange).catch(() => {
            // Ignore errors during preloading
          })
        )
      );
      
      // Preload summary
      await this.getEvolutionSummary(studentId);
    } catch (error) {
      // Ignore errors during preloading
      console.warn('Error preloading student data:', error);
    }
  }
}

export default new EvolutionService();
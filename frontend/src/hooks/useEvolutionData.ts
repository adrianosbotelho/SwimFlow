import { useState, useEffect, useCallback, useRef } from 'react';
import evolutionService, { EvolutionTrends, EvolutionSummary, DetailedMetrics } from '../services/evolutionService';
import chartCacheService from '../services/chartCacheService';
import type { EvolutionData, StrokeType } from '../types/evaluation';

export interface UseEvolutionDataOptions {
  studentId: string;
  strokeType?: StrokeType;
  timeRange?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface EvolutionDataState {
  data: EvolutionData[] | null;
  trends: EvolutionTrends[] | null;
  summary: EvolutionSummary | null;
  detailedMetrics: DetailedMetrics[] | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useEvolutionData(options: UseEvolutionDataOptions) {
  const {
    studentId,
    strokeType,
    timeRange,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [state, setState] = useState<EvolutionDataState>({
    data: null,
    trends: null,
    summary: null,
    detailedMetrics: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const refreshTimeoutRef = useRef<number>();
  const mountedRef = useRef(true);

  // Update state safely (only if component is still mounted)
  const updateState = useCallback((updates: Partial<EvolutionDataState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Load all evolution data
  const loadData = useCallback(async (forceRefresh = false) => {
    if (!studentId) return;

    updateState({ loading: true, error: null });

    try {
      const [data, trends, summary, detailedMetrics] = await Promise.all([
        forceRefresh 
          ? evolutionService.refreshEvolutionData(studentId, strokeType)
          : evolutionService.getEvolutionData(studentId, strokeType),
        
        forceRefresh
          ? evolutionService.refreshEvolutionTrends(studentId, strokeType, timeRange)
          : evolutionService.getEvolutionTrends(studentId, strokeType, timeRange),
        
        forceRefresh
          ? evolutionService.refreshEvolutionSummary(studentId)
          : evolutionService.getEvolutionSummary(studentId),
        
        forceRefresh
          ? evolutionService.refreshDetailedMetrics(studentId, strokeType, timeRange)
          : evolutionService.getDetailedMetrics(studentId, strokeType, timeRange)
      ]);

      updateState({
        data,
        trends,
        summary,
        detailedMetrics,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load evolution data';
      updateState({
        loading: false,
        error: errorMessage
      });
    }
  }, [studentId, strokeType, timeRange, updateState]);

  // Refresh data manually
  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const setupAutoRefresh = () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        refreshTimeoutRef.current = window.setTimeout(() => {
          loadData(false); // Use cache if available
          setupAutoRefresh(); // Schedule next refresh
        }, refreshInterval);
      };

      setupAutoRefresh();

      return () => {
        if (refreshTimeoutRef.current) {
          window.clearTimeout(refreshTimeoutRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, loadData]);

  // Listen for cache invalidation events
  useEffect(() => {
    const unsubscribe = chartCacheService.addInvalidationListener((key) => {
      // Check if this invalidation affects our data
      if (key.includes(studentId)) {
        // Reload data when cache is invalidated
        loadData(false);
      }
    });

    return unsubscribe;
  }, [studentId, loadData]);

  // Listen for evolution service state changes
  useEffect(() => {
    const unsubscribe = evolutionService.addStateListener((affectedStudentId, type, data) => {
      if (affectedStudentId === studentId) {
        switch (type) {
          case 'loading':
            updateState({ loading: true, error: null });
            break;
          case 'error':
            updateState({ loading: false, error: data });
            break;
          case 'success':
            if (data?.cacheInvalidated) {
              // Cache was invalidated, reload data
              loadData(false);
            }
            break;
        }
      }
    });

    return unsubscribe;
  }, [studentId, loadData, updateState]);

  // Initial data load
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    refresh,
    isLoading: state.loading,
    hasError: !!state.error,
    isEmpty: !state.loading && !state.error && (!state.data || state.data.length === 0)
  };
}

// Hook for just evolution data (lighter weight)
export function useEvolutionDataOnly(studentId: string, strokeType?: StrokeType) {
  const [data, setData] = useState<EvolutionData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const result = forceRefresh 
        ? await evolutionService.refreshEvolutionData(studentId, strokeType)
        : await evolutionService.getEvolutionData(studentId, strokeType);

      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load evolution data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [studentId, strokeType]);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  // Listen for cache invalidation
  useEffect(() => {
    const unsubscribe = chartCacheService.addInvalidationListener((key) => {
      if (key.includes(studentId)) {
        loadData(false);
      }
    });

    return unsubscribe;
  }, [studentId, loadData]);

  // Initial load
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    isLoading: loading,
    hasError: !!error,
    isEmpty: !loading && !error && (!data || data.length === 0)
  };
}

// Hook for evolution trends only
export function useEvolutionTrends(
  studentId: string, 
  strokeType?: StrokeType, 
  timeRange?: string
) {
  const [trends, setTrends] = useState<EvolutionTrends[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadTrends = useCallback(async (forceRefresh = false) => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const result = forceRefresh 
        ? await evolutionService.refreshEvolutionTrends(studentId, strokeType, timeRange)
        : await evolutionService.getEvolutionTrends(studentId, strokeType, timeRange);

      setTrends(result);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load evolution trends';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [studentId, strokeType, timeRange]);

  const refresh = useCallback(() => {
    return loadTrends(true);
  }, [loadTrends]);

  // Listen for cache invalidation
  useEffect(() => {
    const unsubscribe = chartCacheService.addInvalidationListener((key) => {
      if (key.includes(studentId)) {
        loadTrends(false);
      }
    });

    return unsubscribe;
  }, [studentId, loadTrends]);

  // Initial load
  useEffect(() => {
    loadTrends(false);
  }, [loadTrends]);

  return {
    trends,
    loading,
    error,
    lastUpdated,
    refresh,
    isLoading: loading,
    hasError: !!error,
    isEmpty: !loading && !error && (!trends || trends.length === 0)
  };
}
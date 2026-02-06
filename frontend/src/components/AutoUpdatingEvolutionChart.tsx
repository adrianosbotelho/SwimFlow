import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EvolutionChart } from './EvaluationChart';
import { useEvolutionData } from '../hooks/useEvolutionData';
import { useStudentWebSocketEvents, useWebSocket } from '../hooks/useWebSocket';
import type { StrokeType } from '../types/evaluation';

interface AutoUpdatingEvolutionChartProps {
  studentId: string;
  className?: string;
}

export const AutoUpdatingEvolutionChart: React.FC<AutoUpdatingEvolutionChartProps> = ({
  studentId,
  className = ''
}) => {
  const [selectedStroke, setSelectedStroke] = useState<StrokeType | undefined>();
  const [selectedMetric, setSelectedMetric] = useState<'technique' | 'resistance' | 'overall' | 'time'>('overall');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'3months' | '6months' | '1year' | 'all'>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastWebSocketUpdate, setLastWebSocketUpdate] = useState<Date | null>(null);

  // WebSocket connection status
  const { isConnected: wsConnected } = useWebSocket();

  // Use the comprehensive evolution data hook
  const {
    summary,
    loading,
    error,
    lastUpdated,
    refresh
  } = useEvolutionData({
    studentId,
    strokeType: selectedStroke,
    timeRange: selectedTimeRange,
    autoRefresh,
    refreshInterval: 30000 // 30 seconds
  });

  // Listen for WebSocket events for this student
  useStudentWebSocketEvents(
    studentId,
    useCallback((data: any) => {
      console.log('Received evaluation change via WebSocket:', data);
      setLastWebSocketUpdate(new Date());
      // The cache invalidation is handled automatically by the WebSocket service
    }, []),
    useCallback((data: any) => {
      console.log('Received student change via WebSocket:', data);
      setLastWebSocketUpdate(new Date());
    }, [])
  );

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const strokeTypes: StrokeType[] = ['crawl', 'costas', 'peito', 'borboleta'];
  const metrics = [
    { value: 'overall', label: 'Geral' },
    { value: 'technique', label: 'Técnica' },
    { value: 'resistance', label: 'Resistência' },
    { value: 'time', label: 'Tempo' }
  ] as const;

  const timeRanges = [
    { value: 'all', label: 'Todos os dados' },
    { value: '1year', label: 'Último ano' },
    { value: '6months', label: 'Últimos 6 meses' },
    { value: '3months', label: 'Últimos 3 meses' }
  ] as const;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Stroke Type Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Nado:</label>
              <select
                value={selectedStroke || ''}
                onChange={(e) => setSelectedStroke(e.target.value as StrokeType || undefined)}
                className="input-modern text-sm py-2"
              >
                <option value="">Todos</option>
                {strokeTypes.map(stroke => (
                  <option key={stroke} value={stroke}>
                    {stroke.charAt(0).toUpperCase() + stroke.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Metric Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Métrica:</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="input-modern text-sm py-2"
              >
                {metrics.map(metric => (
                  <option key={metric.value} value={metric.value}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Período:</label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="input-modern text-sm py-2"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Auto Refresh Toggle */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">Atualização automática</span>
            </label>

            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                loading ? 'bg-yellow-500 animate-pulse' : 
                error ? 'bg-red-500' : 
                wsConnected ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-xs text-gray-500">
                {loading ? 'Carregando...' : 
                 error ? 'Erro' : 
                 wsConnected ? 'Conectado' : 'Desconectado'}
              </span>
              {wsConnected && (
                <span className="text-xs text-green-600" title="Atualizações em tempo real ativas">
                  🔄
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/40 dark:border-slate-700/60"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary.overallProgress > 0 ? '+' : ''}{summary.overallProgress.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Progresso Geral</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">
                    {summary.strongestStroke?.charAt(0).toUpperCase() + (summary.strongestStroke?.slice(1) || 'N/A')}
                  </div>
                  <div className="text-sm text-gray-600">Nado Forte</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    summary.recentTrend === 'improving' ? 'text-green-600' :
                    summary.recentTrend === 'declining' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {summary.recentTrend === 'improving' ? '↗️' :
                     summary.recentTrend === 'declining' ? '↘️' : '→'}
                  </div>
                  <div className="text-sm text-gray-600">Tendência</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-600">
                    {summary.daysToNextLevel ? `${summary.daysToNextLevel}d` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Próximo Nível</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Chart */}
      <EvolutionChart
        studentId={studentId}
        selectedStroke={selectedStroke}
        metric={selectedMetric}
        timeRange={selectedTimeRange}
        height={400}
        autoRefresh={autoRefresh}
        onRefresh={handleRefresh}
      />

      {/* Recommendations */}
      <AnimatePresence>
        {summary?.recommendedFocus && summary.recommendedFocus.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card-gradient"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Recomendações de Foco
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {summary.recommendedFocus.map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-2 p-3 bg-white/70 dark:bg-slate-900/70 rounded-lg border border-white/40 dark:border-slate-700/60"
                >
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{recommendation}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last Updated Info */}
      {(lastUpdated || lastWebSocketUpdate) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-gray-500"
        >
          Última atualização: {(lastWebSocketUpdate && lastWebSocketUpdate > (lastUpdated || new Date(0))) 
            ? lastWebSocketUpdate.toLocaleString('pt-BR') + ' (tempo real)'
            : (lastUpdated?.toLocaleString('pt-BR') || 'N/A')
          }
          {autoRefresh && (
            <span className="ml-2 text-blue-600">
              • Atualização automática ativa
            </span>
          )}
          {wsConnected && (
            <span className="ml-2 text-green-600">
              • Tempo real conectado
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
};

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { useEvolutionDataOnly } from '../hooks/useEvolutionData';
import { StrokeType, getStrokeColor, getStrokeLabel } from '../types/evaluation';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EvolutionChartProps {
  studentId: string;
  selectedStroke?: StrokeType;
  metric?: 'technique' | 'resistance' | 'overall' | 'time';
  timeRange?: '3months' | '6months' | '1year' | 'all';
  showTrendLine?: boolean;
  showPredictions?: boolean;
  height?: number;
  autoRefresh?: boolean;
  onRefresh?: () => void;
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({
  studentId,
  selectedStroke,
  metric = 'overall',
  timeRange = 'all',
  height = 400,
  onRefresh
}) => {
  // Use the evolution data hook
  const { data: evolutionData, loading, error, refresh, lastUpdated } = useEvolutionDataOnly(studentId, selectedStroke);
  const filteredData = useMemo(() => {
    if (!evolutionData || evolutionData.length === 0) return [];
    
    let data = selectedStroke 
      ? evolutionData.filter(d => d.strokeType === selectedStroke)
      : evolutionData;

    // Apply time range filter
    if (timeRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (timeRange) {
        case '3months':
          cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6months':
          cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '1year':
          cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          cutoffDate = new Date(0);
      }

      data = data.map(strokeData => ({
        ...strokeData,
        evaluations: strokeData.evaluations.filter(
          evaluation => new Date(evaluation.date) >= cutoffDate
        )
      })).filter(strokeData => strokeData.evaluations.length > 0);
    }

    return data;
  }, [evolutionData, selectedStroke, timeRange]);

  const chartData = useMemo(() => {
    if (filteredData.length === 0) return null;

    const datasets = filteredData.map((strokeData) => {
      const color = getStrokeColor(strokeData.strokeType);
      const strokeColor = color;
      const fillColor = color + '20'; // Add transparency

      let values: number[];
      switch (metric) {
        case 'technique':
          values = strokeData.evaluations.map(e => e.technique);
          break;
        case 'resistance':
          values = strokeData.evaluations.map(e => e.resistance);
          break;
        case 'time':
          values = strokeData.evaluations
            .filter(e => e.timeSeconds !== undefined)
            .map(e => e.timeSeconds!);
          break;
        default:
          // Calculate overall as average of technique and resistance
          values = strokeData.evaluations.map(e => (e.technique + e.resistance) / 2);
      }

      return {
        label: getStrokeLabel(strokeData.strokeType),
        data: values,
        borderColor: strokeColor,
        backgroundColor: fillColor,
        fill: filteredData.length === 1,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: strokeColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        borderWidth: 3,
      };
    });

    // Use labels from the first dataset (they should all have similar dates)
    const chartLabels = filteredData[0]?.evaluations.map(e => 
      new Date(e.date).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
      })
    ) || [];

    return { labels: chartLabels, datasets };
  }, [filteredData, metric]);

  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context) => {
            return `Avaliação de ${context[0].label}`;
          },
          label: (context: TooltipItem<'line'>) => {
            const value = context.parsed.y;
            const suffix = metric === 'time' ? 's' : '/10';
            return `${context.dataset.label}: ${value?.toFixed(1)}${suffix}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Data da Avaliação',
          font: {
            size: 12,
            weight: 500
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          maxTicksLimit: 8,
          font: {
            size: 11
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: metric === 'time' ? 'Tempo (segundos)' : 'Pontuação (1-10)',
          font: {
            size: 12,
            weight: 500
          }
        },
        min: metric === 'time' ? undefined : 0,
        max: metric === 'time' ? undefined : 10,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value) {
            return metric === 'time' ? `${value}s` : value;
          }
        }
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: '#ffffff',
      }
    }
  }), [metric]);

  // Handle refresh
  const handleRefresh = async () => {
    await refresh();
    onRefresh?.();
  };

  // Loading state
  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
        style={{ height: `${height + 120}px` }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Carregando dados de evolução...
            </h3>
            <p className="text-gray-600">
              Processando avaliações do aluno
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-red-200 p-6"
        style={{ height: `${height + 120}px` }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Erro ao carregar dados
            </h3>
            <p className="text-red-600 mb-4">
              {error}
            </p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!evolutionData || evolutionData.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum dado de evolução disponível
        </h3>
        <p className="text-gray-600">
          Registre algumas avaliações para visualizar o progresso do aluno
        </p>
      </motion.div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum dado no período selecionado
        </h3>
        <p className="text-gray-600">
          Tente selecionar um período maior ou registrar mais avaliações
        </p>
      </motion.div>
    );
  }

  if (!chartData) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-600">Erro ao processar dados do gráfico</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      {/* Chart Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Evolução - {metric === 'technique' ? 'Técnica' : 
                      metric === 'resistance' ? 'Resistência' : 
                      metric === 'time' ? 'Tempo' : 'Geral'}
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>
                {filteredData.reduce((sum, d) => sum + d.evaluations.length, 0)} avaliações
              </span>
              {timeRange !== 'all' && (
                <>
                  <span>•</span>
                  <span>
                    {timeRange === '3months' ? 'Últimos 3 meses' :
                     timeRange === '6months' ? 'Últimos 6 meses' :
                     timeRange === '1year' ? 'Último ano' : 'Todos os dados'}
                  </span>
                </>
              )}
              {lastUpdated && (
                <>
                  <span>•</span>
                  <span>
                    Atualizado: {lastUpdated.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-ocean-50 text-ocean-700 rounded-lg hover:bg-ocean-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Atualizar dados"
            >
              <svg 
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Atualizar</span>
            </button>
          </div>
        </div>
        
        {/* Stroke indicators */}
        <div className="flex flex-wrap gap-2">
          {filteredData.map((strokeData) => (
            <div key={strokeData.strokeType} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getStrokeColor(strokeData.strokeType) }}
              />
              <span className="text-sm text-gray-600">
                {getStrokeLabel(strokeData.strokeType)} ({strokeData.evaluations.length})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        <Line data={chartData} options={options} />
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredData.map((strokeData) => {
          const values = strokeData.evaluations.map(e => 
            metric === 'technique' ? e.technique :
            metric === 'resistance' ? e.resistance :
            metric === 'time' ? (e.timeSeconds || 0) :
            (e.technique + e.resistance) / 2 // Calculate overall
          ).filter(v => v > 0);

          if (values.length === 0) return null;

          const latest = values[values.length - 1];
          const average = values.reduce((sum, v) => sum + v, 0) / values.length;
          const best = metric === 'time' ? Math.min(...values) : Math.max(...values);
          const trend = values.length >= 2 ? latest - values[values.length - 2] : 0;

          return (
            <motion.div
              key={strokeData.strokeType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getStrokeColor(strokeData.strokeType) }}
                />
                <h4 className="font-medium text-gray-900">
                  {getStrokeLabel(strokeData.strokeType)}
                </h4>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Atual:</span>
                  <span className="font-medium">
                    {latest.toFixed(1)}{metric === 'time' ? 's' : '/10'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Média:</span>
                  <span className="font-medium">
                    {average.toFixed(1)}{metric === 'time' ? 's' : '/10'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {metric === 'time' ? 'Melhor:' : 'Máximo:'}
                  </span>
                  <span className="font-medium text-green-600">
                    {best.toFixed(1)}{metric === 'time' ? 's' : '/10'}
                  </span>
                </div>
                {Math.abs(trend) > 0.1 && (
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Tendência:</span>
                    <span className={`font-medium flex items-center space-x-1 ${
                      (metric === 'time' ? trend < 0 : trend > 0) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(metric === 'time' ? trend < 0 : trend > 0) ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                      )}
                      <span>
                        {Math.abs(trend).toFixed(1)}{metric === 'time' ? 's' : 'pts'}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
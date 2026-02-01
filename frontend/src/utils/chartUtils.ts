import { ChartOptions, TooltipItem } from 'chart.js';
import { StrokeType, getStrokeColor, getStrokeLabel } from '../types/evaluation';

export interface ChartDataPoint {
  date: string;
  technique: number;
  resistance: number;
  overall: number;
  timeSeconds?: number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area';
  metric: 'technique' | 'resistance' | 'overall' | 'time';
  strokeType?: StrokeType;
  timeRange: '3months' | '6months' | '1year' | 'all';
  showTrendLine: boolean;
  showPredictions: boolean;
  height: number;
  colors: {
    primary: string;
    secondary: string;
    grid: string;
    text: string;
  };
  animations: {
    duration: number;
    easing: string;
  };
}

export const defaultChartConfig: ChartConfig = {
  type: 'line',
  metric: 'overall',
  timeRange: 'all',
  showTrendLine: true,
  showPredictions: false,
  height: 400,
  colors: {
    primary: '#0ea5e9',
    secondary: '#14b8a6',
    grid: 'rgba(0, 0, 0, 0.1)',
    text: '#374151'
  },
  animations: {
    duration: 750,
    easing: 'easeInOutQuart'
  }
};

export const createChartOptions = (config: Partial<ChartConfig> = {}): ChartOptions<'line'> => {
  const finalConfig = { ...defaultChartConfig, ...config };
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: finalConfig.animations.duration,
      easing: finalConfig.animations.easing as any
    },
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
          },
          color: finalConfig.colors.text
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
            const suffix = finalConfig.metric === 'time' ? 's' : '/10';
            return `${context.dataset.label}: ${value?.toFixed(1)}${suffix}`;
          },
          afterBody: (context) => {
            if (finalConfig.metric === 'overall' && context.length > 0) {
              const value = context[0].parsed.y;
              let performance = '';
              if (value && value >= 8) performance = '🏆 Excelente';
              else if (value && value >= 6) performance = '👍 Bom';
              else if (value && value >= 4) performance = '⚠️ Regular';
              else performance = '📈 Precisa melhorar';
              
              return performance;
            }
            return '';
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
          },
          color: finalConfig.colors.text
        },
        grid: {
          color: finalConfig.colors.grid,
        },
        ticks: {
          maxTicksLimit: 8,
          font: {
            size: 11
          },
          color: finalConfig.colors.text
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: getYAxisLabel(finalConfig.metric),
          font: {
            size: 12,
            weight: 500
          },
          color: finalConfig.colors.text
        },
        min: finalConfig.metric === 'time' ? undefined : 0,
        max: finalConfig.metric === 'time' ? undefined : 10,
        grid: {
          color: finalConfig.colors.grid,
        },
        ticks: {
          font: {
            size: 11
          },
          color: finalConfig.colors.text,
          callback: function(value) {
            return finalConfig.metric === 'time' ? `${value}s` : value;
          }
        }
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: '#ffffff',
        hoverBorderWidth: 3
      },
      line: {
        tension: 0.4
      }
    }
  };
};

export const getYAxisLabel = (metric: string): string => {
  switch (metric) {
    case 'technique': return 'Técnica (1-10)';
    case 'resistance': return 'Resistência (1-10)';
    case 'time': return 'Tempo (segundos)';
    default: return 'Pontuação (1-10)';
  }
};

export const getMetricLabel = (metric: string): string => {
  switch (metric) {
    case 'technique': return 'Técnica';
    case 'resistance': return 'Resistência';
    case 'time': return 'Tempo';
    default: return 'Geral';
  }
};

export const processEvolutionData = (
  data: ChartDataPoint[],
  metric: 'technique' | 'resistance' | 'overall' | 'time'
): { values: number[]; labels: string[] } => {
  const values = data.map(point => {
    switch (metric) {
      case 'technique': return point.technique;
      case 'resistance': return point.resistance;
      case 'time': return point.timeSeconds || 0;
      default: return point.overall;
    }
  }).filter(value => value > 0);

  const chartLabels = data
    .filter((_, index) => {
      const value = metric === 'technique' ? data[index].technique :
                   metric === 'resistance' ? data[index].resistance :
                   metric === 'time' ? (data[index].timeSeconds || 0) :
                   data[index].overall;
      return value > 0;
    })
    .map(point => 
      new Date(point.date).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
      })
    );

  return { values, labels: chartLabels };
};

export const calculateTrendLine = (values: number[]): number[] => {
  if (values.length < 2) return values;

  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  // Calculate linear regression
  const sumX = indices.reduce((sum, x) => sum + x, 0);
  const sumY = values.reduce((sum, y) => sum + y, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return indices.map(x => slope * x + intercept);
};

export const generatePredictions = (
  values: number[],
  periods: number = 3
): number[] => {
  if (values.length < 3) return [];

  const trendLine = calculateTrendLine(values);
  const lastTrend = trendLine[trendLine.length - 1];
  const slope = trendLine.length > 1 ? 
    (trendLine[trendLine.length - 1] - trendLine[trendLine.length - 2]) : 0;

  return Array.from({ length: periods }, (_, i) => 
    Math.max(0, Math.min(10, lastTrend + slope * (i + 1)))
  );
};

export const getPerformanceColor = (value: number, metric: string): string => {
  if (metric === 'time') {
    // For time, lower is better - this would need context about what's a good time
    return '#0ea5e9'; // Default blue for time metrics
  }
  
  // For scores (1-10 scale)
  if (value >= 8) return '#10b981'; // Green
  if (value >= 6) return '#f59e0b'; // Yellow
  if (value >= 4) return '#f97316'; // Orange
  return '#ef4444'; // Red
};

export const getPerformanceLabel = (value: number, metric: string): string => {
  if (metric === 'time') {
    return `${value.toFixed(1)}s`;
  }
  
  // For scores (1-10 scale)
  if (value >= 8) return 'Excelente';
  if (value >= 6) return 'Bom';
  if (value >= 4) return 'Regular';
  return 'Precisa melhorar';
};

export const formatTimeRange = (timeRange: string): string => {
  switch (timeRange) {
    case '3months': return 'Últimos 3 meses';
    case '6months': return 'Últimos 6 meses';
    case '1year': return 'Último ano';
    default: return 'Todos os dados';
  }
};

export const filterDataByTimeRange = (
  data: ChartDataPoint[],
  timeRange: string
): ChartDataPoint[] => {
  if (timeRange === 'all') return data;

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
      return data;
  }

  return data.filter(point => new Date(point.date) >= cutoffDate);
};

export const calculateStatistics = (values: number[]) => {
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      latest: 0,
      improvement: 0,
      trend: 'stable' as const
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  const latest = values[values.length - 1];
  
  let improvement = 0;
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  
  if (values.length >= 2) {
    const previous = values[values.length - 2];
    improvement = latest - previous;
    
    if (Math.abs(improvement) > 0.2) {
      trend = improvement > 0 ? 'improving' : 'declining';
    }
  }

  return {
    min,
    max,
    average,
    latest,
    improvement,
    trend
  };
};

export const createDatasetConfig = (
  strokeType: StrokeType,
  values: number[],
  config: Partial<ChartConfig> = {}
) => {
  const color = getStrokeColor(strokeType);
  const fillColor = color + '20'; // Add transparency
  
  return {
    label: getStrokeLabel(strokeType),
    data: values,
    borderColor: color,
    backgroundColor: fillColor,
    fill: config.type === 'area',
    tension: 0.4,
    pointRadius: 6,
    pointHoverRadius: 8,
    pointBackgroundColor: color,
    pointBorderColor: '#ffffff',
    pointBorderWidth: 2,
    borderWidth: 3,
  };
};
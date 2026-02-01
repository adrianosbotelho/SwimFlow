import React from 'react';
import { motion } from 'framer-motion';
import { StrokeType, getStrokeColor, getStrokeLabel } from '../types/evaluation';

export interface TimelineEvent {
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
}

interface TimelineProps {
  events: TimelineEvent[];
  maxEvents?: number;
  showStrokeFilter?: boolean;
  selectedStroke?: StrokeType;
  onStrokeFilter?: (stroke: StrokeType | undefined) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  maxEvents = 10,
  showStrokeFilter = true,
  selectedStroke,
  onStrokeFilter
}) => {
  const filteredEvents = React.useMemo(() => {
    let filtered = selectedStroke 
      ? events.filter(event => event.strokeType === selectedStroke)
      : events;
    
    // Sort by date (most recent first)
    filtered = filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Limit number of events
    return filtered.slice(0, maxEvents);
  }, [events, selectedStroke, maxEvents]);

  const getEventIcon = (type: TimelineEvent['type']): string => {
    switch (type) {
      case 'improvement': return '📈';
      case 'decline': return '📉';
      case 'plateau': return '➡️';
      case 'breakthrough': return '🚀';
      case 'level_change': return '🎯';
      case 'evaluation': return '📊';
      default: return '📌';
    }
  };

  const getEventColor = (type: TimelineEvent['type'], impact?: string): string => {
    switch (type) {
      case 'improvement':
      case 'breakthrough':
        return impact === 'high' ? 'border-green-500 bg-green-50' : 'border-green-400 bg-green-25';
      case 'decline':
        return impact === 'high' ? 'border-red-500 bg-red-50' : 'border-red-400 bg-red-25';
      case 'level_change':
        return 'border-purple-500 bg-purple-50';
      case 'plateau':
        return 'border-yellow-500 bg-yellow-50';
      case 'evaluation':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getEventTextColor = (type: TimelineEvent['type']): string => {
    switch (type) {
      case 'improvement':
      case 'breakthrough':
        return 'text-green-800';
      case 'decline':
        return 'text-red-800';
      case 'level_change':
        return 'text-purple-800';
      case 'plateau':
        return 'text-yellow-800';
      case 'evaluation':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} meses atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (events.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum marco registrado
        </h3>
        <p className="text-gray-600">
          Os marcos importantes aparecerão aqui conforme o aluno progride
        </p>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Linha do Tempo
          </h3>
          <p className="text-sm text-gray-600">
            Marcos importantes na evolução do aluno
          </p>
        </div>
        
        {showStrokeFilter && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onStrokeFilter?.(undefined)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedStroke 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {['crawl', 'costas', 'peito', 'borboleta'].map((stroke) => (
              <button
                key={stroke}
                onClick={() => onStrokeFilter?.(stroke as StrokeType)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedStroke === stroke
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedStroke === stroke 
                    ? getStrokeColor(stroke as StrokeType)
                    : undefined
                }}
              >
                {getStrokeLabel(stroke as StrokeType)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {/* Events */}
        <div className="space-y-6">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start space-x-4"
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 bg-white shadow-sm"
                   style={{ 
                     borderColor: event.strokeType ? getStrokeColor(event.strokeType) : '#6b7280',
                     backgroundColor: event.strokeType ? getStrokeColor(event.strokeType) + '20' : '#f9fafb'
                   }}>
                <span className="text-lg">
                  {getEventIcon(event.type)}
                </span>
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0">
                <div className={`rounded-lg border-l-4 p-4 ${getEventColor(event.type, event.impact)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`font-medium ${getEventTextColor(event.type)}`}>
                          {event.title}
                        </h4>
                        {event.strokeType && (
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getStrokeColor(event.strokeType) }}
                          >
                            {getStrokeLabel(event.strokeType)}
                          </span>
                        )}
                        {event.impact && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            event.impact === 'high' ? 'bg-red-100 text-red-800' :
                            event.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {event.impact === 'high' ? 'Alto impacto' :
                             event.impact === 'medium' ? 'Médio impacto' :
                             'Baixo impacto'}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {event.description}
                      </p>
                      
                      {/* Value changes */}
                      {event.value !== undefined && (
                        <div className="flex items-center space-x-2 text-sm">
                          {event.previousValue !== undefined && (
                            <>
                              <span className="text-gray-500">
                                {event.previousValue.toFixed(1)}
                              </span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </>
                          )}
                          <span className={`font-medium ${
                            event.previousValue !== undefined
                              ? event.value > event.previousValue ? 'text-green-600' : 'text-red-600'
                              : 'text-gray-900'
                          }`}>
                            {event.value.toFixed(1)}
                          </span>
                          {event.previousValue !== undefined && (
                            <span className={`text-xs ${
                              event.value > event.previousValue ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ({event.value > event.previousValue ? '+' : ''}{(event.value - event.previousValue).toFixed(1)})
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Level change info */}
                      {event.metadata?.fromLevel && event.metadata?.toLevel && (
                        <div className="flex items-center space-x-2 text-sm mt-2">
                          <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                            {event.metadata.fromLevel}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                            {event.metadata.toLevel}
                          </span>
                        </div>
                      )}
                      
                      {/* Professor info */}
                      {event.metadata?.professorName && (
                        <div className="text-xs text-gray-500 mt-2">
                          Avaliado por {event.metadata.professorName}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                      {formatDate(event.date)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Show more indicator */}
        {events.length > maxEvents && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-6"
          >
            <div className="text-sm text-gray-500">
              Mostrando {filteredEvents.length} de {events.length} marcos
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
import React from 'react'
import { Level } from './LevelBadge'
import LevelBadge from './LevelBadge'

interface LevelHistoryEntry {
  id: string
  fromLevel: Level | null
  toLevel: Level
  changedAt: string
  reason?: string | null
  changedBy?: string | null
}

interface LevelHistoryProps {
  history: LevelHistoryEntry[]
  className?: string
}

export const LevelHistory: React.FC<LevelHistoryProps> = ({ 
  history, 
  className = '' 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (history.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>Nenhum histórico de níveis disponível</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Histórico de Níveis
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {history.map((entry, index) => (
          <div key={entry.id} className="relative flex items-start space-x-4 pb-6">
            {/* Timeline dot */}
            <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-white border-2 border-ocean-300 rounded-full">
              <svg className="w-6 h-6 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {entry.fromLevel ? (
                      <>
                        <LevelBadge level={entry.fromLevel} size="sm" />
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <LevelBadge level={entry.toLevel} size="sm" />
                      </>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Nível inicial:</span>
                        <LevelBadge level={entry.toLevel} size="sm" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(entry.changedAt)}
                  </span>
                </div>
                
                {entry.reason && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Motivo:</span> {entry.reason}
                  </p>
                )}
                
                {index === 0 && (
                  <div className="mt-2 flex items-center text-xs text-teal-600">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Nível atual
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LevelHistory
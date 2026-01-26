import React from 'react';
import { EvolutionData, getStrokeColor, getStrokeLabel } from '../types/evaluation';

interface EvaluationChartProps {
  evolutionData: EvolutionData[];
  selectedStroke?: string;
}

export const EvaluationChart: React.FC<EvaluationChartProps> = ({
  evolutionData,
  selectedStroke
}) => {
  if (!evolutionData || evolutionData.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-600">Nenhum dado de evolução disponível</p>
      </div>
    );
  }

  const filteredData = selectedStroke 
    ? evolutionData.filter(data => data.strokeType === selectedStroke)
    : evolutionData;

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    if (score >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {filteredData.map((strokeData) => (
        <div key={strokeData.strokeType} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getStrokeColor(strokeData.strokeType) }}
            />
            <h3 className="text-lg font-semibold text-gray-900">
              {getStrokeLabel(strokeData.strokeType)}
            </h3>
            <span className="text-sm text-gray-500">
              ({strokeData.evaluations.length} avaliações)
            </span>
          </div>

          {strokeData.evaluations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhuma avaliação registrada para este nado
            </p>
          ) : (
            <div className="space-y-4">
              {/* Simple Timeline Chart */}
              <div className="relative">
                <div className="flex items-end space-x-2 h-32 mb-4">
                  {strokeData.evaluations.slice(-10).map((evaluation, index) => {
                    const avgScore = (evaluation.technique + evaluation.resistance) / 2;
                    const height = (avgScore / 10) * 100;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className={`w-full rounded-t ${getScoreColor(avgScore)} transition-all duration-300 hover:opacity-80`}
                          style={{ height: `${height}%` }}
                          title={`${new Date(evaluation.date).toLocaleDateString('pt-BR')}: ${avgScore.toFixed(1)}/10`}
                        />
                        <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                          {new Date(evaluation.date).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit' 
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-32 flex flex-col justify-between text-xs text-gray-400">
                  <span>10</span>
                  <span>5</span>
                  <span>0</span>
                </div>
              </div>

              {/* Latest Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {strokeData.evaluations.slice(-3).reverse().map((evaluation, index) => {
                  const avgScore = (evaluation.technique + evaluation.resistance) / 2;
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">
                        {new Date(evaluation.date).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Técnica:</span>
                          <span className={`font-medium ${getScoreTextColor(evaluation.technique)}`}>
                            {evaluation.technique}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Resistência:</span>
                          <span className={`font-medium ${getScoreTextColor(evaluation.resistance)}`}>
                            {evaluation.resistance}/10
                          </span>
                        </div>
                        {evaluation.timeSeconds && (
                          <div className="flex justify-between">
                            <span className="text-sm">Tempo:</span>
                            <span className="font-medium text-blue-600">
                              {evaluation.timeSeconds}s
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Média:</span>
                            <span className={`font-bold ${getScoreTextColor(avgScore)}`}>
                              {avgScore.toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Indicator */}
              {strokeData.evaluations.length >= 2 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Progresso</h4>
                  {(() => {
                    const latest = strokeData.evaluations[strokeData.evaluations.length - 1];
                    const previous = strokeData.evaluations[strokeData.evaluations.length - 2];
                    const latestAvg = (latest.technique + latest.resistance) / 2;
                    const previousAvg = (previous.technique + previous.resistance) / 2;
                    const diff = latestAvg - previousAvg;
                    
                    return (
                      <div className="flex items-center space-x-2">
                        {diff > 0 ? (
                          <>
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span className="text-green-600 font-medium">
                              +{diff.toFixed(1)} pontos
                            </span>
                            <span className="text-sm text-gray-600">desde a última avaliação</span>
                          </>
                        ) : diff < 0 ? (
                          <>
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                            <span className="text-red-600 font-medium">
                              {diff.toFixed(1)} pontos
                            </span>
                            <span className="text-sm text-gray-600">desde a última avaliação</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                            <span className="text-gray-600 font-medium">
                              Sem mudança
                            </span>
                            <span className="text-sm text-gray-600">desde a última avaliação</span>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
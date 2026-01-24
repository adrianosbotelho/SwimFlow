import React from 'react';
import { StrokeEvaluation, getStrokeLabel, getStrokeColor } from '../types/evaluation';

interface StrokeEvaluationCardProps {
  strokeEvaluation: StrokeEvaluation;
  compact?: boolean;
}

const StrokeEvaluationCard: React.FC<StrokeEvaluationCardProps> = ({
  strokeEvaluation,
  compact = false
}) => {
  const strokeLabel = getStrokeLabel(strokeEvaluation.strokeType);
  const strokeColor = getStrokeColor(strokeEvaluation.strokeType);

  const formatTime = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 
      ? `${minutes}:${remainingSeconds.toFixed(2).padStart(5, '0')}`
      : `${remainingSeconds.toFixed(2)}s`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    if (score >= 4) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-3">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: strokeColor }}
          />
          <span className="font-medium text-gray-900">{strokeLabel}</span>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-center">
            <div className="text-gray-500">Técnica</div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(strokeEvaluation.technique)}`}>
              {strokeEvaluation.technique}/10
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Resistência</div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(strokeEvaluation.resistance)}`}>
              {strokeEvaluation.resistance}/10
            </div>
          </div>
          {strokeEvaluation.timeSeconds && (
            <div className="text-center">
              <div className="text-gray-500">Tempo</div>
              <div className="font-medium text-gray-900">
                {formatTime(strokeEvaluation.timeSeconds)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: strokeColor }}
          />
          <h3 className="text-lg font-semibold text-gray-900">{strokeLabel}</h3>
        </div>
      </div>

      {/* Scores Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Técnica</div>
          <div className={`text-2xl font-bold px-3 py-1 rounded-full ${getScoreColor(strokeEvaluation.technique)}`}>
            {strokeEvaluation.technique}/10
          </div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Resistência</div>
          <div className={`text-2xl font-bold px-3 py-1 rounded-full ${getScoreColor(strokeEvaluation.resistance)}`}>
            {strokeEvaluation.resistance}/10
          </div>
        </div>
      </div>

      {/* Time */}
      {strokeEvaluation.timeSeconds && (
        <div className="text-center p-4 bg-blue-50 rounded-lg mb-4">
          <div className="text-sm text-blue-600 mb-1">Tempo Registrado</div>
          <div className="text-xl font-bold text-blue-800">
            {formatTime(strokeEvaluation.timeSeconds)}
          </div>
        </div>
      )}

      {/* Notes */}
      {strokeEvaluation.notes && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Observações</div>
          <p className="text-gray-700 text-sm">{strokeEvaluation.notes}</p>
        </div>
      )}
    </div>
  );
};

export default StrokeEvaluationCard;
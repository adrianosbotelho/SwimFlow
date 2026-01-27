import React, { useState, useEffect } from 'react';
import { Evaluation, EVALUATION_TYPES, LEVELS } from '../types/evaluation';
import StrokeEvaluationCard from './StrokeEvaluationCard';
import evaluationService from '../services/evaluationService';

interface EvaluationHistoryProps {
  studentId: string;
  startDate?: string;
  endDate?: string;
  onEditEvaluation?: (evaluation: Evaluation) => void;
  onDeleteEvaluation?: (evaluationId: string) => void;
}

const EvaluationHistory: React.FC<EvaluationHistoryProps> = ({
  studentId,
  startDate,
  endDate,
  onEditEvaluation,
  onDeleteEvaluation
}) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvaluation, setExpandedEvaluation] = useState<string | null>(null);

  useEffect(() => {
    loadEvaluations();
  }, [studentId, startDate, endDate]);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await evaluationService.listEvaluations(studentId, undefined, startDate, endDate);
      setEvaluations(data);
    } catch (err) {
      setError('Erro ao carregar histórico de avaliações');
      console.error('Error loading evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateLong = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getAverageScore = (evaluation: Evaluation): number => {
    if (evaluation.strokeEvaluations.length === 0) return 0;
    const total = evaluation.strokeEvaluations.reduce((sum, stroke) => 
      sum + stroke.technique + stroke.resistance, 0
    );
    return Math.round((total / (evaluation.strokeEvaluations.length * 2)) * 10) / 10;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getApprovalBadge = (evaluation: Evaluation) => {
    if (evaluation.evaluationType !== 'LEVEL_PROGRESSION') return null;
    
    if (evaluation.isApproved === true) {
      return (
        <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Aprovado
        </div>
      );
    } else if (evaluation.isApproved === false) {
      return (
        <div className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Reprovado
        </div>
      );
    } else {
      return (
        <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Pendente
        </div>
      );
    }
  };

  const getEvaluationTypeBadge = (evaluation: Evaluation) => {
    const evaluationType = EVALUATION_TYPES.find(t => t.value === evaluation.evaluationType);
    if (!evaluationType) return null;

    const isProgression = evaluation.evaluationType === 'LEVEL_PROGRESSION';
    const badgeColor = isProgression ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800';

    return (
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${badgeColor}`}>
        {evaluationType.label}
        {isProgression && evaluation.targetLevel && (
          <span className="ml-1">
            → {LEVELS.find(l => l.value === evaluation.targetLevel)?.label}
          </span>
        )}
      </div>
    );
  };

  const toggleExpanded = (evaluationId: string) => {
    setExpandedEvaluation(prev => prev === evaluationId ? null : evaluationId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando histórico...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadEvaluations}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma avaliação encontrada</h3>
        <p className="text-gray-600">Este aluno ainda não possui avaliações registradas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Histórico de Avaliações ({evaluations.length})
        </h2>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-8">
          {evaluations.map((evaluation) => {
            const isExpanded = expandedEvaluation === evaluation.id;
            const averageScore = getAverageScore(evaluation);

            return (
              <div key={evaluation.id} className="relative">
                {/* Timeline dot */}
                <div className="absolute left-6 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-md"></div>

                {/* Evaluation card */}
                <div className="ml-16 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => toggleExpanded(evaluation.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {formatDateLong(evaluation.date)}
                          </h3>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(averageScore)}`}>
                            Média: {averageScore}/10
                          </div>
                          {getEvaluationTypeBadge(evaluation)}
                          {getApprovalBadge(evaluation)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Professor: {evaluation.professor.name}</span>
                          <span>•</span>
                          <span>{evaluation.strokeEvaluations.length} nados avaliados</span>
                        </div>
                        {evaluation.generalNotes && (
                          <p className="mt-2 text-gray-700 text-sm line-clamp-2">
                            {evaluation.generalNotes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {onEditEvaluation && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditEvaluation(evaluation);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar avaliação"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        
                        {onDeleteEvaluation && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm('Tem certeza que deseja excluir esta avaliação?')) {
                                try {
                                  await evaluationService.deleteEvaluation(evaluation.id);
                                  // Remove from local state immediately
                                  setEvaluations(prev => prev.filter(evalItem => evalItem.id !== evaluation.id));
                                  // Call parent callback if provided
                                  onDeleteEvaluation(evaluation.id);
                                } catch (error) {
                                  console.error('Error deleting evaluation:', error);
                                  alert('Erro ao excluir avaliação. Tente novamente.');
                                }
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Excluir avaliação"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <svg 
                            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      <div className="pt-4 space-y-4">
                        {evaluation.strokeEvaluations.map((strokeEval) => (
                          <StrokeEvaluationCard
                            key={`${evaluation.id}-${strokeEval.strokeType}`}
                            strokeEvaluation={strokeEval}
                            compact={true}
                          />
                        ))}
                        
                        {evaluation.generalNotes && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Observações Gerais</h4>
                            <p className="text-gray-700 text-sm">{evaluation.generalNotes}</p>
                          </div>
                        )}

                        {evaluation.evaluationType === 'LEVEL_PROGRESSION' && evaluation.approvalNotes && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-700 mb-2">Observações da Aprovação</h4>
                            <p className="text-blue-700 text-sm">{evaluation.approvalNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EvaluationHistory;
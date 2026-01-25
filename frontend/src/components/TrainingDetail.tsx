import React, { useState, useEffect } from 'react';
import { Training } from '../types/training';
import { LevelBadge } from './LevelBadge';
import trainingService from '../services/trainingService';

interface TrainingDetailProps {
  trainingId: string;
  onClose: () => void;
  onEdit?: (training: Training) => void;
}

export const TrainingDetail: React.FC<TrainingDetailProps> = ({
  trainingId,
  onClose,
  onEdit
}) => {
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTraining = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await trainingService.getTraining(trainingId);
        setTraining(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar treino');
      } finally {
        setLoading(false);
      }
    };

    loadTraining();
  }, [trainingId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-500"></div>
          <span className="ml-2 text-gray-600">Carregando treino...</span>
        </div>
      </div>
    );
  }

  if (error || !training) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Erro</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">{error || 'Treino não encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Detalhes do Treino</h2>
          <p className="text-gray-600">{formatDate(training.date)}</p>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(training)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Training Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações Básicas</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Turma:</span>
              <p className="text-gray-900">{training.class.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Piscina:</span>
              <p className="text-gray-900">{training.class.pool.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Data:</span>
              <p className="text-gray-900">{formatDate(training.date)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Duração:</span>
              <p className="text-gray-900">{formatDuration(training.duration)}</p>
            </div>
          </div>
        </div>

        {/* Participants Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Participantes</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Total:</span>
              <p className="text-gray-900">{training.participants.length} aluno(s)</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Por nível:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {['iniciante', 'intermediario', 'avancado'].map(level => {
                  const count = training.participants.filter(p => p.student.level === level).length;
                  if (count > 0) {
                    return (
                      <span key={level} className="text-xs bg-ocean-100 text-ocean-800 px-2 py-1 rounded-full">
                        {count} {level === 'iniciante' ? 'Ini' : level === 'intermediario' ? 'Int' : 'Ava'}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activities */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Atividades</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
            {training.activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-ocean-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <p className="text-gray-900">{activity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lista de Participantes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {training.participants.map((participant) => (
            <div
              key={participant.student.id}
              className="bg-gray-50 rounded-lg p-4 flex items-center gap-3"
            >
              {participant.student.profileImage ? (
                <img
                  src={participant.student.profileImage}
                  alt={participant.student.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-ocean-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-ocean-700">
                    {participant.student.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {participant.student.name}
                </p>
                <LevelBadge level={participant.student.level} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {training.notes && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Observações</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 whitespace-pre-wrap">{training.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};
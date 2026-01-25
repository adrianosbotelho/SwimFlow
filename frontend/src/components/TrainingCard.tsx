import React from 'react';
import { Training } from '../types/training';
import { LevelBadge } from './LevelBadge';

interface TrainingCardProps {
  training: Training;
  onEdit?: (training: Training) => void;
  onDelete?: (trainingId: string) => void;
  onViewDetails?: (trainingId: string) => void;
  compact?: boolean;
}

export const TrainingCard: React.FC<TrainingCardProps> = ({
  training,
  onEdit,
  onDelete,
  onViewDetails,
  compact = false
}) => {
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

  const getParticipantCount = () => {
    return training.participants.length;
  };

  const getLevelCounts = () => {
    const counts = {
      iniciante: 0,
      intermediario: 0,
      avancado: 0
    };

    training.participants.forEach(participant => {
      counts[participant.student.level]++;
    });

    return counts;
  };

  const levelCounts = getLevelCounts();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              {training.class.name}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {training.class.pool.name}
          </p>
        </div>
        
        {(onEdit || onDelete || onViewDetails) && (
          <div className="flex gap-2">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(training.id)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Ver detalhes"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(training)}
                className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
                title="Editar treino"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(training.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Excluir treino"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Training Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0h6m-6 0V7a1 1 0 00-1 1v11a2 2 0 002 2h6a2 2 0 002-2V8a1 1 0 00-1-1V7" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {formatDate(training.date)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {formatDuration(training.duration)}
          </span>
        </div>
      </div>

      {/* Participants */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Participantes ({getParticipantCount()})
          </span>
          <div className="flex gap-1">
            {levelCounts.iniciante > 0 && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                {levelCounts.iniciante} Ini
              </span>
            )}
            {levelCounts.intermediario > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {levelCounts.intermediario} Int
              </span>
            )}
            {levelCounts.avancado > 0 && (
              <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                {levelCounts.avancado} Ava
              </span>
            )}
          </div>
        </div>

        {!compact && (
          <div className="flex flex-wrap gap-2">
            {training.participants.slice(0, 6).map((participant) => (
              <div
                key={participant.student.id}
                className="flex items-center gap-2 bg-white bg-opacity-60 rounded-lg px-2 py-1"
              >
                {participant.student.profileImage ? (
                  <img
                    src={participant.student.profileImage}
                    alt={participant.student.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-700">
                      {participant.student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-700">
                  {participant.student.name.split(' ')[0]}
                </span>
                <LevelBadge level={participant.student.level} size="xs" />
              </div>
            ))}
            {training.participants.length > 6 && (
              <div className="flex items-center justify-center bg-gray-100 rounded-lg px-2 py-1">
                <span className="text-xs text-gray-600">
                  +{training.participants.length - 6} mais
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activities */}
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-700 block mb-2">
          Atividades
        </span>
        <div className="flex flex-wrap gap-1">
          {training.activities.slice(0, compact ? 2 : 4).map((activity, index) => (
            <span
              key={index}
              className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full"
            >
              {activity}
            </span>
          ))}
          {training.activities.length > (compact ? 2 : 4) && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              +{training.activities.length - (compact ? 2 : 4)} mais
            </span>
          )}
        </div>
      </div>

      {/* Notes */}
      {training.notes && !compact && (
        <div className="border-t border-blue-200 pt-3">
          <span className="text-sm font-medium text-gray-700 block mb-1">
            Observações
          </span>
          <p className="text-sm text-gray-600 line-clamp-2">
            {training.notes}
          </p>
        </div>
      )}
    </div>
  );
};
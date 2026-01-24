import React, { useState, useEffect } from 'react';
import { Training, TrainingFilters } from '../types/training';
import { TrainingCard } from './TrainingCard';
import trainingService from '../services/trainingService';

interface TrainingListProps {
  filters?: TrainingFilters;
  onEdit?: (training: Training) => void;
  onDelete?: (trainingId: string) => void;
  onViewDetails?: (trainingId: string) => void;
  compact?: boolean;
  showFilters?: boolean;
}

export const TrainingList: React.FC<TrainingListProps> = ({
  filters: initialFilters,
  onEdit,
  onDelete,
  onViewDetails,
  compact = false,
  showFilters = true
}) => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TrainingFilters>(initialFilters || {});
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadTrainings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await trainingService.listTrainings(filters);
      
      // Sort trainings chronologically
      const sortedTrainings = data.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
      
      setTrainings(sortedTrainings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar treinos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
  }, [filters, sortOrder]);

  const handleFilterChange = (newFilters: Partial<TrainingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleDelete = async (trainingId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este treino?')) {
      try {
        await trainingService.deleteTraining(trainingId);
        await loadTrainings(); // Reload the list
        if (onDelete) {
          onDelete(trainingId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir treino');
      }
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const today = new Date();
  const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-500"></div>
        <span className="ml-2 text-gray-600">Carregando treinos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
            <button
              onClick={handleClearFilters}
              className="text-sm text-ocean-600 hover:text-ocean-700 font-medium"
            >
              Limpar filtros
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data inicial
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange({ startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data final
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange({ endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenação
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              >
                <option value="desc">Mais recentes primeiro</option>
                <option value="asc">Mais antigos primeiro</option>
              </select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => handleFilterChange({ 
                startDate: formatDateForInput(today),
                endDate: formatDateForInput(today)
              })}
              className="px-3 py-1 text-sm bg-ocean-100 text-ocean-700 rounded-full hover:bg-ocean-200 transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => handleFilterChange({ 
                startDate: formatDateForInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)),
                endDate: formatDateForInput(today)
              })}
              className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors"
            >
              Última semana
            </button>
            <button
              onClick={() => handleFilterChange({ 
                startDate: formatDateForInput(oneMonthAgo),
                endDate: formatDateForInput(today)
              })}
              className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition-colors"
            >
              Último mês
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Treinos ({trainings.length})
        </h2>
        <button
          onClick={loadTrainings}
          className="flex items-center gap-2 px-3 py-2 text-sm text-ocean-600 hover:text-ocean-700 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar
        </button>
      </div>

      {/* Training Cards */}
      {trainings.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Nenhum treino encontrado
          </h3>
          <p className="text-gray-500">
            {Object.keys(filters).length > 0 
              ? 'Tente ajustar os filtros para encontrar treinos.'
              : 'Ainda não há treinos cadastrados.'
            }
          </p>
        </div>
      ) : (
        <div className={`grid gap-6 ${compact ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {trainings.map((training) => (
            <TrainingCard
              key={training.id}
              training={training}
              onEdit={onEdit}
              onDelete={handleDelete}
              onViewDetails={onViewDetails}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
};
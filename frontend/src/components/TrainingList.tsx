import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Training, TrainingFilters } from '../types/training';
import { TrainingCard } from './TrainingCard';
import trainingService from '../services/trainingService';

type ViewMode = 'cards' | 'list'

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

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
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // List view component
  const TrainingListView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Treino</div>
          <div className="col-span-2">Turma</div>
          <div className="col-span-2">Data/Hora</div>
          <div className="col-span-2">Participantes</div>
          <div className="col-span-1">Duração</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {trainings.map((training, index) => (
          <motion.div
            key={training.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Training Info */}
              <div className="col-span-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white text-sm font-semibold">
                    💪
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Treino - {formatDate(training.date)}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {training.notes || 'Sem observações'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Class */}
              <div className="col-span-2">
                <span className="text-sm text-gray-900">
                  {training.class?.name || 'Não definida'}
                </span>
              </div>

              {/* Date/Time */}
              <div className="col-span-2">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(training.date)}
                  </span>
                  <br />
                  <span className="text-xs text-gray-500">
                    {training.duration}min de duração
                  </span>
                </div>
              </div>

              {/* Participants */}
              <div className="col-span-2">
                <span className="text-sm text-gray-900">
                  {training.participants?.length || 0} aluno(s)
                </span>
              </div>

              {/* Duration */}
              <div className="col-span-1">
                <span className="text-sm text-gray-500">
                  {training.duration || '-'}min
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-2 text-right">
                <div className="flex items-center justify-end space-x-2">
                  {onViewDetails && (
                    <button
                      onClick={() => onViewDetails(training.id)}
                      className="p-1 text-gray-400 hover:text-ocean-600 transition-colors"
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
                      className="p-1 text-gray-400 hover:text-teal-600 transition-colors"
                      title="Editar treino"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(training.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Excluir treino"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

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
        <div className="flex items-center space-x-4">
          <button
            onClick={loadTrainings}
            className="flex items-center gap-2 px-3 py-2 text-sm text-ocean-600 hover:text-ocean-700 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-ocean-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Visualização em cards"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-ocean-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Visualização em lista"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Training Display */}
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
        <>
          {viewMode === 'cards' ? (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className={`grid gap-6 ${compact ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}
            >
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
            </motion.div>
          ) : (
            <TrainingListView />
          )}
        </>
      )}
    </div>
  );
};
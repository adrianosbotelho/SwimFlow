import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PoolCard } from '../components/PoolCard';
import { PoolForm } from '../components/PoolForm';
import type { Pool, CreatePoolData, UpdatePoolData } from '../types/pool';

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

export const PoolsPage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPool, setEditingPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/pools');
      if (response.ok) {
        const data = await response.json();
        setPools(data.success ? data.data.pools : []);
      } else {
        throw new Error('Erro ao carregar piscinas');
      }
    } catch (error) {
      console.error('Error loading pools:', error);
      setError('Erro ao carregar piscinas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePool = async (data: CreatePoolData) => {
    try {
      setFormLoading(true);
      const response = await fetch('/api/pools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadPools(); // Reload data
          setShowForm(false);
          setEditingPool(null);
        } else {
          throw new Error(result.error || 'Erro ao criar piscina');
        }
      } else {
        throw new Error('Erro ao criar piscina');
      }
    } catch (error) {
      console.error('Error creating pool:', error);
      alert(error instanceof Error ? error.message : 'Erro ao criar piscina');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdatePool = async (data: UpdatePoolData) => {
    if (!editingPool) return;

    try {
      setFormLoading(true);
      const response = await fetch(`/api/pools/${editingPool.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadPools(); // Reload data
          setShowForm(false);
          setEditingPool(null);
        } else {
          throw new Error(result.error || 'Erro ao atualizar piscina');
        }
      } else {
        throw new Error('Erro ao atualizar piscina');
      }
    } catch (error) {
      console.error('Error updating pool:', error);
      alert(error instanceof Error ? error.message : 'Erro ao atualizar piscina');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (pool: Pool) => {
    try {
      const response = await fetch(`/api/pools/${pool.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPools(); // Reload data
      } else {
        const result = await response.json();
        alert(result.error || 'Erro ao excluir piscina');
      }
    } catch (error) {
      console.error('Error deleting pool:', error);
      alert('Erro ao excluir piscina');
    }
  };

  const handleSubmit = async (data: CreatePoolData | UpdatePoolData) => {
    if (editingPool) {
      await handleUpdatePool(data as UpdatePoolData);
    } else {
      await handleCreatePool(data as CreatePoolData);
    }
  };

  const handleEdit = (pool: Pool) => {
    setEditingPool(pool);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPool(null);
  };

  // Filter pools based on search term
  const filteredPools = pools.filter(pool => 
    pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pool.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // List view component
  const PoolListView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Piscina</div>
          <div className="col-span-2">Capacidade</div>
          <div className="col-span-2">Comprimento</div>
          <div className="col-span-2">Temperatura</div>
          <div className="col-span-1">Raias</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {filteredPools.map((pool, index) => (
          <motion.div
            key={pool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Pool Info */}
              <div className="col-span-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-semibold">
                    🏊‍♂️
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {pool.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {pool.description || 'Descrição não informada'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div className="col-span-2">
                <span className="text-sm text-gray-900">
                  {pool.capacity} pessoas
                </span>
              </div>

              {/* Dimensions */}
              <div className="col-span-2">
                <span className="text-sm text-gray-900">
                  {pool.length ? `${pool.length}m` : '-'}
                </span>
              </div>

              {/* Temperature */}
              <div className="col-span-2">
                <span className="text-sm text-gray-900">
                  {pool.temperature ? `${pool.temperature}°C` : '-'}
                </span>
              </div>

              {/* Lanes */}
              <div className="col-span-1">
                <span className="text-sm text-gray-900">
                  {pool.lanes || '-'}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-2 text-right">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => console.log('View pool:', pool.id)}
                    className="p-1 text-gray-400 hover:text-ocean-600 transition-colors"
                    title="Ver detalhes"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(pool)}
                    className="p-1 text-gray-400 hover:text-teal-600 transition-colors"
                    title="Editar piscina"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(pool)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Excluir piscina"
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
          <span className="ml-2 text-gray-600">Carregando piscinas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">❌ {error}</div>
          <button
            onClick={loadPools}
            className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-800">Piscinas</h1>
          <p className="text-gray-600 mt-1">Gerencie as piscinas disponíveis</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nova Piscina</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-gray-900 bg-white"
          />
        </div>
        
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

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancel();
              }
            }}
          >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <PoolForm
                pool={editingPool || undefined}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={formLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pools Display */}
      {filteredPools.length > 0 ? (
        <>
          {viewMode === 'cards' ? (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPools.map((pool) => (
                <PoolCard
                  key={pool.id}
                  pool={pool}
                  onEdit={() => handleEdit(pool)}
                  onDelete={() => handleDelete(pool)}
                  onViewDetails={() => {
                    // TODO: Implement view details
                    console.log('View details for pool:', pool.id);
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <PoolListView />
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🏊‍♀️</div>
          <h3 className="text-lg font-medium mb-2">
            {searchTerm ? 'Nenhuma piscina encontrada' : 'Nenhuma piscina cadastrada'}
          </h3>
          <p className="mb-4">
            {searchTerm ? 'Tente ajustar os termos de busca' : 'Comece criando sua primeira piscina'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors"
            >
              Criar Primeira Piscina
            </button>
          )}
        </div>
      )}
    </div>
  );
};
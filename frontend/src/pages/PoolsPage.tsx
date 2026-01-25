import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PoolCard } from '../components/PoolCard';
import { PoolForm } from '../components/PoolForm';
import type { Pool, CreatePoolData, UpdatePoolData } from '../types/pool';

export const PoolsPage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPool, setEditingPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <h1 className="text-3xl font-bold text-ocean-800">Piscinas</h1>
          <p className="text-gray-600 mt-1">Gerencie as piscinas disponíveis</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-ocean-600 hover:bg-ocean-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nova Piscina</span>
        </button>
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
                pool={editingPool}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={formLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pools Grid */}
      {pools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pools.map((pool) => (
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
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🏊‍♀️</div>
          <h3 className="text-lg font-medium mb-2">Nenhuma piscina encontrada</h3>
          <p className="mb-4">Comece criando sua primeira piscina</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors"
          >
            Criar Primeira Piscina
          </button>
        </div>
      )}
    </div>
  );
};
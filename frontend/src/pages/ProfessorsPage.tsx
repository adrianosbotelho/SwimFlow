import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfessorCard } from '../components/ProfessorCard';
import { ProfessorForm } from '../components/ProfessorForm';
import { professorService } from '../services/professorService';
import type { Professor, CreateProfessorData, UpdateProfessorData } from '../types/professor';

export const ProfessorsPage: React.FC = () => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'professor'>('all');

  useEffect(() => {
    loadProfessors();
  }, []);

  const loadProfessors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await professorService.getAll();
      setProfessors(data);
    } catch (error) {
      console.error('Error loading professors:', error);
      setError('Erro ao carregar professores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfessor = async (data: CreateProfessorData) => {
    try {
      setFormLoading(true);
      await professorService.create(data);
      await loadProfessors();
      setShowForm(false);
      setEditingProfessor(null);
    } catch (error) {
      console.error('Error creating professor:', error);
      alert(error instanceof Error ? error.message : 'Erro ao criar professor');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProfessor = async (data: UpdateProfessorData) => {
    if (!editingProfessor) return;

    try {
      setFormLoading(true);
      await professorService.update(editingProfessor.id, data);
      await loadProfessors();
      setShowForm(false);
      setEditingProfessor(null);
    } catch (error) {
      console.error('Error updating professor:', error);
      alert(error instanceof Error ? error.message : 'Erro ao atualizar professor');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (professor: Professor) => {
    if (!confirm(`Tem certeza que deseja excluir o professor ${professor.name}?`)) {
      return;
    }

    try {
      await professorService.delete(professor.id);
      await loadProfessors();
    } catch (error) {
      console.error('Error deleting professor:', error);
      alert(error instanceof Error ? error.message : 'Erro ao excluir professor');
    }
  };

  const handleSubmit = async (data: CreateProfessorData | UpdateProfessorData) => {
    if (editingProfessor) {
      await handleUpdateProfessor(data as UpdateProfessorData);
    } else {
      await handleCreateProfessor(data as CreateProfessorData);
    }
  };

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProfessor(null);
  };

  // Filter professors based on search term and role
  const filteredProfessors = professors.filter(professor => {
    const matchesSearch = professor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         professor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || professor.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
          <span className="ml-2 text-gray-600">Carregando professores...</span>
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
            onClick={loadProfessors}
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
          <h1 className="text-3xl font-bold text-ocean-800">Professores</h1>
          <p className="text-gray-600 mt-1">Gerencie professores e administradores</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-ocean-600 hover:bg-ocean-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Novo Professor</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'professor')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
        >
          <option value="all">Todas as funções</option>
          <option value="professor">Professores</option>
          <option value="admin">Administradores</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{professors.length}</p>
            </div>
            <div className="text-2xl">👥</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Professores</p>
              <p className="text-2xl font-bold text-blue-600">
                {professors.filter(p => p.role === 'professor').length}
              </p>
            </div>
            <div className="text-2xl">🏊‍♂️</div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-red-600">
                {professors.filter(p => p.role === 'admin').length}
              </p>
            </div>
            <div className="text-2xl">⚙️</div>
          </div>
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
              <ProfessorForm
                professor={editingProfessor || undefined}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={formLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professors Grid */}
      {filteredProfessors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessors.map((professor) => (
            <ProfessorCard
              key={professor.id}
              professor={professor}
              onEdit={() => handleEdit(professor)}
              onDelete={() => handleDelete(professor)}
              onViewDetails={() => {
                // TODO: Implement view details
                console.log('View details for professor:', professor.id);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">👨‍🏫</div>
          <h3 className="text-lg font-medium mb-2">
            {searchTerm || roleFilter !== 'all' 
              ? 'Nenhum professor encontrado' 
              : 'Nenhum professor cadastrado'
            }
          </h3>
          <p className="mb-4">
            {searchTerm || roleFilter !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro professor'
            }
          </p>
          {!searchTerm && roleFilter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors"
            >
              Criar Primeiro Professor
            </button>
          )}
        </div>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfessorCard } from '../components/ProfessorCard';
import { ProfessorForm } from '../components/ProfessorForm';
import { professorService } from '../services/professorService';
import type { Professor, CreateProfessorData, UpdateProfessorData } from '../types/professor';

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

export const ProfessorsPage: React.FC = () => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'professor'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

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

  const getProfileImageUrl = (profileImage: string | null): string | undefined => {
    if (!profileImage) return undefined
    if (profileImage.startsWith('http')) return profileImage
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    return `${baseUrl}${profileImage}`
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Administrador', color: 'bg-red-100 text-red-800' },
      professor: { label: 'Professor', color: 'bg-blue-100 text-blue-800' }
    }
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  // List view component
  const ProfessorListView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">Professor</div>
          <div className="col-span-2">Função</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {filteredProfessors.map((professor, index) => (
          <motion.div
            key={professor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Professor Info */}
              <div className="col-span-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex-shrink-0">
                    {professor.profileImage ? (
                      <img
                        src={getProfileImageUrl(professor.profileImage)}
                        alt={professor.name}
                        className="w-full h-full rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div 
                      className={`${professor.profileImage ? 'hidden' : ''} w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white text-sm font-semibold`}
                    >
                      {professor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {professor.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      Professor
                    </p>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="col-span-2">
                {getRoleBadge(professor.role)}
              </div>

              {/* Email */}
              <div className="col-span-4">
                <span className="text-sm text-gray-900 truncate">
                  {professor.email}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-2 text-right">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => console.log('View professor:', professor.id)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Ver detalhes"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(professor)}
                    className="p-1 text-gray-400 hover:text-teal-600 transition-colors"
                    title="Editar professor"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(professor)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Excluir professor"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <h1 className="text-3xl font-bold text-blue-800">Professores</h1>
          <p className="text-gray-600 mt-1">Gerencie professores e administradores</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'professor')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todas as funções</option>
          <option value="professor">Professores</option>
          <option value="admin">Administradores</option>
        </select>
        
        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'cards'
                ? 'bg-white text-blue-600 shadow-sm'
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
                ? 'bg-white text-blue-600 shadow-sm'
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

      {/* Professors Display */}
      {filteredProfessors.length > 0 ? (
        <>
          {viewMode === 'cards' ? (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
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
            </motion.div>
          ) : (
            <ProfessorListView />
          )}
        </>
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Primeiro Professor
            </button>
          )}
        </div>
      )}
    </div>
  );
};
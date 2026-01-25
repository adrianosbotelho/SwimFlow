import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClassCard } from '../components/ClassCard';
import { ClassForm } from '../components/ClassForm';
import { professorService } from '../services/professorService';
import type { Class, CreateClassData, UpdateClassData } from '../types/class';
import type { Pool } from '../types/pool';
import type { Professor } from '../types/professor';

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

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load classes
      const classesResponse = await fetch('/api/classes');
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData.success ? classesData.data.classes : []);
      }

      // Load pools
      const poolsResponse = await fetch('/api/pools');
      if (poolsResponse.ok) {
        const poolsData = await poolsResponse.json();
        setPools(poolsData.success ? poolsData.data.pools : []);
      }

      // Load professors from the real API
      try {
        const professorsData = await professorService.getAll();
        setProfessors(professorsData);
      } catch (professorError) {
        console.error('Error loading professors:', professorError);
        // Fallback to mock data if API fails
        setProfessors([
          { id: '0d4bc285-5d4d-4504-968d-f0e8e674f71f', name: 'Carlos Silva', email: 'carlos.silva@swimflow.com', role: 'professor', createdAt: '', updatedAt: '' },
          { id: 'bfff4b46-61cb-48d4-a423-4af47d90d7a3', name: 'Ana Santos', email: 'ana.santos@swimflow.com', role: 'professor', createdAt: '', updatedAt: '' }
        ]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (data: CreateClassData) => {
    try {
      setFormLoading(true);
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadData(); // Reload data
          setShowForm(false);
          setEditingClass(null);
        } else {
          throw new Error(result.error || 'Erro ao criar turma');
        }
      } else {
        throw new Error('Erro ao criar turma');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      alert(error instanceof Error ? error.message : 'Erro ao criar turma');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClass = async (data: UpdateClassData) => {
    if (!editingClass) return;

    try {
      setFormLoading(true);
      const response = await fetch(`/api/classes/${editingClass.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadData(); // Reload data
          setShowForm(false);
          setEditingClass(null);
        } else {
          throw new Error(result.error || 'Erro ao atualizar turma');
        }
      } else {
        throw new Error('Erro ao atualizar turma');
      }
    } catch (error) {
      console.error('Error updating class:', error);
      alert(error instanceof Error ? error.message : 'Erro ao atualizar turma');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (classData: Class) => {
    try {
      const response = await fetch(`/api/classes/${classData.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData(); // Reload data
      } else {
        const result = await response.json();
        alert(result.error || 'Erro ao excluir turma');
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Erro ao excluir turma');
    }
  };

  const handleSubmit = async (data: CreateClassData | UpdateClassData) => {
    if (editingClass) {
      await handleUpdateClass(data as UpdateClassData);
    } else {
      await handleCreateClass(data as CreateClassData);
    }
  };

  const handleEdit = (classData: Class) => {
    setEditingClass(classData);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClass(null);
  };

  // Filter classes based on search term
  const filteredClasses = classes.filter(classData => 
    classData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classData.pool?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Horário não definido'
    
    try {
      // Handle both ISO timestamp and time string formats
      if (timeString.includes('T')) {
        // It's an ISO timestamp, extract the time part directly from UTC
        const date = new Date(timeString);
        // Get UTC hours and minutes to avoid timezone conversion
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      } else {
        // It's a time string like "07:00", format it directly
        return timeString;
      }
    } catch (error) {
      console.error('Error formatting time:', timeString, error)
      return 'Horário inválido'
    }
  }

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  // List view component
  const ClassListView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Turma</div>
          <div className="col-span-2">Piscina</div>
          <div className="col-span-2">Ocupação</div>
          <div className="col-span-3">Horários</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {filteredClasses.map((classData, index) => {
          const currentStudents = classData._count?.students || 0
          const capacityPercentage = (currentStudents / classData.maxCapacity) * 100
          
          return (
            <motion.div
              key={classData.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Class Info */}
                <div className="col-span-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-ocean-400 flex items-center justify-center text-white text-sm font-semibold">
                      {classData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {classData.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {classData.schedules?.length || 0} horário(s)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pool */}
                <div className="col-span-2">
                  <span className="text-sm text-gray-900">
                    {classData.pool?.name || 'Não definida'}
                  </span>
                </div>

                {/* Capacity */}
                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {currentStudents}/{classData.maxCapacity}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(capacityPercentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          capacityPercentage >= 90 
                            ? 'bg-red-500' 
                            : capacityPercentage >= 70 
                            ? 'bg-amber-500' 
                            : 'bg-teal-500'
                        }`}
                        style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Schedules */}
                <div className="col-span-3">
                  <div className="flex flex-wrap gap-1">
                    {classData.schedules?.slice(0, 2).map((schedule, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-1 text-xs bg-ocean-100 text-ocean-800 rounded-full"
                      >
                        {dayNames[schedule.dayOfWeek]} {formatTime(schedule.startTime)}
                      </span>
                    ))}
                    {(classData.schedules?.length || 0) > 2 && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        +{(classData.schedules?.length || 0) - 2} mais
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => console.log('View class:', classData.id)}
                      className="p-1 text-gray-400 hover:text-ocean-600 transition-colors"
                      title="Ver detalhes"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(classData)}
                      className="p-1 text-gray-400 hover:text-teal-600 transition-colors"
                      title="Editar turma"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(classData)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Excluir turma"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
          <span className="ml-2 text-gray-600">Carregando turmas...</span>
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
            onClick={loadData}
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
          <h1 className="text-3xl font-bold text-blue-800">Turmas</h1>
          <p className="text-gray-600 mt-1">Gerencie as turmas e seus alunos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nova Turma</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por nome da turma ou piscina..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
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
              <ClassForm
                class={editingClass || undefined}
                professors={professors}
                pools={pools}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={formLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classes Display */}
      {filteredClasses.length > 0 ? (
        <>
          {viewMode === 'cards' ? (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredClasses.map((classData) => (
                <ClassCard
                  key={classData.id}
                  class={classData}
                  onEdit={() => handleEdit(classData)}
                  onDelete={() => handleDelete(classData)}
                  onViewDetails={() => {
                    // TODO: Implement view details
                    console.log('View details for class:', classData.id);
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <ClassListView />
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium mb-2">
            {searchTerm ? 'Nenhuma turma encontrada' : 'Nenhuma turma encontrada'}
          </h3>
          <p className="mb-4">
            {searchTerm ? 'Tente ajustar os termos de busca' : 'Comece criando sua primeira turma'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors"
            >
              Criar Primeira Turma
            </button>
          )}
        </div>
      )}
    </div>
  );
};
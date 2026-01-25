import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClassCard } from '../components/ClassCard';
import { ClassForm } from '../components/ClassForm';
import { classService } from '../services/classService';
import type { Class, CreateClassData, UpdateClassData } from '../types/class';
import type { Pool } from '../types/pool';

interface Professor {
  id: string;
  name: string;
  email: string;
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

      // Mock professors for now (since we don't have a users endpoint working)
      setProfessors([
        { id: '0d4bc285-5d4d-4504-968d-f0e8e674f71f', name: 'Carlos Silva', email: 'carlos.silva@swimflow.com' },
        { id: 'bfff4b46-61cb-48d4-a423-4af47d90d7a3', name: 'Ana Santos', email: 'ana.santos@swimflow.com' }
      ]);

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
          <h1 className="text-3xl font-bold text-ocean-800">Turmas</h1>
          <p className="text-gray-600 mt-1">Gerencie as turmas e seus alunos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-ocean-600 hover:bg-ocean-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nova Turma</span>
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
              <ClassForm
                class={editingClass}
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

      {/* Classes Grid */}
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classData) => (
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
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium mb-2">Nenhuma turma encontrada</h3>
          <p className="mb-4">Comece criando sua primeira turma</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors"
          >
            Criar Primeira Turma
          </button>
        </div>
      )}
    </div>
  );
};
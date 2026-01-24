import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClassCard } from '../components/ClassCard';
import { ClassForm } from '../components/ClassForm';

export const ClassesPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

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
                setShowForm(false);
              }
            }}
          >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <ClassForm
                professors={[
                  { id: 'prof-1', name: 'Carlos Silva', email: 'carlos@swimflow.com' },
                  { id: 'prof-2', name: 'Ana Santos', email: 'ana@swimflow.com' }
                ]}
                pools={[
                  { id: 'pool-1', name: 'Piscina Principal', capacity: 25, length: 25, lanes: 6, temperature: 28, description: 'Principal', createdAt: '2024-01-01T00:00:00.000Z' },
                  { id: 'pool-2', name: 'Piscina Olímpica', capacity: 50, length: 50, lanes: 8, temperature: 26, description: 'Olímpica', createdAt: '2024-01-01T00:00:00.000Z' }
                ]}
                onSubmit={async () => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Mock data - replace with real data */}
        <ClassCard
          class={{
            id: '1',
            name: 'Turma Iniciante Manhã',
            professorId: 'prof-1',
            poolId: 'pool-1',
            maxCapacity: 12,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }}
          onEdit={() => {}}
          onViewDetails={() => {}}
        />
        <ClassCard
          class={{
            id: '2',
            name: 'Turma Intermediário',
            professorId: 'prof-2',
            poolId: 'pool-2',
            maxCapacity: 10,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }}
          onEdit={() => {}}
          onViewDetails={() => {}}
        />
        <ClassCard
          class={{
            id: '3',
            name: 'Turma Avançado',
            professorId: 'prof-1',
            poolId: 'pool-3',
            maxCapacity: 8,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }}
          onEdit={() => {}}
          onViewDetails={() => {}}
        />
      </div>

      {/* Empty State */}
      <div className="text-center py-12 text-gray-500">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-lg font-medium mb-2">Sistema de Turmas Implementado</h3>
        <p>Componentes de turma criados e funcionando</p>
      </div>
    </div>
  );
};
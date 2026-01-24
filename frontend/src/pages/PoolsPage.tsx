import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PoolCard } from '../components/PoolCard';
import { PoolForm } from '../components/PoolForm';

export const PoolsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

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
                setShowForm(false);
              }
            }}
          >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <PoolForm
                onSubmit={async () => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Mock data - replace with real data */}
        <PoolCard
          pool={{
            id: '1',
            name: 'Piscina Principal',
            capacity: 25,
            length: 25,
            lanes: 6,
            temperature: 28,
            description: 'Piscina principal para aulas e treinos',
            createdAt: '2024-01-01T00:00:00.000Z'
          }}
          onEdit={() => {}}
          onViewDetails={() => {}}
        />
        <PoolCard
          pool={{
            id: '2',
            name: 'Piscina Olímpica',
            capacity: 50,
            length: 50,
            lanes: 8,
            temperature: 26,
            description: 'Piscina olímpica para competições',
            createdAt: '2024-01-01T00:00:00.000Z'
          }}
          onEdit={() => {}}
          onViewDetails={() => {}}
        />
        <PoolCard
          pool={{
            id: '3',
            name: 'Piscina Aquecida',
            capacity: 15,
            length: 20,
            lanes: 4,
            temperature: 30,
            description: 'Piscina aquecida para iniciantes',
            createdAt: '2024-01-01T00:00:00.000Z'
          }}
          onEdit={() => {}}
          onViewDetails={() => {}}
        />
      </div>

      {/* Empty State */}
      <div className="text-center py-12 text-gray-500">
        <div className="text-6xl mb-4">🏊‍♀️</div>
        <h3 className="text-lg font-medium mb-2">Sistema de Piscinas Implementado</h3>
        <p>Componentes de piscina criados e funcionando</p>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrainingList } from '../components/TrainingList';
import { TrainingForm } from '../components/TrainingForm';

export const TrainingsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ocean-800">Treinos</h1>
          <p className="text-gray-600 mt-1">Registre e acompanhe os treinos realizados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-ocean-600 hover:bg-ocean-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Novo Treino</span>
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
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <TrainingForm
                onSubmit={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Training List */}
      <TrainingList />

      {/* Info Section */}
      <div className="mt-12 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">💪</div>
          <h3 className="text-lg font-medium mb-2">Sistema de Treinos Implementado</h3>
          <p className="text-gray-600">
            Registre treinos, selecione participantes e acompanhe o histórico de atividades
          </p>
        </div>
      </div>
    </div>
  );
};
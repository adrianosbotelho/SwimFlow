import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrainingList } from '../components/TrainingList';
import { TrainingForm } from '../components/TrainingForm';
import { TrainingDetail } from '../components/TrainingDetail';
import { Training } from '../types/training';

export const TrainingsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | undefined>(undefined);
  const [viewingTrainingId, setViewingTrainingId] = useState<string | undefined>(undefined);
  const trainingListRef = useRef<{ refreshTrainings: () => void }>(null);

  const handleNewTraining = () => {
    setEditingTraining(undefined);
    setShowForm(true);
  };

  const handleEditTraining = (training: Training) => {
    setEditingTraining(training);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleViewDetails = (trainingId: string) => {
    setViewingTrainingId(trainingId);
    setShowDetail(true);
  };

  const handleFormSubmit = (training: Training) => {
    setShowForm(false);
    setEditingTraining(undefined);
    // Refresh the training list
    if (trainingListRef.current) {
      trainingListRef.current.refreshTrainings();
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTraining(undefined);
  };

  const handleDetailClose = () => {
    setShowDetail(false);
    setViewingTrainingId(undefined);
  };

  const handleDeleteTraining = (trainingId: string) => {
    // Refresh the training list after deletion
    if (trainingListRef.current) {
      trainingListRef.current.refreshTrainings();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ocean-800">Treinos</h1>
          <p className="text-gray-600 mt-1">Registre e acompanhe os treinos realizados</p>
        </div>
        <button
          onClick={handleNewTraining}
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
                handleFormCancel();
              }
            }}
          >
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <TrainingForm
                training={editingTraining}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && viewingTrainingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleDetailClose();
              }
            }}
          >
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <TrainingDetail
                trainingId={viewingTrainingId}
                onClose={handleDetailClose}
                onEdit={handleEditTraining}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Training List */}
      <TrainingList
        ref={trainingListRef}
        onEdit={handleEditTraining}
        onDelete={handleDeleteTraining}
        onViewDetails={handleViewDetails}
      />

      {/* Info Section */}
      <div className="mt-12 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">💪</div>
          <h3 className="text-lg font-medium mb-2">Sistema de Treinos Completo</h3>
          <p className="text-gray-600">
            CRUD completo implementado: Criar, Visualizar, Editar e Excluir treinos com facilidade
          </p>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EvaluationForm from '../components/EvaluationForm';
import EvaluationHistory from '../components/EvaluationHistory';

export const EvaluationsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Mock student data - replace with real data
  const mockStudent = {
    id: 'student-1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: null,
    birthDate: '2000-01-01',
    level: 'intermediario' as const,
    objectives: 'Melhorar técnica',
    medicalNotes: null,
    profileImage: null,
    lastEvaluationDate: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ocean-800">Avaliações</h1>
          <p className="text-gray-600 mt-1">Sistema completo de avaliações técnicas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-ocean-600 hover:bg-ocean-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nova Avaliação</span>
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
              <EvaluationForm
                student={mockStudent}
                professorId="professor-1"
                onSubmit={() => {
                  setShowForm(false);
                  // Refresh evaluation history
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button className="py-4 px-1 border-b-2 border-ocean-500 text-ocean-600 font-medium text-sm">
              Histórico de Avaliações
            </button>
            <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
              Relatórios
            </button>
            <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
              Estatísticas
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Student Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Aluno
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
            >
              <option value="">Selecione um aluno...</option>
              <option value="student-1">João Silva (Intermediário)</option>
              <option value="student-2">Maria Santos (Iniciante)</option>
              <option value="student-3">Pedro Costa (Avançado)</option>
            </select>
          </div>

          {/* Evaluation History */}
          {selectedStudentId ? (
            <EvaluationHistory
              studentId={selectedStudentId}
              onEditEvaluation={(evaluation: any) => {
                console.log('Edit evaluation:', evaluation);
              }}
              onDeleteEvaluation={(evaluationId: string) => {
                console.log('Delete evaluation:', evaluationId);
              }}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sistema de Avaliações Completo</h3>
              <p className="text-gray-600 mb-4">
                Selecione um aluno para ver seu histórico de avaliações
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl mb-2">✅</div>
                  <h4 className="font-medium text-sm">Formulário Completo</h4>
                  <p className="text-xs text-gray-600">4 tipos de nado</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl mb-2">📈</div>
                  <h4 className="font-medium text-sm">Histórico</h4>
                  <p className="text-xs text-gray-600">Timeline visual</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-medium text-sm">Scores</h4>
                  <p className="text-xs text-gray-600">Técnica e resistência</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
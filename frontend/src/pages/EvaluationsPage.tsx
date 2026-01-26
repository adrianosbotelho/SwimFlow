import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EvaluationForm from '../components/EvaluationForm';
import EvaluationHistory from '../components/EvaluationHistory';
import { studentService } from '../services/studentService';
import evaluationService from '../services/evaluationService';
import type { Student } from '../types/student';
import type { Evaluation } from '../types/evaluation';

export const EvaluationsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'history' | 'reports' | 'stats'>('history');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [evaluationStats, setEvaluationStats] = useState<any>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      const student = students.find(s => s.id === selectedStudentId);
      setSelectedStudent(student || null);
      if (student) {
        loadEvaluationStats(selectedStudentId);
      }
    } else {
      setSelectedStudent(null);
      setEvaluationStats(null);
    }
  }, [selectedStudentId, students]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudents();
      setStudents(response.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluationStats = async (studentId: string) => {
    try {
      const stats = await evaluationService.getStudentStats(studentId);
      setEvaluationStats(stats);
    } catch (error) {
      console.error('Error loading evaluation stats:', error);
    }
  };

  const handleEvaluationSubmit = async (data: any) => {
    try {
      await evaluationService.createEvaluation(data);
      setShowForm(false);
      // Refresh stats if we have a selected student
      if (selectedStudentId) {
        loadEvaluationStats(selectedStudentId);
      }
    } catch (error) {
      console.error('Error creating evaluation:', error);
      alert('Erro ao criar avaliação. Tente novamente.');
    }
  };

  const renderReportsTab = () => {
    if (!selectedStudent || !evaluationStats) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Relatórios de Avaliação</h3>
          <p className="text-gray-600">Selecione um aluno para ver os relatórios detalhados</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Relatório de Progresso - {selectedStudent.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{evaluationStats.totalEvaluations}</div>
              <div className="text-sm text-gray-600">Total de Avaliações</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-teal-600">
                {evaluationStats.lastEvaluationDate 
                  ? new Date(evaluationStats.lastEvaluationDate).toLocaleDateString('pt-BR')
                  : 'N/A'
                }
              </div>
              <div className="text-sm text-gray-600">Última Avaliação</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 capitalize">{selectedStudent.level}</div>
              <div className="text-sm text-gray-600">Nível Atual</div>
            </div>
          </div>
        </div>

        {/* Average Scores by Stroke */}
        {Object.keys(evaluationStats.averageScores).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Médias por Tipo de Nado</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(evaluationStats.averageScores).map(([strokeType, scores]: [string, any]) => (
                <div key={strokeType} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 capitalize mb-2">{strokeType}</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Técnica:</span>
                      <span className="font-medium">{scores.technique}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Resistência:</span>
                      <span className="font-medium">{scores.resistance}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStatsTab = () => {
    if (!selectedStudent) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Estatísticas Detalhadas</h3>
          <p className="text-gray-600">Selecione um aluno para ver as estatísticas de evolução</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Estatísticas de Evolução - {selectedStudent.name}
          </h4>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🚧</div>
            <p className="text-gray-600">
              Gráficos de evolução em desenvolvimento
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Em breve: gráficos interativos mostrando a evolução do aluno ao longo do tempo
            </p>
          </div>
        </div>
      </div>
    );
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
          disabled={!selectedStudent}
          className="bg-ocean-600 hover:bg-ocean-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nova Avaliação</span>
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && selectedStudent && (
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
                student={selectedStudent}
                professorId="professor-1" // TODO: Get from auth context
                onSubmit={handleEvaluationSubmit}
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
            <button 
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history' 
                  ? 'border-ocean-500 text-ocean-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Histórico de Avaliações
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports' 
                  ? 'border-ocean-500 text-ocean-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Relatórios
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats' 
                  ? 'border-ocean-500 text-ocean-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
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
            {loading ? (
              <div className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                Carregando alunos...
              </div>
            ) : (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              >
                <option value="">Selecione um aluno...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.level})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'history' && (
            selectedStudentId ? (
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
            )
          )}

          {activeTab === 'reports' && renderReportsTab()}
          {activeTab === 'stats' && renderStatsTab()}
        </div>
      </div>
    </div>
  );
};
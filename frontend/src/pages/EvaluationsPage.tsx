import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EvaluationForm from '../components/EvaluationForm';
import EvaluationHistory from '../components/EvaluationHistory';
import { EvolutionChart } from '../components/EvaluationChart';
import { studentService } from '../services/studentService';
import { professorService } from '../services/professorService';
import evaluationService from '../services/evaluationService';
import type { Student } from '../types/student';
import type { StrokeType } from '../types/evaluation';
import { STROKE_TYPES } from '../types/evaluation';

export const EvaluationsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'history' | 'reports' | 'stats'>('history');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluationStats, setEvaluationStats] = useState<any>(null);
  const [selectedStroke, setSelectedStroke] = useState<string>('');
  const [professors, setProfessors] = useState<any[]>([]);
  const [selectedProfessorId, setSelectedProfessorId] = useState<string>('');
  const [dateFilters, setDateFilters] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadStudents();
    loadProfessors();
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

  // Reload stats when date filters change
  useEffect(() => {
    if (selectedStudentId) {
      loadEvaluationStats(selectedStudentId);
    }
  }, [dateFilters, selectedStudentId]);

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
      const stats = await evaluationService.getStudentStats(
        studentId, 
        dateFilters.startDate || undefined, 
        dateFilters.endDate || undefined
      );
      setEvaluationStats(stats);
    } catch (error) {
      console.error('Error loading evaluation stats:', error);
    }
  };

  const loadProfessors = async () => {
    try {
      const professorsData = await professorService.getAll();
      setProfessors(professorsData);
      // Auto-select first professor if available
      if (professorsData.length > 0 && !selectedProfessorId) {
        setSelectedProfessorId(professorsData[0].id);
      }
    } catch (error) {
      console.error('Error loading professors:', error);
    }
  };

  const handleDeleteEvaluation = async () => {
    // Refresh stats after deletion
    if (selectedStudentId) {
      loadEvaluationStats(selectedStudentId);
    }
  };

  const handleEvaluationSubmit = async (data: any) => {
    try {
      console.log('Original form data:', data);
      
      // Validate data before sending
      if (!data.studentId) {
        throw new Error('ID do aluno é obrigatório');
      }
      if (!data.professorId) {
        throw new Error('ID do professor é obrigatório');
      }
      if (!data.date) {
        throw new Error('Data da avaliação é obrigatória');
      }
      if (!data.strokeEvaluations || data.strokeEvaluations.length === 0) {
        throw new Error('Pelo menos uma avaliação de nado é obrigatória');
      }
      
      // Check if date is not in the future
      const selectedDate = new Date(data.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (selectedDate > today) {
        throw new Error('A data da avaliação não pode ser no futuro');
      }
      
      // Convert date string to proper ISO DateTime for backend
      const evaluationData = {
        ...data,
        date: selectedDate.toISOString()
      };
      
      console.log('Converted evaluation data:', evaluationData);
      
      await evaluationService.createEvaluation(evaluationData);
      setShowForm(false);
      // Refresh stats if we have a selected student
      if (selectedStudentId) {
        loadEvaluationStats(selectedStudentId);
      }
    } catch (error) {
      console.error('Full error object:', error);
      
      // More detailed error message
      let errorMessage = 'Erro ao criar avaliação. Tente novamente.';
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as any;
        console.log('Response data:', axiosError.response?.data);
        console.log('Response status:', axiosError.response?.status);
        
        if (axiosError.response?.data?.message) {
          errorMessage = `Erro: ${axiosError.response.data.message}`;
        } else if (axiosError.response?.data?.error) {
          errorMessage = `Erro: ${axiosError.response.data.error}`;
        } else if (axiosError.response?.status) {
          errorMessage = `Erro HTTP ${axiosError.response.status}: ${axiosError.response.statusText || 'Erro desconhecido'}`;
        }
      } else if (error instanceof Error) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      alert(errorMessage);
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
        {/* Date Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Data</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={dateFilters.startDate}
                onChange={(e) => setDateFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={dateFilters.endDate}
                onChange={(e) => setDateFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setDateFilters({ startDate: today, endDate: today });
              }}
              className="px-3 py-1 text-sm bg-ocean-100 text-ocean-700 rounded-full hover:bg-ocean-200 transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                setDateFilters({ 
                  startDate: lastWeek.toISOString().split('T')[0], 
                  endDate: today.toISOString().split('T')[0] 
                });
              }}
              className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors"
            >
              Última Semana
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                setDateFilters({ 
                  startDate: lastMonth.toISOString().split('T')[0], 
                  endDate: today.toISOString().split('T')[0] 
                });
              }}
              className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition-colors"
            >
              Último Mês
            </button>
            <button
              onClick={() => setDateFilters({ startDate: '', endDate: '' })}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Relatório de Progresso - {selectedStudent.name}
            {(dateFilters.startDate || dateFilters.endDate) && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                {dateFilters.startDate && dateFilters.endDate 
                  ? `(${new Date(dateFilters.startDate).toLocaleDateString('pt-BR')} - ${new Date(dateFilters.endDate).toLocaleDateString('pt-BR')})`
                  : dateFilters.startDate 
                  ? `(a partir de ${new Date(dateFilters.startDate).toLocaleDateString('pt-BR')})`
                  : `(até ${new Date(dateFilters.endDate).toLocaleDateString('pt-BR')})`
                }
              </span>
            )}
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

        {/* Evaluation History with Date Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Avaliações</h4>
          <EvaluationHistory
            studentId={selectedStudent.id}
            startDate={dateFilters.startDate || undefined}
            endDate={dateFilters.endDate || undefined}
            onDeleteEvaluation={handleDeleteEvaluation}
          />
        </div>
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
        {/* Stroke Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Tipo de Nado
          </label>
          <select
            value={selectedStroke}
            onChange={(e) => setSelectedStroke(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="">Todos os nados</option>
            {STROKE_TYPES.map((stroke) => (
              <option key={stroke.value} value={stroke.value}>
                {stroke.label}
              </option>
            ))}
          </select>
        </div>

        {/* Evolution Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Evolução de Desempenho - {selectedStudent.name}
          </h4>
          <EvolutionChart 
            studentId={selectedStudent.id}
            selectedStroke={selectedStroke as StrokeType}
          />
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
          disabled={!selectedStudent || !selectedProfessorId}
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
                professorId={selectedProfessorId}
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
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Aluno
              </label>
              {loading ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  Carregando alunos...
                </div>
              ) : (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-gray-900 bg-white"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professor Avaliador
              </label>
              <select
                value={selectedProfessorId}
                onChange={(e) => setSelectedProfessorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">Selecione um professor...</option>
                {professors.map((professor) => (
                  <option key={professor.id} value={professor.id}>
                    {professor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'history' && (
            selectedStudentId ? (
              <div className="space-y-6">
                {/* Date Filters for History */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Data</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Inicial
                      </label>
                      <input
                        type="date"
                        value={dateFilters.startDate}
                        onChange={(e) => setDateFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Final
                      </label>
                      <input
                        type="date"
                        value={dateFilters.endDate}
                        onChange={(e) => setDateFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setDateFilters({ startDate: today, endDate: today });
                      }}
                      className="px-3 py-1 text-sm bg-ocean-100 text-ocean-700 rounded-full hover:bg-ocean-200 transition-colors"
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        setDateFilters({ 
                          startDate: lastWeek.toISOString().split('T')[0], 
                          endDate: today.toISOString().split('T')[0] 
                        });
                      }}
                      className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors"
                    >
                      Última Semana
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                        setDateFilters({ 
                          startDate: lastMonth.toISOString().split('T')[0], 
                          endDate: today.toISOString().split('T')[0] 
                        });
                      }}
                      className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition-colors"
                    >
                      Último Mês
                    </button>
                    <button
                      onClick={() => setDateFilters({ startDate: '', endDate: '' })}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </div>

                <EvaluationHistory
                  studentId={selectedStudentId}
                  startDate={dateFilters.startDate || undefined}
                  endDate={dateFilters.endDate || undefined}
                  onEditEvaluation={(evaluation: any) => {
                    console.log('Edit evaluation:', evaluation);
                  }}
                  onDeleteEvaluation={handleDeleteEvaluation}
                />
              </div>
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
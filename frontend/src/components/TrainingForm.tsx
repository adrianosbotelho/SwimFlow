import React, { useState, useEffect } from 'react';
import { Training, CreateTrainingData, UpdateTrainingData } from '../types/training';
import { Class } from '../types/class';
import { Student } from '../types/student';
import classService from '../services/classService';
import trainingService from '../services/trainingService';
import { LevelBadge } from './LevelBadge';

interface TrainingFormProps {
  training?: Training;
  onSubmit: (training: Training) => void;
  onCancel: () => void;
  initialClassId?: string;
}

export const TrainingForm: React.FC<TrainingFormProps> = ({
  training,
  onSubmit,
  onCancel,
  initialClassId
}) => {
  const [formData, setFormData] = useState({
    classId: training?.classId || initialClassId || '',
    date: training?.date ? training.date.split('T')[0] : new Date().toISOString().split('T')[0],
    duration: training?.duration || 60,
    activities: training?.activities || [''],
    notes: training?.notes || '',
    participantIds: training?.participants.map(p => p.student.id) || []
  });

  const [classes, setClasses] = useState<Class[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Load classes on component mount
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoadingClasses(true);
        const classesData = await classService.listClasses();
        setClasses(classesData);
      } catch (err) {
        setError('Erro ao carregar turmas');
        console.error('Error loading classes:', err);
      } finally {
        setLoadingClasses(false);
      }
    };

    loadClasses();
  }, []);

  // Load students when class is selected
  useEffect(() => {
    const loadStudents = async () => {
      if (!formData.classId) {
        setAvailableStudents([]);
        return;
      }

      try {
        setLoadingStudents(true);
        const selectedClass = await classService.getClass(formData.classId);
        setAvailableStudents(selectedClass.students?.map((cs: any) => cs.student) || []);
      } catch (err) {
        setError('Erro ao carregar alunos da turma');
        setAvailableStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, [formData.classId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleActivityChange = (index: number, value: string) => {
    const newActivities = [...formData.activities];
    newActivities[index] = value;
    setFormData(prev => ({
      ...prev,
      activities: newActivities
    }));
  };

  const addActivity = () => {
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, '']
    }));
  };

  const removeActivity = (index: number) => {
    if (formData.activities.length > 1) {
      const newActivities = formData.activities.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        activities: newActivities
      }));
    }
  };

  const handleParticipantToggle = (studentId: string) => {
    const isSelected = formData.participantIds.includes(studentId);
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        participantIds: prev.participantIds.filter(id => id !== studentId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        participantIds: [...prev.participantIds, studentId]
      }));
    }
  };

  const selectAllParticipants = () => {
    setFormData(prev => ({
      ...prev,
      participantIds: availableStudents.map(student => student.id)
    }));
  };

  const clearAllParticipants = () => {
    setFormData(prev => ({
      ...prev,
      participantIds: []
    }));
  };

  const validateForm = () => {
    if (!formData.classId) {
      setError('Selecione uma turma');
      return false;
    }
    if (!formData.date) {
      setError('Selecione uma data');
      return false;
    }
    if (formData.duration < 1) {
      setError('A duração deve ser maior que 0');
      return false;
    }
    if (formData.activities.some(activity => !activity.trim())) {
      setError('Todas as atividades devem ser preenchidas');
      return false;
    }
    if (formData.participantIds.length === 0) {
      setError('Selecione pelo menos um participante');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const trainingData = {
        ...formData,
        activities: formData.activities.filter(activity => activity.trim())
      };

      let result: Training;
      if (training) {
        // Update existing training
        const updateData: UpdateTrainingData = {
          date: trainingData.date,
          duration: trainingData.duration,
          activities: trainingData.activities,
          notes: trainingData.notes || undefined,
          participantIds: trainingData.participantIds
        };
        result = await trainingService.updateTraining(training.id, updateData);
      } else {
        // Create new training
        const createData: CreateTrainingData = {
          classId: trainingData.classId,
          date: trainingData.date,
          duration: trainingData.duration,
          activities: trainingData.activities,
          notes: trainingData.notes || undefined,
          participantIds: trainingData.participantIds
        };
        result = await trainingService.createTraining(createData);
      }

      onSubmit(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar treino');
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find(c => c.id === formData.classId);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {training ? 'Editar Treino' : 'Novo Treino'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Turma *
            </label>
            <select
              value={formData.classId}
              onChange={(e) => handleInputChange('classId', e.target.value)}
              disabled={loadingClasses || !!training}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent disabled:bg-gray-100"
              required
            >
              <option value="">Selecione uma turma</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.pool?.name || 'Piscina não definida'}
                </option>
              ))}
            </select>
            {selectedClass && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedClass.schedules && selectedClass.schedules.length > 0 
                  ? `Prof. ${selectedClass.schedules[0]?.professor?.name || 'Professor não definido'} • ${selectedClass.pool?.name || 'Piscina não definida'}`
                  : selectedClass.pool?.name || 'Piscina não definida'
                }
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duração (minutos) *
            </label>
            <input
              type="number"
              min="1"
              max="480"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Activities */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Atividades *
            </label>
            <button
              type="button"
              onClick={addActivity}
              className="text-sm text-ocean-600 hover:text-ocean-700 font-medium"
            >
              + Adicionar atividade
            </button>
          </div>
          <div className="space-y-2">
            {formData.activities.map((activity, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={activity}
                  onChange={(e) => handleActivityChange(index, e.target.value)}
                  placeholder={`Atividade ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent"
                  required
                />
                {formData.activities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeActivity(index)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Participants */}
        {formData.classId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Participantes * ({formData.participantIds.length} selecionados)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllParticipants}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Selecionar todos
                </button>
                <button
                  type="button"
                  onClick={clearAllParticipants}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Limpar seleção
                </button>
              </div>
            </div>

            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ocean-500"></div>
                <span className="ml-2 text-gray-600">Carregando alunos...</span>
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum aluno encontrado nesta turma
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {availableStudents.map((student) => (
                  <label
                    key={student.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.participantIds.includes(student.id)
                        ? 'bg-ocean-50 border-ocean-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    } border`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.participantIds.includes(student.id)}
                      onChange={() => handleParticipantToggle(student.id)}
                      className="w-4 h-4 text-ocean-600 border-gray-300 rounded focus:ring-ocean-500"
                    />
                    {student.profileImage ? (
                      <img
                        src={student.profileImage}
                        alt={student.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-ocean-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-ocean-700">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {student.name}
                      </p>
                      <LevelBadge level={student.level} size="xs" />
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            placeholder="Observações sobre o treino (opcional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {training ? 'Atualizar Treino' : 'Criar Treino'}
          </button>
        </div>
      </form>
    </div>
  );
};
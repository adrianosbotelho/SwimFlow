import React, { useState, useEffect } from 'react';
import { CreateEvaluationData, StrokeEvaluation, STROKE_TYPES, StrokeType, EVALUATION_TYPES, EvaluationType, LEVELS, Level, getNextLevel } from '../types/evaluation';
import { Student } from '../types/student';

interface EvaluationFormProps {
  student?: Student;
  professorId: string;
  initialData?: Partial<CreateEvaluationData>;
  onSubmit: (data: CreateEvaluationData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({
  student,
  professorId,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreateEvaluationData>({
    studentId: student?.id || '',
    professorId,
    date: new Date().toISOString().split('T')[0],
    evaluationType: 'REGULAR',
    targetLevel: undefined,
    isApproved: null,
    approvalNotes: '',
    strokeEvaluations: STROKE_TYPES.map(stroke => ({
      strokeType: stroke.value,
      technique: 5,
      timeSeconds: undefined,
      resistance: 5,
      notes: ''
    })),
    generalNotes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        strokeEvaluations: initialData.strokeEvaluations || prev.strokeEvaluations
      }));
    }
  }, [initialData]);

  const updateStrokeEvaluation = (strokeType: StrokeType, field: keyof StrokeEvaluation, value: any) => {
    setFormData(prev => ({
      ...prev,
      strokeEvaluations: prev.strokeEvaluations.map(stroke =>
        stroke.strokeType === strokeType
          ? { ...stroke, [field]: value }
          : stroke
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate level progression fields
    if (formData.evaluationType === 'LEVEL_PROGRESSION') {
      if (!formData.targetLevel) {
        alert('Por favor, selecione o nível alvo para avaliação de progressão.');
        return;
      }
      
      if (formData.targetLevel === student?.level) {
        alert('O nível alvo deve ser diferente do nível atual do aluno.');
        return;
      }
    }
    
    // Filter out stroke evaluations with no meaningful data and clean up timeSeconds
    const validStrokeEvaluations = formData.strokeEvaluations
      .filter(stroke => 
        stroke.technique > 0 || stroke.resistance > 0 || stroke.timeSeconds || stroke.notes
      )
      .map(stroke => ({
        ...stroke,
        timeSeconds: stroke.timeSeconds && stroke.timeSeconds > 0 ? stroke.timeSeconds : undefined,
        notes: stroke.notes?.trim() || undefined
      }));

    if (validStrokeEvaluations.length === 0) {
      alert('Por favor, preencha pelo menos uma avaliação de nado.');
      return;
    }

    onSubmit({
      ...formData,
      strokeEvaluations: validStrokeEvaluations,
      generalNotes: formData.generalNotes?.trim() || undefined,
      approvalNotes: formData.approvalNotes?.trim() || undefined
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'border-green-300 bg-green-50 text-green-800';
    if (score >= 6) return 'border-yellow-300 bg-yellow-50 text-yellow-800';
    if (score >= 4) return 'border-orange-300 bg-orange-50 text-orange-800';
    return 'border-red-300 bg-red-50 text-red-800';
  };

  return (
    <div className="max-w-4xl mx-auto card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {initialData ? 'Editar Avaliação' : 'Nova Avaliação'}
        </h2>
        {student && (
          <p className="text-gray-600">
            Aluno: <span className="font-medium">{student.name}</span> - 
            Nível: <span className="font-medium capitalize">{student.level}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da Avaliação
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="input-modern"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Avaliação
            </label>
            <select
              value={formData.evaluationType}
              onChange={(e) => {
                const evaluationType = e.target.value as EvaluationType;
                setFormData(prev => ({ 
                  ...prev, 
                  evaluationType,
                  targetLevel: evaluationType === 'LEVEL_PROGRESSION' ? (getNextLevel(student?.level as Level) || undefined) : undefined,
                  isApproved: evaluationType === 'REGULAR' ? null : prev.isApproved
                }));
              }}
              className="input-modern"
            >
              {EVALUATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {EVALUATION_TYPES.find(t => t.value === formData.evaluationType)?.description}
            </p>
          </div>
        </div>

        {/* Level Progression Fields */}
        {formData.evaluationType === 'LEVEL_PROGRESSION' && (
          <div className="card-gradient">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Avaliação de Progressão de Nível</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível Atual: <span className="font-semibold capitalize">{student?.level}</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível Alvo
                </label>
                <select
                  value={formData.targetLevel || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetLevel: e.target.value as Level }))}
                  className="input-modern"
                  required
                >
                  <option value="">Selecione o nível alvo</option>
                  {LEVELS
                    .filter(level => level.value !== student?.level)
                    .map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status da Aprovação
                </label>
                <select
                  value={formData.isApproved === null ? 'pending' : formData.isApproved ? 'approved' : 'rejected'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      isApproved: value === 'pending' ? null : value === 'approved' 
                    }));
                  }}
                  className="input-modern"
                >
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Reprovado</option>
                </select>
              </div>

              <div className="flex items-center">
                {formData.isApproved === true && (
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Aluno será promovido para {LEVELS.find(l => l.value === formData.targetLevel)?.label}
                  </div>
                )}
                {formData.isApproved === false && (
                  <div className="flex items-center text-red-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Aluno permanecerá no nível atual
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações da Aprovação
              </label>
              <textarea
                value={formData.approvalNotes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, approvalNotes: e.target.value }))}
                className="input-modern"
                rows={3}
                placeholder="Justificativa para aprovação/reprovação, pontos a melhorar, recomendações..."
              />
            </div>
          </div>
        )}

        {/* Stroke Evaluations */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Avaliação por Tipo de Nado</h3>
          <div className="space-y-6">
            {STROKE_TYPES.map((strokeType) => {
              const strokeEval = formData.strokeEvaluations.find(s => s.strokeType === strokeType.value);
              if (!strokeEval) return null;

              return (
                <div key={strokeType.value} className="card">
                  <div className="flex items-center space-x-3 mb-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: strokeType.color }}
                    />
                    <h4 className="text-lg font-medium text-gray-900">{strokeType.label}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Technique Score */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Técnica (1-10)
                      </label>
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={strokeEval.technique}
                          onChange={(e) => updateStrokeEvaluation(strokeType.value, 'technique', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className={`mt-2 text-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(strokeEval.technique)}`}>
                          {strokeEval.technique}/10
                        </div>
                      </div>
                    </div>

                    {/* Resistance Score */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resistência (1-10)
                      </label>
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={strokeEval.resistance}
                          onChange={(e) => updateStrokeEvaluation(strokeType.value, 'resistance', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className={`mt-2 text-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(strokeEval.resistance)}`}>
                          {strokeEval.resistance}/10
                        </div>
                      </div>
                    </div>

                    {/* Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempo (segundos) - Opcional
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={strokeEval.timeSeconds || ''}
                        onChange={(e) => updateStrokeEvaluation(strokeType.value, 'timeSeconds', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="input-modern"
                        placeholder="Ex: 30.50"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações - Opcional
                    </label>
                    <textarea
                      value={strokeEval.notes || ''}
                      onChange={(e) => updateStrokeEvaluation(strokeType.value, 'notes', e.target.value)}
                      className="input-modern"
                      rows={2}
                      placeholder="Observações específicas sobre este nado..."
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* General Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações Gerais - Opcional
          </label>
          <textarea
            value={formData.generalNotes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, generalNotes: e.target.value }))}
            className="input-modern"
            rows={3}
            placeholder="Observações gerais sobre a avaliação, progresso do aluno, recomendações..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-white/40 dark:border-slate-700/60">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Salvar Avaliação')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EvaluationForm;

import React, { useState, useEffect } from 'react';
import { CreateEvaluationData, StrokeEvaluation, STROKE_TYPES, StrokeType } from '../types/evaluation';
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
    
    // Filter out stroke evaluations with no meaningful data
    const validStrokeEvaluations = formData.strokeEvaluations.filter(stroke => 
      stroke.technique > 0 || stroke.resistance > 0 || stroke.timeSeconds || stroke.notes
    );

    if (validStrokeEvaluations.length === 0) {
      alert('Por favor, preencha pelo menos uma avaliação de nado.');
      return;
    }

    onSubmit({
      ...formData,
      strokeEvaluations: validStrokeEvaluations
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'border-green-300 bg-green-50 text-green-800';
    if (score >= 6) return 'border-yellow-300 bg-yellow-50 text-yellow-800';
    if (score >= 4) return 'border-orange-300 bg-orange-50 text-orange-800';
    return 'border-red-300 bg-red-50 text-red-800';
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Stroke Evaluations */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Avaliação por Tipo de Nado</h3>
          <div className="space-y-6">
            {STROKE_TYPES.map((strokeType) => {
              const strokeEval = formData.strokeEvaluations.find(s => s.strokeType === strokeType.value);
              if (!strokeEval) return null;

              return (
                <div key={strokeType.value} className="border border-gray-200 rounded-lg p-4">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Observações gerais sobre a avaliação, progresso do aluno, recomendações..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
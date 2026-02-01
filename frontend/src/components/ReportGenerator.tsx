import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { StrokeType, getStrokeColor, getStrokeLabel } from '../types/evaluation';
import { EvolutionChart } from './EvaluationChart';
import { Timeline, TimelineEvent } from './Timeline';

export interface StudentReportData {
  student: {
    id: string;
    name: string;
    level: string;
    profileImage?: string;
    birthDate: string;
    objectives: string;
  };
  professor: {
    id: string;
    name: string;
  };
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalEvaluations: number;
    overallProgress: number;
    strongestStroke: StrokeType | null;
    weakestStroke: StrokeType | null;
    recentTrend: 'improving' | 'stable' | 'declining';
    daysToNextLevel: number | null;
    recommendedFocus: string[];
  };
  evolutionData: {
    studentId: string;
    strokeType: StrokeType;
    evaluations: {
      date: string;
      technique: number;
      resistance: number;
      overall: number;
      timeSeconds?: number;
    }[];
  }[];
  milestones: TimelineEvent[];
  strokeAnalysis: {
    strokeType: StrokeType;
    currentScore: number;
    averageScore: number;
    bestScore: number;
    improvement: number;
    evaluationCount: number;
    trend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
  }[];
}

interface ReportGeneratorProps {
  reportData: StudentReportData;
  onExport?: (format: 'pdf' | 'print') => void;
  showExportOptions?: boolean;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  reportData,
  onExport,
  showExportOptions = true
}) => {
  const [selectedView, setSelectedView] = useState<'summary' | 'detailed' | 'charts'>('summary');
  const reportRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining'): string => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
    }
  };

  const getTrendColor = (trend: 'improving' | 'stable' | 'declining'): string => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      case 'stable': return 'text-yellow-600';
    }
  };

  const getTrendLabel = (trend: 'improving' | 'stable' | 'declining'): string => {
    switch (trend) {
      case 'improving': return 'Melhorando';
      case 'declining': return 'Declinando';
      case 'stable': return 'Estável';
    }
  };

  const handlePrint = () => {
    window.print();
    onExport?.('print');
  };

  const handleExportPDF = () => {
    // This would integrate with a PDF generation library like jsPDF or Puppeteer
    console.log('Exporting to PDF...');
    onExport?.('pdf');
  };

  return (
    <div className="bg-white">
      {/* Report Controls */}
      {showExportOptions && (
        <div className="bg-gray-50 border-b border-gray-200 p-4 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Relatório Individual
              </h2>
              <div className="flex items-center space-x-2">
                {(['summary', 'detailed', 'charts'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setSelectedView(view)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedView === view
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {view === 'summary' ? 'Resumo' :
                     view === 'detailed' ? 'Detalhado' :
                     'Gráficos'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Imprimir</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Exportar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div ref={reportRef} className="p-8 max-w-4xl mx-auto">
        {/* Report Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pb-6 border-b border-gray-200"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Relatório de Evolução - Natação
          </h1>
          <p className="text-gray-600">
            Período: {formatDate(reportData.reportPeriod.startDate)} a {formatDate(reportData.reportPeriod.endDate)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Gerado em {new Date().toLocaleDateString('pt-BR')} por {reportData.professor.name}
          </p>
        </motion.div>

        {/* Student Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 mb-8"
        >
          <div className="flex items-start space-x-6">
            {reportData.student.profileImage && (
              <img
                src={reportData.student.profileImage}
                alt={reportData.student.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {reportData.student.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Idade:</span>
                  <span className="ml-2 font-medium">
                    {calculateAge(reportData.student.birthDate)} anos
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Nível:</span>
                  <span className="ml-2 font-medium capitalize">
                    {reportData.student.level}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Avaliações:</span>
                  <span className="ml-2 font-medium">
                    {reportData.summary.totalEvaluations}
                  </span>
                </div>
              </div>
              {reportData.student.objectives && (
                <div className="mt-4">
                  <span className="text-gray-600 text-sm">Objetivos:</span>
                  <p className="text-gray-800 mt-1">
                    {reportData.student.objectives}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Summary View */}
        {selectedView === 'summary' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Overall Progress */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Progresso Geral
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {reportData.summary.overallProgress > 0 ? '+' : ''}{reportData.summary.overallProgress.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Progresso Geral</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-3xl mb-1 ${getTrendColor(reportData.summary.recentTrend)}`}>
                    {getTrendIcon(reportData.summary.recentTrend)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getTrendLabel(reportData.summary.recentTrend)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {reportData.summary.strongestStroke ? getStrokeLabel(reportData.summary.strongestStroke) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Melhor Nado</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {reportData.summary.daysToNextLevel ? `${reportData.summary.daysToNextLevel}d` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Para Próximo Nível</div>
                </div>
              </div>
            </div>

            {/* Stroke Performance */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance por Nado
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.strokeAnalysis.map((stroke) => (
                  <div key={stroke.strokeType} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getStrokeColor(stroke.strokeType) }}
                      />
                      <h4 className="font-medium text-gray-900">
                        {getStrokeLabel(stroke.strokeType)}
                      </h4>
                      <span className={`text-sm ${getTrendColor(stroke.trend)}`}>
                        {getTrendIcon(stroke.trend)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Atual:</span>
                        <span className="font-medium">{stroke.currentScore.toFixed(1)}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Média:</span>
                        <span className="font-medium">{stroke.averageScore.toFixed(1)}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Melhor:</span>
                        <span className="font-medium text-green-600">{stroke.bestScore.toFixed(1)}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Melhoria:</span>
                        <span className={`font-medium ${stroke.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stroke.improvement > 0 ? '+' : ''}{stroke.improvement.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recomendações
              </h3>
              
              <div className="space-y-3">
                {reportData.summary.recommendedFocus.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Detailed View */}
        {selectedView === 'detailed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Detailed Stroke Analysis */}
            {reportData.strokeAnalysis.map((stroke) => (
              <div key={stroke.strokeType} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: getStrokeColor(stroke.strokeType) }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getStrokeLabel(stroke.strokeType)} - Análise Detalhada
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Estatísticas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Avaliações:</span>
                        <span className="font-medium">{stroke.evaluationCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pontuação Atual:</span>
                        <span className="font-medium">{stroke.currentScore.toFixed(1)}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Média Geral:</span>
                        <span className="font-medium">{stroke.averageScore.toFixed(1)}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Melhor Resultado:</span>
                        <span className="font-medium text-green-600">{stroke.bestScore.toFixed(1)}/10</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Tendência</h4>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`text-2xl ${getTrendColor(stroke.trend)}`}>
                        {getTrendIcon(stroke.trend)}
                      </span>
                      <span className={`font-medium ${getTrendColor(stroke.trend)}`}>
                        {getTrendLabel(stroke.trend)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Melhoria: {stroke.improvement > 0 ? '+' : ''}{stroke.improvement.toFixed(1)} pontos
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Próximos Passos</h4>
                    <div className="space-y-1">
                      {stroke.recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="text-sm text-gray-700">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Timeline */}
            <Timeline 
              events={reportData.milestones}
              maxEvents={15}
              showStrokeFilter={false}
            />
          </motion.div>
        )}

        {/* Charts View */}
        {selectedView === 'charts' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Evolution Charts */}
            <div className="space-y-6">
              <EvolutionChart
                evolutionData={reportData.evolutionData}
                metric="overall"
                height={300}
                showTrendLine={true}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EvolutionChart
                  evolutionData={reportData.evolutionData}
                  metric="technique"
                  height={250}
                />
                <EvolutionChart
                  evolutionData={reportData.evolutionData}
                  metric="resistance"
                  height={250}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Report Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500"
        >
          <p>
            Relatório gerado automaticamente pelo SwimFlow Management System
          </p>
          <p className="mt-1">
            Para dúvidas ou esclarecimentos, entre em contato com {reportData.professor.name}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StudentsPage } from '../pages/StudentsPage';
import { ClassesPage } from '../pages/ClassesPage';
import { PoolsPage } from '../pages/PoolsPage';
import { TrainingsPage } from '../pages/TrainingsPage';
import { EvaluationsPage } from '../pages/EvaluationsPage';
import { ProfessorsPage } from '../pages/ProfessorsPage';

type PageType = 'dashboard' | 'students' | 'classes' | 'pools' | 'trainings' | 'evaluations' | 'professors';

interface NavigationItem {
  id: PageType;
  label: string;
  icon: string;
  description: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    description: 'Visão geral do sistema'
  },
  {
    id: 'students',
    label: 'Alunos',
    icon: '🏊‍♂️',
    description: 'Gerenciar alunos'
  },
  {
    id: 'professors',
    label: 'Professores',
    icon: '👨‍🏫',
    description: 'Gerenciar professores'
  },
  {
    id: 'classes',
    label: 'Turmas',
    icon: '👥',
    description: 'Gerenciar turmas'
  },
  {
    id: 'pools',
    label: 'Piscinas',
    icon: '🏊‍♀️',
    description: 'Gerenciar piscinas'
  },
  {
    id: 'trainings',
    label: 'Treinos',
    icon: '💪',
    description: 'Registrar treinos'
  },
  {
    id: 'evaluations',
    label: 'Avaliações',
    icon: '📊',
    description: 'Sistema de avaliações'
  }
];

const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'students':
        return <StudentsPage />;
      case 'professors':
        return <ProfessorsPage />;
      case 'classes':
        return <ClassesPage />;
      case 'pools':
        return <PoolsPage />;
      case 'trainings':
        return <TrainingsPage />;
      case 'evaluations':
        return <EvaluationsPage />;
      default:
        return <DashboardHome onNavigate={setCurrentPage} />;
    }
  };

  if (currentPage !== 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-teal-50">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="flex items-center space-x-2 text-ocean-600 hover:text-ocean-800 transition-colors"
                >
                  <span className="text-2xl">🌊</span>
                  <span className="font-bold text-xl">SwimFlow</span>
                </button>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">
                  {navigationItems.find(item => item.id === currentPage)?.label}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Professor</span>
                <div className="w-8 h-8 bg-ocean-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  P
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Page Content */}
        <div className="pt-0">
          {renderPage()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-teal-50">
      {renderPage()}
    </div>
  );
};

interface DashboardHomeProps {
  onNavigate: (page: PageType) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center space-x-3 mb-4"
        >
          <span className="text-6xl">🌊</span>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-ocean-600 to-teal-600 bg-clip-text text-transparent">
            SwimFlow
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-600 max-w-2xl mx-auto"
        >
          Sistema completo de gestão para escolas de natação. 
          Gerencie alunos, turmas, treinos e acompanhe a evolução técnica.
        </motion.p>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
      >
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Alunos</p>
              <p className="text-2xl font-bold text-ocean-800">9</p>
            </div>
            <div className="text-3xl">🏊‍♂️</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Turmas Ativas</p>
              <p className="text-2xl font-bold text-teal-800">3</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Treinos Hoje</p>
              <p className="text-2xl font-bold text-blue-800">2</p>
            </div>
            <div className="text-3xl">💪</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avaliações</p>
              <p className="text-2xl font-bold text-purple-800">12</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navigationItems.slice(1).map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-200"
            onClick={() => onNavigate(item.id)}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-4xl">{item.icon}</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{item.label}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            </div>
            <div className="flex items-center text-ocean-600 text-sm font-medium">
              <span>Acessar</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-12 bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Atividades Recentes</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl">📊</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Nova avaliação criada</p>
              <p className="text-xs text-gray-600">Maria Fernanda Costa - Crawl, Costas, Peito</p>
            </div>
            <span className="text-xs text-gray-500">Agora</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl">🏊‍♂️</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Dados de seed carregados</p>
              <p className="text-xs text-gray-600">9 alunos, 3 turmas, 3 piscinas</p>
            </div>
            <span className="text-xs text-gray-500">Hoje</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl">💪</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Sistema de treinos ativo</p>
              <p className="text-xs text-gray-600">Registros de treino funcionando</p>
            </div>
            <span className="text-xs text-gray-500">Hoje</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentsPage } from '../pages/StudentsPage';
import { ClassesPage } from '../pages/ClassesPage';
import { PoolsPage } from '../pages/PoolsPage';
import { TrainingsPage } from '../pages/TrainingsPage';
import { EvaluationsPage } from '../pages/EvaluationsPage';
import { ProfessorsPage } from '../pages/ProfessorsPage';
import { ThemeToggle } from './ThemeToggle';
import authService, { User } from '../services/authService';
import { ProfilePage } from './ProfilePage';

type PageType = 'dashboard' | 'students' | 'classes' | 'pools' | 'trainings' | 'evaluations' | 'professors' | 'profile';

interface DashboardProps {
  onLogout?: () => void;
}

interface NavigationItem {
  id: PageType;
  label: string;
  icon: string;
  description: string;
  gradient: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    description: 'Visão geral do sistema',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'students',
    label: 'Alunos',
    icon: '🏊‍♂️',
    description: 'Gerenciar alunos',
    gradient: 'from-green-500 to-teal-600'
  },
  {
    id: 'professors',
    label: 'Professores',
    icon: '👨‍🏫',
    description: 'Gerenciar professores',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 'classes',
    label: 'Turmas',
    icon: '👥',
    description: 'Gerenciar turmas',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'pools',
    label: 'Piscinas',
    icon: '🏊‍♀️',
    description: 'Gerenciar piscinas',
    gradient: 'from-teal-500 to-cyan-600'
  },
  {
    id: 'trainings',
    label: 'Treinos',
    icon: '💪',
    description: 'Registrar treinos',
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    id: 'evaluations',
    label: 'Avaliações',
    icon: '📊',
    description: 'Sistema de avaliações',
    gradient: 'from-red-500 to-red-600'
  }
];

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
      case 'profile':
        return <ProfilePage onBack={() => setCurrentPage('dashboard')} />;
      default:
        return <DashboardHome onNavigate={setCurrentPage} />;
    }
  };

  if (currentPage !== 'dashboard') {
    return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
        {/* Modern Navigation Bar */}
        <nav className="glass border-b border-white/20 dark:border-slate-700/50 backdrop-blur-xl">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="flex items-center space-x-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
                >
                  <div className="relative">
                    <span className="text-3xl group-hover:animate-bounce-subtle">🌊</span>
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-400 dark:to-green-400 bg-clip-text text-transparent">
                    SwimFlow
                  </span>
                </button>
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {navigationItems.find(item => item.id === currentPage)?.icon}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                    {navigationItems.find(item => item.id === currentPage)?.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || 'Usuário'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Professor'}</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <svg className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                          <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full capitalize">
                            {user?.role}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => {
                            setCurrentPage('profile');
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-3"
                        >
                          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-gray-700 dark:text-gray-300">Meu Perfil</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setCurrentPage('profile');
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-3"
                        >
                          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-gray-700 dark:text-gray-300">Alterar Senha</span>
                        </button>
                        
                        <div className="border-t border-gray-200 dark:border-slate-700 mt-2 pt-2">
                          <button
                            onClick={() => {
                              handleLogout();
                              setShowUserMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-3 text-red-600 dark:text-red-400"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Sair</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
      {renderPage()}
    </div>
  );
};

interface DashboardHomeProps {
  onNavigate: (page: PageType) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate }) => {
  return (
    <div className="container mx-auto px-6 py-12">
      {/* Modern Header */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1"></div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-4"
          >
            <div className="relative">
              <span className="text-8xl animate-bounce-subtle">🌊</span>
              <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-2xl animate-glow"></div>
            </div>
            <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-purple-600 dark:from-blue-400 dark:via-green-400 dark:to-purple-400 bg-clip-text text-transparent">
              SwimFlow
            </h1>
          </motion.div>
          <div className="flex-1 flex justify-end">
            <ThemeToggle />
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
        >
          Sistema completo de gestão para escolas de natação. 
          Gerencie alunos, turmas, treinos e acompanhe a evolução técnica com tecnologia moderna.
        </motion.p>
      </div>

      {/* Enhanced Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
      >
        <div className="stat-card stat-card-primary group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total de Alunos</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">14</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">+2 este mês</p>
            </div>
            <div className="text-4xl group-hover:animate-bounce-subtle">🏊‍♂️</div>
          </div>
        </div>
        <div className="stat-card stat-card-secondary group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Turmas Ativas</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">5</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">100% ocupação</p>
            </div>
            <div className="text-4xl group-hover:animate-bounce-subtle">👥</div>
          </div>
        </div>
        <div className="stat-card stat-card-accent group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Treinos Hoje</p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">3</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">2 concluídos</p>
            </div>
            <div className="text-4xl group-hover:animate-bounce-subtle">💪</div>
          </div>
        </div>
        <div className="stat-card stat-card-coral group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avaliações</p>
              <p className="text-3xl font-bold text-red-700 dark:text-red-300">18</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">5 pendentes</p>
            </div>
            <div className="text-4xl group-hover:animate-bounce-subtle">📊</div>
          </div>
        </div>
      </motion.div>

      {/* Modern Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {navigationItems.slice(1).map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="card-gradient group cursor-pointer overflow-hidden relative"
            onClick={() => onNavigate(item.id)}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-6">
                <div className="text-5xl group-hover:animate-bounce-subtle">{item.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className={`flex items-center text-sm font-semibold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                  <span>Acessar módulo</span>
                </div>
                <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-700/50 group-hover:bg-white dark:group-hover:bg-slate-600 transition-colors">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-16 card-gradient"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Atividades Recentes</h2>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
            Ver todas
          </button>
        </div>
        <div className="space-y-4 scrollbar-modern max-h-80 overflow-y-auto">
          <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-white/20 dark:border-slate-700/20 hover:bg-white/70 dark:hover:bg-slate-700/50 transition-colors">
            <div className="text-3xl">📊</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Nova avaliação criada</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Maria Fernanda Costa - Crawl, Costas, Peito</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">Agora</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-white/20 dark:border-slate-700/20 hover:bg-white/70 dark:hover:bg-slate-700/50 transition-colors">
            <div className="text-3xl">🏊‍♂️</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Sistema atualizado</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Correções no formulário de treinos implementadas</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">2h atrás</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-white/20 dark:border-slate-700/20 hover:bg-white/70 dark:hover:bg-slate-700/50 transition-colors">
            <div className="text-3xl">💪</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Treino registrado</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Turma Natação Infantil - 5 participantes</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">Hoje</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
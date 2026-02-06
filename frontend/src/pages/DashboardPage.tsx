import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import authService, { User } from '../services/authService';
import { UserProfileHighlight } from '../components/UserProfileHighlight';
import { navigationItems } from '../config/navigation';

export const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  const dashboardCards = navigationItems.filter(item => item.id !== 'dashboard' && item.showInSidebar);

  return (
    <div className="space-y-12">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center space-x-4"
        >
          <div className="relative">
            <span className="text-7xl animate-bounce-subtle">🌊</span>
            <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-2xl animate-glow" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-teal-600 to-green-500 dark:from-blue-400 dark:via-teal-400 dark:to-green-400 bg-clip-text text-transparent">
            SwimFlow
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mt-6 leading-relaxed"
        >
          Controle total da sua escola de natacao em um painel inteligente, moderno e focado em resultados.
        </motion.p>
      </div>

      <UserProfileHighlight
        onNavigateToProfile={() => navigate('/profile')}
        onQuickAction={() => navigate(user?.role === 'admin' ? '/professors' : '/students')}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="stat-card stat-card-primary group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total de Alunos</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">14</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">+2 este mes</p>
            </div>
            <div className="text-4xl group-hover:animate-bounce-subtle">🏊‍♂️</div>
          </div>
        </div>
        <div className="stat-card stat-card-secondary group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Turmas Ativas</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">5</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">100% ocupacao</p>
            </div>
            <div className="text-4xl group-hover:animate-bounce-subtle">👥</div>
          </div>
        </div>
        <div className="stat-card stat-card-accent group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Treinos Hoje</p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">3</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">2 concluidos</p>
            </div>
            <div className="text-4xl group-hover:animate-bounce-subtle">💪</div>
          </div>
        </div>
        <div className="stat-card stat-card-coral group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avaliacoes</p>
              <p className="text-3xl font-bold text-red-700 dark:text-red-300">18</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">5 pendentes</p>
            </div>
            <div className="text-4xl group-hover:animate-bounce-subtle">📊</div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Acessos Rapidos</h2>
            <span className="text-sm text-gray-500">Principais modulos</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboardCards.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -6 }}
                className="card-gradient group cursor-pointer overflow-hidden relative"
                onClick={() => navigate(item.path)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-5">
                    <div className="text-4xl group-hover:animate-bounce-subtle">{item.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                      Acessar modulo
                    </span>
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
        </div>

        <div className="card-gradient">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Acoes Rapidas</h3>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/students')}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white/20 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-700/70 transition-colors"
            >
              <span className="text-sm font-medium">Cadastrar novo aluno</span>
              <span className="text-xl">➕</span>
            </button>
            <button
              onClick={() => navigate('/trainings')}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white/20 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-700/70 transition-colors"
            >
              <span className="text-sm font-medium">Registrar treino</span>
              <span className="text-xl">💪</span>
            </button>
            <button
              onClick={() => navigate('/evaluations')}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white/20 dark:border-slate-700/40 hover:bg-white/80 dark:hover:bg-slate-700/70 transition-colors"
            >
              <span className="text-sm font-medium">Nova avaliacao</span>
              <span className="text-xl">📊</span>
            </button>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card-gradient"
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
              <p className="font-semibold text-gray-900 dark:text-gray-100">Nova avaliacao criada</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Correcoes no formulario de treinos implementadas</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">2h atras</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-white/20 dark:border-slate-700/20 hover:bg-white/70 dark:hover:bg-slate-700/50 transition-colors">
            <div className="text-3xl">💪</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Treino registrado</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Turma Natacao Infantil - 5 participantes</p>
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

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import authService, { User } from '../services/authService';

interface UserProfileHighlightProps {
  onNavigateToProfile?: () => void;
  onQuickAction?: () => void;
}

export const UserProfileHighlight: React.FC<UserProfileHighlightProps> = ({ 
  onNavigateToProfile, 
  onQuickAction 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = authService.getUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Try to fetch from server if not in local storage
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to local storage data
        const localUser = authService.getUser();
        setUser(localUser);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-16"
      >
        <div className="bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-green-500/10 dark:from-blue-500/20 dark:via-teal-500/20 dark:to-green-500/20 rounded-2xl p-8 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gray-200 dark:bg-slate-700 rounded-2xl animate-pulse"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-1/3"></div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'professor':
        return 'Professor';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'from-red-500 to-pink-500';
      case 'professor':
        return 'from-blue-500 to-teal-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'professor':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-16"
    >
      <div className="bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-green-500/10 dark:from-blue-500/20 dark:via-teal-500/20 dark:to-green-500/20 rounded-2xl p-8 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* User Avatar */}
            <div className="relative">
              <div className={`w-20 h-20 bg-gradient-to-br ${getRoleColor(user.role)} rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  user.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              {/* Role Badge */}
              <div className={`absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br ${getRoleColor(user.role)} rounded-xl flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-slate-800`}>
                {getRoleIcon(user.role)}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {getWelcomeMessage()}, {user.name?.split(' ')[0] || 'Usuário'}!
                </h2>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-2xl"
                >
                  👋
                </motion.div>
              </div>
              
              <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                
                <div className="flex items-center space-x-2">
                  {getRoleIcon(user.role)}
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${getRoleColor(user.role)} text-white shadow-sm`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                <p>Bem-vindo ao SwimFlow! Gerencie sua escola de natação com facilidade.</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="hidden lg:flex flex-col space-y-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToProfile}
              className="px-4 py-2 bg-white/80 dark:bg-slate-800/80 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm border border-gray-200 dark:border-slate-600 flex items-center space-x-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Ver Perfil</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onQuickAction}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all shadow-sm flex items-center space-x-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{user.role === 'admin' ? 'Gerenciar Sistema' : 'Ver Alunos'}</span>
            </motion.button>
          </div>
        </div>

        {/* Additional Info Bar */}
        <div className="mt-6 pt-6 border-t border-blue-200/30 dark:border-blue-700/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Último acesso</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Agora</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Status</p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Ativo</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Permissões</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  {user.role === 'admin' ? 'Completas' : 'Limitadas'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Breadcrumbs } from './Breadcrumbs';
import authService, { User } from '../services/authService';

interface NavigationHeaderProps {
  onToggleSidebar: () => void;
  onLogout?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  onToggleSidebar,
  onLogout,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      onLogout?.();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl border-b border-white/30 dark:border-slate-800/60">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60"
            aria-label="Abrir menu"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <Breadcrumbs />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Controle completo em um so lugar</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Professor'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
                      navigate('/profile');
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
                      navigate('/profile?tab=password');
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
    </header>
  );
};

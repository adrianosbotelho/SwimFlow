import React, { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface DevLoginProps {
  onLogin: () => void;
}

const DevLogin: React.FC<DevLoginProps> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleDevLogin = () => {
    setIsLoggingIn(true);
    
    // Simulate login by setting a dev token
    localStorage.setItem('token', 'dev-token-123');
    
    setTimeout(() => {
      setIsLoggingIn(false);
      onLogin();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center transition-colors duration-300 relative">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="card-gradient max-w-md w-full mx-4 relative z-10 overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="relative">
              <span className="text-6xl animate-bounce-subtle">🌊</span>
              <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-2xl animate-glow"></div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-purple-600 dark:from-blue-400 dark:via-green-400 dark:to-purple-400 bg-clip-text text-transparent">
              SwimFlow
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Sistema de Gestão de Natação</p>
          <div className="mt-2 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Versão 2.0 - Interface Moderna</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Dev Mode Info */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm">ℹ️</span>
            </div>
            <h3 className="font-bold text-blue-800 dark:text-blue-300">Modo Desenvolvimento</h3>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
            Você está executando o sistema em modo de desenvolvimento com interface moderna e suporte a dark mode. 
            Clique no botão abaixo para acessar sem autenticação.
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={handleDevLogin}
          disabled={isLoggingIn}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center justify-center space-x-3">
            {isLoggingIn ? (
              <>
                <div className="loading-spinner w-5 h-5"></div>
                <span>Entrando no sistema...</span>
              </>
            ) : (
              <>
                <span className="text-xl">🏊‍♂️</span>
                <span>Entrar como Professor</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </div>
        </button>

        {/* Credentials Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Credenciais de desenvolvimento:</p>
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 dark:border-slate-700/20">
            <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
              Professor: dev@swimflow.com
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 pt-6 border-t border-white/20 dark:border-dark-700/20">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <span className="text-white text-xl">🏊‍♂️</span>
              </div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Gestão de Alunos</div>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <span className="text-white text-xl">📊</span>
              </div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Avaliações</div>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <span className="text-white text-xl">💪</span>
              </div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Treinos</div>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full text-xs text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Sistema Online • Dark Mode • Interface 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevLogin;
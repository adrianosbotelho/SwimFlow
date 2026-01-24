import React, { useState } from 'react';

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
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-teal-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-4xl">🌊</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ocean-600 to-teal-600 bg-clip-text text-transparent">
              SwimFlow
            </h1>
          </div>
          <p className="text-gray-600">Sistema de Gestão de Natação</p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-600">ℹ️</span>
              <h3 className="font-medium text-blue-800">Modo Desenvolvimento</h3>
            </div>
            <p className="text-sm text-blue-700">
              Você está executando o sistema em modo de desenvolvimento. 
              Clique no botão abaixo para acessar sem autenticação.
            </p>
          </div>

          <button
            onClick={handleDevLogin}
            disabled={isLoggingIn}
            className="w-full bg-ocean-600 hover:bg-ocean-700 disabled:bg-ocean-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isLoggingIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <span>🏊‍♂️</span>
                <span>Entrar como Professor</span>
              </>
            )}
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>Credenciais de desenvolvimento:</p>
            <p className="font-mono bg-gray-100 px-2 py-1 rounded mt-1">
              Professor: dev@swimflow.com
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">🏊‍♂️</div>
              <div className="text-xs text-gray-600">Alunos</div>
            </div>
            <div>
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs text-gray-600">Avaliações</div>
            </div>
            <div>
              <div className="text-2xl mb-1">💪</div>
              <div className="text-xs text-gray-600">Treinos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevLogin;
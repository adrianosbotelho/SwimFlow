import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiTest: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [studentsCount, setStudentsCount] = useState<number>(0);

  useEffect(() => {
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      setApiStatus('loading');
      
      // Test basic connection
      const response = await axios.get('http://localhost:3001/api/students', {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        setApiStatus('connected');
        setStudentsCount(response.data.data?.students?.length || response.data.data?.length || 0);
      }
    } catch (error: any) {
      setApiStatus('error');
      if (error.code === 'ECONNREFUSED') {
        setErrorMessage('Backend não está rodando na porta 3001');
      } else if (error.response?.status === 401) {
        setErrorMessage('Erro de autenticação - token necessário');
      } else {
        setErrorMessage(error.message || 'Erro desconhecido');
      }
    }
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'connected': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <h3 className="font-medium text-gray-900">Status da API</h3>
            <p className="text-sm text-gray-600">
              {apiStatus === 'loading' && 'Testando conexão...'}
              {apiStatus === 'connected' && `Conectado - ${studentsCount} alunos encontrados`}
              {apiStatus === 'error' && `Erro: ${errorMessage}`}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {apiStatus === 'loading' && 'Carregando'}
          {apiStatus === 'connected' && 'Online'}
          {apiStatus === 'error' && 'Offline'}
        </div>
      </div>
      
      {apiStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">Como resolver:</h4>
          <ol className="text-sm text-red-700 space-y-1">
            <li>1. Certifique-se que o PostgreSQL está rodando</li>
            <li>2. Inicie o backend: <code className="bg-red-100 px-1 rounded">cd backend && npm run dev</code></li>
            <li>3. Verifique se a porta 3001 está disponível</li>
          </ol>
          <button
            onClick={testApiConnection}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Testar Novamente
          </button>
        </div>
      )}
    </div>
  );
};

export default ApiTest;
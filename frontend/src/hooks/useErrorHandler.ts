import { useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { errorLogger } from '../utils/errorLogger';

interface ApiError extends Error {
  response?: {
    status: number;
    data?: any;
  };
}

export const useErrorHandler = () => {
  const { error: showError } = useNotifications();

  const handleError = useCallback((error: Error | ApiError, context?: string) => {
    // Log the error
    errorLogger.log(error, context);

    // Handle different types of errors
    if ('response' in error && error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          showError(
            'Dados inválidos',
            data?.message || 'Os dados fornecidos são inválidos. Verifique e tente novamente.'
          );
          break;
        
        case 401:
          showError(
            'Não autorizado',
            'Sua sessão expirou. Faça login novamente.',
            0 // Don't auto-dismiss
          );
          // Optionally redirect to login
          break;
        
        case 403:
          showError(
            'Acesso negado',
            'Você não tem permissão para realizar esta ação.'
          );
          break;
        
        case 404:
          showError(
            'Não encontrado',
            'O recurso solicitado não foi encontrado.'
          );
          break;
        
        case 409:
          showError(
            'Conflito',
            data?.message || 'Já existe um registro com essas informações.'
          );
          break;
        
        case 422:
          showError(
            'Dados inválidos',
            data?.message || 'Os dados fornecidos não puderam ser processados.'
          );
          break;
        
        case 429:
          showError(
            'Muitas tentativas',
            'Você fez muitas tentativas. Aguarde um momento e tente novamente.'
          );
          break;
        
        case 500:
          showError(
            'Erro interno',
            'Ocorreu um erro no servidor. Nossa equipe foi notificada.'
          );
          break;
        
        case 502:
        case 503:
        case 504:
          showError(
            'Serviço indisponível',
            'O serviço está temporariamente indisponível. Tente novamente em alguns minutos.'
          );
          break;
        
        default:
          showError(
            'Erro inesperado',
            data?.message || `Erro ${status}: ${error.message}`
          );
      }
    } else if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      showError(
        'Erro de conexão',
        'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'
      );
    } else {
      showError(
        'Erro inesperado',
        error.message || 'Ocorreu um erro inesperado. Tente novamente.'
      );
    }
  }, [showError]);

  const handleApiError = useCallback((error: ApiError, endpoint: string, method: string) => {
    errorLogger.logApiError(error, endpoint, method, error.response?.status);
    handleError(error, `API_${method.toUpperCase()}_${endpoint}`);
  }, [handleError]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    customErrorHandler?: (error: Error) => void
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (customErrorHandler) {
        customErrorHandler(err);
      } else {
        handleError(err, context);
      }
      
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleApiError,
    handleAsyncError,
  };
};
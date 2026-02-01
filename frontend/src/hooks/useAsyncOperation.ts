import { useState, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

interface UseAsyncOperationOptions {
  successMessage?: string;
  errorMessage?: string;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
}

interface AsyncOperationState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

export const useAsyncOperation = <T = any>(options: UseAsyncOperationOptions = {}) => {
  const {
    successMessage = 'Operação realizada com sucesso',
    errorMessage = 'Erro ao realizar operação',
    showSuccessNotification = true,
    showErrorNotification = true,
  } = options;

  const { success, error: showError } = useNotifications();
  const [state, setState] = useState<AsyncOperationState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(async <TResult = T>(
    asyncFunction: () => Promise<TResult>,
    customOptions?: {
      successMessage?: string;
      errorMessage?: string;
      showSuccessNotification?: boolean;
      showErrorNotification?: boolean;
    }
  ): Promise<TResult | null> => {
    const opts = { ...options, ...customOptions };
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await asyncFunction();
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        data: result,
        error: null 
      }));

      if (opts.showSuccessNotification && opts.successMessage) {
        success(opts.successMessage);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error,
        data: null 
      }));

      if (opts.showErrorNotification) {
        const message = opts.errorMessage || error.message;
        showError('Erro', message);
      }

      return null;
    }
  }, [options, success, showError, successMessage, errorMessage]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};
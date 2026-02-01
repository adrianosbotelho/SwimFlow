import React from 'react';
import { motion } from 'framer-motion';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
  showRetry?: boolean;
  showReload?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: {
    container: 'p-4',
    icon: 'h-8 w-8',
    iconContainer: 'h-12 w-12',
    title: 'text-lg',
    message: 'text-sm',
    button: 'px-3 py-2 text-sm',
  },
  md: {
    container: 'p-6',
    icon: 'h-8 w-8',
    iconContainer: 'h-16 w-16',
    title: 'text-xl',
    message: 'text-base',
    button: 'px-4 py-3 text-sm',
  },
  lg: {
    container: 'p-8',
    icon: 'h-10 w-10',
    iconContainer: 'h-20 w-20',
    title: 'text-2xl',
    message: 'text-lg',
    button: 'px-6 py-3 text-base',
  },
};

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  title = 'Algo deu errado',
  message = 'Ocorreu um erro inesperado. Tente novamente.',
  showRetry = true,
  showReload = false,
  size = 'md',
  className = '',
}) => {
  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 text-center max-w-md w-full ${classes.container}`}
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className={`mx-auto bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4 shadow-lg ${classes.iconContainer}`}
        >
          <svg className={`text-white ${classes.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </motion.div>

        {/* Error Title */}
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`font-bold text-gray-900 dark:text-gray-100 mb-2 ${classes.title}`}
        >
          {title}
        </motion.h3>

        {/* Error Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-gray-600 dark:text-gray-400 mb-4 ${classes.message}`}
        >
          {message}
        </motion.p>

        {/* Error Details (development only) */}
        {import.meta.env.DEV && error && (
          <motion.details
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-4 text-left"
          >
            <summary className="cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Detalhes do erro
            </summary>
            <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-32">
              <div className="mb-1">
                <strong>Error:</strong> {error.message}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
                </div>
              )}
            </div>
          </motion.details>
        )}

        {/* Action Buttons */}
        {(showRetry || showReload) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            {showRetry && resetError && (
              <button
                onClick={resetError}
                className={`w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg ${classes.button}`}
              >
                Tentar Novamente
              </button>
            )}
            
            {showReload && (
              <button
                onClick={() => window.location.reload()}
                className={`w-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors ${classes.button}`}
              >
                Recarregar Página
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Specific error fallbacks for common scenarios
export const NetworkErrorFallback: React.FC<Omit<ErrorFallbackProps, 'title' | 'message'>> = (props) => (
  <ErrorFallback
    {...props}
    title="Erro de Conexão"
    message="Não foi possível conectar ao servidor. Verifique sua conexão com a internet."
  />
);

export const NotFoundErrorFallback: React.FC<Omit<ErrorFallbackProps, 'title' | 'message'>> = (props) => (
  <ErrorFallback
    {...props}
    title="Página Não Encontrada"
    message="A página que você está procurando não existe ou foi movida."
  />
);

export const UnauthorizedErrorFallback: React.FC<Omit<ErrorFallbackProps, 'title' | 'message'>> = (props) => (
  <ErrorFallback
    {...props}
    title="Acesso Negado"
    message="Você não tem permissão para acessar este recurso."
  />
);
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';

interface AuthContainerProps {
  onLoginSuccess: () => void;
}

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'reset-success';

export const AuthContainer: React.FC<AuthContainerProps> = ({ onLoginSuccess }) => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [resetToken, setResetToken] = useState<string>('');

  // Check for reset token in URL on component mount
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setResetToken(token);
      setCurrentView('reset-password');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleForgotPassword = () => {
    setCurrentView('forgot-password');
  };

  const handleRegister = () => {
    setCurrentView('register');
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
    setResetToken('');
  };

  const handleResetSuccess = () => {
    setCurrentView('reset-success');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginForm
            onLoginSuccess={onLoginSuccess}
            onForgotPassword={handleForgotPassword}
            onRegister={handleRegister}
          />
        );
      
      case 'register':
        return (
          <RegisterForm
            onRegisterSuccess={onLoginSuccess}
            onBackToLogin={handleBackToLogin}
          />
        );
      
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onBackToLogin={handleBackToLogin}
          />
        );
      
      case 'reset-password':
        return (
          <ResetPasswordForm
            token={resetToken}
            onSuccess={handleResetSuccess}
            onBackToLogin={handleBackToLogin}
          />
        );
      
      case 'reset-success':
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-50 via-teal-50 to-ocean-100 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-md w-full space-y-8"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto h-20 w-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg"
                >
                  <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-gray-900 mb-2"
                >
                  Senha Redefinida!
                </motion.h2>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
                >
                  <p className="text-gray-600 mb-6">
                    Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.
                  </p>
                  
                  <button
                    onClick={handleBackToLogin}
                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-500 transition-all duration-200 shadow-lg"
                  >
                    Fazer Login
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {renderCurrentView()}
      </motion.div>
    </AnimatePresence>
  );
};
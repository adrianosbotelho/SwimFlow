import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import { AuthContainer } from './components/AuthContainer'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { NotificationCenter } from './components/NotificationCenter'
import { ErrorBoundary } from './components/ErrorBoundary'
import authService from './services/authService'
import { errorLogger } from './utils/errorLogger'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const isAuthenticated = authService.isAuthenticated()
    if (isAuthenticated) {
      setIsLoggedIn(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  const handleError = (error: Error, errorInfo: any) => {
    errorLogger.logComponentError(error, 'App', { errorInfo });
  }

  if (isLoading) {
    return (
      <ErrorBoundary onError={handleError}>
        <ThemeProvider>
          <NotificationProvider>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center transition-colors duration-300">
              <div className="flex flex-col items-center space-y-4">
                <div className="loading-spinner w-12 h-12"></div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando SwimFlow...</p>
              </div>
            </div>
            <NotificationCenter />
          </NotificationProvider>
        </ThemeProvider>
      </ErrorBoundary>
    )
  }

  if (!isLoggedIn) {
    return (
      <ErrorBoundary onError={handleError}>
        <ThemeProvider>
          <NotificationProvider>
            <AuthContainer onLoginSuccess={handleLogin} />
            <NotificationCenter />
          </NotificationProvider>
        </ThemeProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary onError={handleError}>
      <ThemeProvider>
        <NotificationProvider>
          <Dashboard onLogout={handleLogout} />
          <NotificationCenter />
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
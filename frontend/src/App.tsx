import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import ApiTest from './components/ApiTest'
import DevLogin from './components/DevLogin'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 flex items-center justify-center transition-colors duration-300">
          <div className="flex flex-col items-center space-y-4">
            <div className="loading-spinner w-12 h-12"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando SwimFlow...</p>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  if (!isLoggedIn) {
    return (
      <ThemeProvider>
        <DevLogin onLogin={handleLogin} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 transition-colors duration-300">
        <div className="container mx-auto px-4 py-4">
          <ApiTest />
        </div>
        <Dashboard />
      </div>
    </ThemeProvider>
  )
}

export default App
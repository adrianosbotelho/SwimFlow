import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import ApiTest from './components/ApiTest'
import DevLogin from './components/DevLogin'

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
      <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-600"></div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <DevLogin onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-50 to-teal-50">
      <div className="container mx-auto px-4 py-4">
        <ApiTest />
      </div>
      <Dashboard />
    </div>
  )
}

export default App
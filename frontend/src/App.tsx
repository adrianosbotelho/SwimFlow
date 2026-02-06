import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthContainer } from './components/AuthContainer'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { NotificationCenter } from './components/NotificationCenter'
import { ErrorBoundary } from './components/ErrorBoundary'
import authService from './services/authService'
import { errorLogger } from './utils/errorLogger'
import { AppLayout } from './layouts/AppLayout'

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage }))
)
const StudentsPage = lazy(() =>
  import('./pages/StudentsPage').then((module) => ({ default: module.StudentsPage }))
)
const ClassesPage = lazy(() =>
  import('./pages/ClassesPage').then((module) => ({ default: module.ClassesPage }))
)
const PoolsPage = lazy(() =>
  import('./pages/PoolsPage').then((module) => ({ default: module.PoolsPage }))
)
const TrainingsPage = lazy(() =>
  import('./pages/TrainingsPage').then((module) => ({ default: module.TrainingsPage }))
)
const EvaluationsPage = lazy(() =>
  import('./pages/EvaluationsPage').then((module) => ({ default: module.EvaluationsPage }))
)
const ProfessorsPage = lazy(() =>
  import('./pages/ProfessorsPage').then((module) => ({ default: module.ProfessorsPage }))
)
const ProfilePage = lazy(() =>
  import('./components/ProfilePage').then((module) => ({ default: module.ProfilePage }))
)

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
    errorLogger.logComponentError(error, 'App', { errorInfo })
  }

  if (isLoading) {
    return (
      <ErrorBoundary onError={handleError}>
        <ThemeProvider>
          <NotificationProvider>
            <div className="min-h-screen flex items-center justify-center transition-colors duration-300">
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
          <BrowserRouter>
            <Suspense
              fallback={
                <div className="min-h-[60vh] flex items-center justify-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="loading-spinner w-10 h-10"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando página...</p>
                  </div>
                </div>
              }
            >
              <Routes>
                <Route element={<AppLayout onLogout={handleLogout} />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="students" element={<StudentsPage />} />
                  <Route path="professors" element={<ProfessorsPage />} />
                  <Route path="classes" element={<ClassesPage />} />
                  <Route path="pools" element={<PoolsPage />} />
                  <Route path="trainings" element={<TrainingsPage />} />
                  <Route path="evaluations" element={<EvaluationsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route
                    path="*"
                    element={
                      <div className="card text-center py-16">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pagina nao encontrada</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Volte para o dashboard e tente novamente.</p>
                      </div>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
          <NotificationCenter />
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App

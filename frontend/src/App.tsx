import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

function AppContent() {
  const { user, isLoading, error } = useAuth()
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login')

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}
      >
        Loading...
      </div>
    )
  }

  if (error && !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--danger)' }}
      >
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Connection Error</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (authPage === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthPage('login')} />
    }
    return <LoginPage onSwitchToRegister={() => setAuthPage('register')} />
  }

  return <AppLayout />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

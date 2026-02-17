import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { Toaster } from '@/components/ui/sonner'

function AppContent() {
  const { user, isLoading, error } = useAuth()
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2 text-destructive">Connection Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
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
      <Toaster richColors position="bottom-right" />
    </AuthProvider>
  )
}

export default App

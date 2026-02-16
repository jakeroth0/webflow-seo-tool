import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { HealthStatus } from '../types'
import { api, ApiError } from '../api/client'

interface User {
  user_id: string
  email: string
  display_name: string
  role: 'admin' | 'user'
  is_active: boolean
  created_at: string
}

interface AuthState {
  user: User | null
  health: HealthStatus | null
  isLoading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check health + try to restore session on mount
  useEffect(() => {
    const init = async () => {
      try {
        const h = await api.get<HealthStatus>('/health')
        setHealth(h)
      } catch {
        setError('Backend not reachable. Start it with: docker compose up --build')
        setIsLoading(false)
        return
      }

      // Try to restore session via /auth/me
      try {
        const me = await api.get<User>('/api/v1/auth/me')
        setUser(me)
      } catch {
        // Not logged in — that's fine
      }

      setIsLoading(false)
    }
    init()
  }, [])

  // Listen for 401 events from the API client
  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('auth:unauthorized', handler)
    return () => window.removeEventListener('auth:unauthorized', handler)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      const u = await api.post<User>('/api/v1/auth/login', { email, password })
      setUser(u)
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = (() => {
          try { return JSON.parse(err.message)?.detail } catch { return null }
        })()
        throw new Error(detail || 'Login failed')
      }
      throw err
    }
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    setError(null)
    try {
      const u = await api.post<User>('/api/v1/auth/register', {
        email,
        password,
        display_name: displayName,
      })
      setUser(u)
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = (() => {
          try { return JSON.parse(err.message)?.detail } catch { return null }
        })()
        throw new Error(detail || 'Registration failed')
      }
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/v1/auth/logout')
    } catch {
      // Ignore — clear local state regardless
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, health, isLoading, error, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export type { User }

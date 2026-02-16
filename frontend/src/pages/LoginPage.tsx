import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onSwitchToRegister: () => void
}

export function LoginPage({ onSwitchToRegister }: Props) {
  const { login, health, error: authError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        className="w-full max-w-sm rounded-lg p-8"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <h1
          className="text-2xl font-bold text-center mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Webflow SEO Tool
        </h1>
        <p
          className="text-sm text-center mb-6"
          style={{ color: 'var(--text-muted)' }}
        >
          Sign in to manage your CMS alt text
        </p>

        {authError && (
          <div
            className="rounded-md p-3 mb-4 text-sm"
            style={{ backgroundColor: 'rgba(242, 63, 67, 0.1)', color: 'var(--danger)' }}
          >
            {authError}
          </div>
        )}

        {health && (
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--success)' }}
            />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              API connected
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-xs font-semibold mb-1.5 uppercase"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
          </div>

          <div className="mb-6">
            <label
              className="block text-xs font-semibold mb-1.5 uppercase"
              style={{ color: 'var(--text-secondary)' }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
          </div>

          {error && (
            <div
              className="rounded-md p-3 mb-4 text-sm"
              style={{ backgroundColor: 'rgba(242, 63, 67, 0.1)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded font-medium text-sm transition-colors"
            style={{
              backgroundColor: loading ? 'var(--accent-hover)' : 'var(--accent)',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p
          className="text-sm text-center mt-4"
          style={{ color: 'var(--text-muted)' }}
        >
          Need an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="font-medium hover:underline"
            style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  )
}

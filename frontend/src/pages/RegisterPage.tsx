import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onSwitchToLogin: () => void
}

export function RegisterPage({ onSwitchToLogin }: Props) {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await register(email, password, displayName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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
          Create Account
        </h1>
        <p
          className="text-sm text-center mb-6"
          style={{ color: 'var(--text-muted)' }}
        >
          First account becomes admin
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-xs font-semibold mb-1.5 uppercase"
              style={{ color: 'var(--text-secondary)' }}
            >
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
          </div>

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

          <div className="mb-4">
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

          <div className="mb-6">
            <label
              className="block text-xs font-semibold mb-1.5 uppercase"
              style={{ color: 'var(--text-secondary)' }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p
          className="text-sm text-center mt-4"
          style={{ color: 'var(--text-muted)' }}
        >
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-medium hover:underline"
            style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

import { useAuth } from '../contexts/AuthContext'

export function Header() {
  const { health, error, user, logout } = useAuth()

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
      }}
    >
      <div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Webflow SEO Alt Text Tool
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Generate and apply SEO-friendly alt text for your CMS images
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Health badge */}
        {health && (
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: 'rgba(35, 165, 89, 0.15)', color: 'var(--success)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full mr-1.5"
              style={{ backgroundColor: 'var(--success)' }}
            />
            API {health.status}
          </span>
        )}
        {error && (
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: 'rgba(242, 63, 67, 0.15)', color: 'var(--danger)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full mr-1.5"
              style={{ backgroundColor: 'var(--danger)' }}
            />
            API offline
          </span>
        )}

        {/* User badge + logout */}
        {user && (
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
            >
              <span className="font-medium">{user.display_name}</span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold"
                style={{
                  backgroundColor: user.role === 'admin' ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                }}
              >
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--danger)'
                e.currentTarget.style.borderColor = 'var(--danger)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

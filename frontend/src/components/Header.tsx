import { useAuth } from '../contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function Header({ onSettings }: { onSettings?: () => void }) {
  const { health, error, user, logout } = useAuth()

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b bg-card">
      <div>
        <h1 className="text-lg font-bold text-foreground">
          Webflow SEO Alt Text Tool
        </h1>
        <p className="text-xs text-muted-foreground">
          Generate and apply SEO-friendly alt text for your CMS images
        </p>
      </div>

      <div className="flex items-center gap-3">
        {health && (
          <Badge variant="outline" className="text-green-500 border-green-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
            API {health.status}
          </Badge>
        )}
        {error && (
          <Badge variant="destructive">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground mr-1.5" />
            API offline
          </Badge>
        )}

        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs bg-muted text-muted-foreground">
              <span className="font-medium">{user.display_name}</span>
              <Badge variant="secondary" className="text-[10px] uppercase">
                {user.role}
              </Badge>
            </div>
            {user.role === 'admin' && onSettings && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSettings}
                className="text-xs"
              >
                Settings
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-xs hover:text-destructive hover:border-destructive"
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}

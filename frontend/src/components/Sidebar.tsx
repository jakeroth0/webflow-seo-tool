import { Button } from '@/components/ui/button'
import { SidebarTable } from './SidebarTable'
import type { CMSItem } from '../types'

interface SidebarProps {
  items: CMSItem[]
  loading: boolean
  selectedItems: Set<string>
  onLoadItems: () => void
  onToggleItem: (id: string) => void
}

export function Sidebar({
  items,
  loading,
  selectedItems,
  onLoadItems,
  onToggleItem,
}: SidebarProps) {
  return (
    <aside className="w-[280px] md:w-[320px] flex flex-col border-r bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-sm font-semibold">Webflow Projects</h2>
        <Button onClick={onLoadItems} disabled={loading} size="sm">
          {loading ? 'Loading...' : 'Load'}
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading projects...
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Click "Load" to fetch your Webflow collections
          </div>
        ) : (
          <SidebarTable
            items={items}
            selectedItems={selectedItems}
            onToggleItem={onToggleItem}
          />
        )}
      </div>
    </aside>
  )
}

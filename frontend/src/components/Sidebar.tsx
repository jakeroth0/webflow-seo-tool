import { Button } from '@/components/ui/button'
import { SidebarTable } from './SidebarTable'
import type { CMSItem } from '../types'

interface SidebarProps {
  items: CMSItem[]
  loading: boolean
  selectedItems: Set<string>
  isOpen: boolean
  onClose: () => void
  onLoadItems: () => void
  onToggleItem: (id: string) => void
}

export function Sidebar({
  items,
  loading,
  selectedItems,
  isOpen,
  onClose,
  onLoadItems,
  onToggleItem,
}: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          // Base layout
          'flex flex-col border-r bg-card',
          // Mobile: fixed overlay, slides in/out
          'fixed inset-y-0 left-0 z-40 w-[300px]',
          'transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: static, always visible, reset transforms
          'md:relative md:translate-x-0 md:w-[280px] lg:w-[320px]',
        ].join(' ')}
      >
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
              onToggleItem={(id) => {
                onToggleItem(id)
                // Close drawer on mobile after selecting
                if (window.innerWidth < 768) onClose()
              }}
            />
          )}
        </div>
      </aside>
    </>
  )
}

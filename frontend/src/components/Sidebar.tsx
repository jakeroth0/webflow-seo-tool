import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CMSItem } from '../types'

interface SidebarProps {
  items: CMSItem[]
  loading: boolean
  selectedItems: Set<string>
  onLoadItems: () => void
  onToggleItem: (id: string) => void
  onToggleSelectAll: () => void
}

export function Sidebar({
  items,
  loading,
  selectedItems,
  onLoadItems,
  onToggleItem,
  onToggleSelectAll,
}: SidebarProps) {
  const allSelected = items.length > 0 && selectedItems.size === items.length

  return (
    <aside className="w-[280px] md:w-[320px] flex flex-col border-r" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--bg-app)' }}>
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 shadow-sm shrink-0">
        <h1 className="text-base font-bold truncate" style={{ color: 'var(--text-header)' }}>
          Webflow Projects
        </h1>
        <Button
          onClick={onLoadItems}
          disabled={loading}
          size="sm"
          className="h-7 px-2 text-[11px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
          }}
        >
          {loading ? 'Loading...' : 'Load'}
        </Button>
      </header>

      {/* Search placeholder */}
      <div className="px-3 py-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
            disabled
            className="w-full text-xs px-2 py-1.5 rounded outline-none placeholder:opacity-70 transition-all focus:ring-1 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-main)',
              '--tw-ring-color': 'var(--accent-primary)',
            } as React.CSSProperties}
          />
          <div className="absolute right-2 top-1.5 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
            <Search className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Project count + Select All */}
      <div className="px-4 py-2 flex justify-between items-center text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        <span>{items.length} Collections</span>
        {items.length > 0 && (
          <button
            onClick={onToggleSelectAll}
            className="transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto pt-2 pb-10">
        {loading && items.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>
            Loading projects...
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>
            Click "Load" to fetch your Webflow collections
          </div>
        ) : (
          items.map((item) => {
            const isSelected = selectedItems.has(item.id)

            return (
              <div
                key={item.id}
                onClick={() => onToggleItem(item.id)}
                className="group flex items-center px-2 py-1.5 mx-2 mb-0.5 rounded cursor-pointer transition-colors duration-150"
                style={{
                  backgroundColor: isSelected ? 'var(--bg-selected)' : 'transparent',
                  color: isSelected ? 'white' : 'var(--text-muted)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                    e.currentTarget.style.color = 'var(--text-main)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }
                }}
              >
                {/* Checkbox */}
                <div
                  className="w-4 h-4 rounded flex items-center justify-center mr-2 border transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-input)',
                    borderColor: isSelected ? 'var(--accent-primary)' : '#4E5058',
                  }}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Project info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-70" style={{ color: 'var(--text-muted)' }}>
                    {item.images.length} items
                  </div>
                </div>

                {/* Chevron */}
                <div
                  className="transition-opacity duration-150 ml-1"
                  style={{
                    opacity: isSelected ? 1 : 0,
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* User footer */}
      <div className="h-14 px-2 flex items-center justify-between shrink-0" style={{ backgroundColor: '#232428' }}>
        <div
          className="flex items-center gap-2 px-1 py-1 rounded cursor-pointer group"
          style={{ transition: 'background-color 150ms' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3F4147'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: 'var(--accent-primary)' }}>
            WF
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate leading-tight" style={{ color: 'var(--text-header)' }}>
              Webflow API
            </span>
            <span className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
              Connected
            </span>
          </div>
        </div>
        <button
          className="p-1.5 rounded transition-colors"
          style={{ color: '#B5BAC1' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-main)'
            e.currentTarget.style.backgroundColor = '#3F4147'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#B5BAC1'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </aside>
  )
}

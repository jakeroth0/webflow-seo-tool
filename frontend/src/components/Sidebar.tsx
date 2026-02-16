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
    <aside
      className="flex flex-col border-r"
      style={{
        width: '280px',
        minWidth: '280px',
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Sidebar header */}
      <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Projects
          </h2>
          <button
            onClick={onLoadItems}
            disabled={loading}
            className="px-3 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'white',
            }}
            onMouseEnter={(e) =>
              !loading && (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
          >
            {loading ? 'Loading...' : 'Load'}
          </button>
        </div>

        {/* Select All */}
        {items.length > 0 && (
          <label
            className="flex items-center gap-2 cursor-pointer text-xs py-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleSelectAll}
              className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
            />
            Select All ({items.length})
          </label>
        )}
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {loading ? 'Loading projects...' : 'Click "Load" to fetch projects'}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {items.map((item) => {
              const isSelected = selectedItems.has(item.id)
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'rgba(88, 101, 242, 0.1)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleItem(item.id)}
                    className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm truncate"
                      style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {item.name}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {item.images.length} images
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}

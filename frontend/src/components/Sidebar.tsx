import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
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
    <aside className="w-[280px] min-w-[280px] h-full bg-card border-r border-border/40 flex flex-col">
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Projects</h2>
          <Button
            onClick={onLoadItems}
            disabled={loading}
            size="sm"
            className="h-7 px-3 text-xs"
          >
            {loading ? 'Loading...' : 'Load Items'}
          </Button>
        </div>

        {/* Select All */}
        {items.length > 0 && (
          <>
            <Separator className="bg-border/40" />
            <label className="flex items-center gap-2 cursor-pointer group py-1">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Select All ({items.length})
              </span>
            </label>
          </>
        )}
      </div>

      <Separator className="bg-border/40" />

      {/* Project List */}
      <ScrollArea className="flex-1">
        {loading && items.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4 bg-muted/20" />
                <Skeleton className="h-3 w-1/2 bg-muted/10" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-muted-foreground">
              Click "Load Items" to fetch your Webflow projects
            </p>
          </div>
        ) : (
          <div className="py-1">
            {items.map((item) => {
              const isSelected = selectedItems.has(item.id)
              return (
                <label
                  key={item.id}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 cursor-pointer
                    transition-colors duration-150 relative
                    ${isSelected ? 'bg-primary/10' : 'hover:bg-accent/5'}
                  `}
                >
                  {/* Discord-style left border indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r" />
                  )}

                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleItem(item.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate transition-colors ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {item.images.length} {item.images.length === 1 ? 'image' : 'images'}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </aside>
  )
}

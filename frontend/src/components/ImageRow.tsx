import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ImageRowProps {
  imageKey: string
  imageUrl: string
  fieldName: string
  itemName: string
  currentAltText: string
  displayText: string
  hasDraft: boolean
  hasGenerated: boolean
  isOptedIn: boolean
  onToggleOptIn: () => void
  onTextChange: (text: string) => void
  onAcceptSuggestion: () => void
}

export function ImageRow({
  imageUrl,
  fieldName,
  itemName,
  currentAltText,
  displayText,
  hasDraft,
  hasGenerated,
  isOptedIn,
  onToggleOptIn,
  onTextChange,
  onAcceptSuggestion,
}: ImageRowProps) {
  const charCount = displayText.length
  const isOverLimit = charCount > 125

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 transition-colors hover:bg-muted/50">
      {/* Toggle Switch */}
      <div className="flex items-start pt-1">
        <button
          onClick={onToggleOptIn}
          className={`
            w-10 h-5 rounded-full relative transition-colors duration-200
            ${isOptedIn ? 'bg-green-500' : 'bg-muted'}
          `}
          aria-label={isOptedIn ? 'Exclude image' : 'Include image'}
        >
          <div
            className={`
              absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200
              ${isOptedIn ? 'left-[22px]' : 'left-0.5'}
            `}
          />
        </button>
      </div>

      {/* Thumbnail */}
      <div className="shrink-0">
        <img
          src={imageUrl}
          alt="Preview"
          className="w-20 h-20 rounded object-cover border bg-muted"
        />
      </div>

      {/* Info & Current Alt */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {fieldName}
          </span>
          <span className="text-xs text-muted-foreground">
            in {itemName}
          </span>
        </div>

        <div className="text-[11px] font-bold uppercase tracking-wider mb-1 text-muted-foreground">
          Current Alt Text
        </div>
        <div className="p-2 rounded border text-xs leading-relaxed break-words bg-muted text-foreground">
          {currentAltText || <span className="italic opacity-50">Empty Alt Text</span>}
        </div>
      </div>

      {/* New Alt Text Input */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            New SEO Alt Text
          </label>
          <span
            className={`text-[10px] font-bold ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {charCount}/125
          </span>
        </div>

        <div className="relative group">
          <Textarea
            value={displayText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Describe the image context for SEO..."
            className={`h-20 text-xs resize-none ${isOverLimit ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />

          {hasGenerated && !hasDraft && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAcceptSuggestion}
              className="absolute bottom-2 right-2 h-7 w-7 hover:bg-accent hover:text-accent-foreground"
              title="Accept AI suggestion"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

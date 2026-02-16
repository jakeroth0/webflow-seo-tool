import { Sparkles } from 'lucide-react'

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
    <div className="flex flex-col md:flex-row gap-4 p-4 border-b transition-colors hover:bg-[var(--bg-hover)]" style={{ borderColor: 'var(--bg-muted)' }}>
      {/* Toggle Switch */}
      <div className="flex items-start pt-1">
        <button
          onClick={onToggleOptIn}
          className={`
            w-10 h-5 rounded-full relative transition-colors duration-200
            ${isOptedIn ? 'bg-[var(--success)]' : 'bg-[#4E5058]'}
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
          className="w-20 h-20 rounded object-cover border"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--bg-muted)'
          }}
        />
      </div>

      {/* Info & Current Alt */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-header)' }}>
            {fieldName}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            in {itemName}
          </span>
        </div>

        <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
          Current Alt Text
        </div>
        <div
          className="p-2 rounded border text-xs leading-relaxed break-words"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--bg-muted)',
            color: 'var(--text-main)',
          }}
        >
          {currentAltText || <span className="italic opacity-50">Empty Alt Text</span>}
        </div>
      </div>

      {/* New Alt Text Input */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            New SEO Alt Text
          </label>
          <span
            className="text-[10px] font-bold"
            style={{ color: isOverLimit ? 'var(--danger)' : 'var(--text-muted)' }}
          >
            {charCount}/125
          </span>
        </div>

        <div className="relative group">
          <textarea
            value={displayText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Describe the image context for SEO..."
            className={`
              w-full h-20 p-2.5 rounded border outline-none text-xs resize-none transition-all
              ${isOverLimit ? 'border-[var(--danger)] focus:border-[var(--danger)]' : 'border-transparent focus:border-[var(--accent-primary)]'}
            `}
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-main)',
            }}
          />

          {hasGenerated && !hasDraft && (
            <button
              onClick={onAcceptSuggestion}
              className="absolute bottom-2 right-2 p-1.5 rounded transition-colors"
              style={{
                backgroundColor: 'var(--bg-muted)',
                color: '#B5BAC1',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-selected)'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-muted)'
                e.currentTarget.style.color = '#B5BAC1'
              }}
              title="Accept AI suggestion"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

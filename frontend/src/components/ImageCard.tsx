interface ImageCardProps {
  imageKey: string
  imageUrl: string | null
  fieldName: string
  itemName: string
  currentAltText: string | null
  displayText: string
  hasDraft: boolean
  hasGenerated: boolean
  isOptedIn: boolean
  onToggleOptIn: () => void
  onTextChange: (text: string) => void
  onAcceptSuggestion: () => void
}

export function ImageCard({
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
}: ImageCardProps) {
  const charCount = displayText.length
  const isOverLimit = charCount > 125

  return (
    <div
      className="rounded-lg overflow-hidden border transition-colors"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: isOptedIn ? 'var(--accent)' : 'var(--border)',
      }}
    >
      {/* Thumbnail */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={currentAltText || 'No alt text'}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div
          className="w-full h-40 flex items-center justify-center text-xs"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
        >
          No image
        </div>
      )}

      <div className="p-3 space-y-2.5">
        {/* Header: field name + opt-in checkbox */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {fieldName}
            </p>
            <p className="text-[10px] truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>
              {itemName}
            </p>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Include
            </span>
            <input
              type="checkbox"
              checked={isOptedIn}
              onChange={onToggleOptIn}
              className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
            />
          </label>
        </div>

        {/* Current alt text */}
        <div>
          <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            Current Alt Text
          </p>
          {currentAltText ? (
            <p
              className="text-xs p-2 rounded"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
            >
              {currentAltText}
            </p>
          ) : (
            <p
              className="text-xs p-2 rounded italic"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--danger)' }}
            >
              No alt text set
            </p>
          )}
        </div>

        {/* New alt text */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
              New Alt Text
            </p>
            <div className="flex items-center gap-2">
              {hasDraft && hasGenerated && (
                <button
                  onClick={onAcceptSuggestion}
                  className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                  title="Replace your draft with the AI suggestion"
                >
                  Accept AI
                </button>
              )}
              {hasDraft && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(240, 178, 50, 0.2)', color: 'var(--warning)' }}
                >
                  draft
                </span>
              )}
              {hasGenerated && !hasDraft && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(35, 165, 89, 0.2)', color: 'var(--success)' }}
                >
                  AI
                </span>
              )}
            </div>
          </div>
          <textarea
            value={displayText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={isOptedIn ? 'Type alt text or generate with AI...' : 'Check "Include" to enable'}
            disabled={!isOptedIn}
            className="w-full text-xs p-2 rounded border outline-none resize-none transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            rows={3}
            maxLength={125}
          />
          <div className="flex items-center justify-end mt-0.5">
            <span
              className="text-[10px]"
              style={{ color: isOverLimit ? 'var(--danger)' : 'var(--text-muted)' }}
            >
              {charCount}/125
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

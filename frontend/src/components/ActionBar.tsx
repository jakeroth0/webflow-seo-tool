interface ActionBarProps {
  selectedImageCount: number
  generating: boolean
  applying: boolean
  hasProposals: boolean
  onGenerate: () => void
  onApply: () => void
}

export function ActionBar({
  selectedImageCount,
  generating,
  applying,
  hasProposals,
  onGenerate,
  onApply,
}: ActionBarProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <button
        onClick={onGenerate}
        disabled={generating || selectedImageCount === 0}
        className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: 'var(--success)', color: 'white' }}
        onMouseEnter={(e) => {
          if (!e.currentTarget.disabled)
            e.currentTarget.style.backgroundColor = '#1e8e4a'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--success)'
        }}
      >
        {generating ? 'Generating...' : `Generate Alt Text (${selectedImageCount})`}
      </button>

      {hasProposals && (
        <button
          onClick={onApply}
          disabled={applying || selectedImageCount === 0}
          className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled)
              e.currentTarget.style.backgroundColor = 'var(--accent-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent)'
          }}
        >
          {applying ? 'Applying...' : `Apply Selected (${selectedImageCount})`}
        </button>
      )}

      {selectedImageCount === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Check "Include" on images to enable generation and apply
        </p>
      )}
    </div>
  )
}

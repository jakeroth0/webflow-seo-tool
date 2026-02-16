import { Upload } from 'lucide-react'
import { ImageRow } from './ImageRow'
import { ProgressBar } from './ProgressBar'
import type { JobResponse, ApplyResult, ImageWithAltText } from '../types'

interface VisibleImage extends ImageWithAltText {
  itemId: string
  itemName: string
  imageKey: string
}

interface MainPanelProps {
  visibleImages: VisibleImage[]
  selectedImages: Set<string>
  generating: boolean
  applying: boolean
  currentJob: JobResponse | null
  applyResults: ApplyResult | null
  hasProposals: boolean
  getDisplayText: (imageKey: string) => string
  hasDraft: (imageKey: string) => boolean
  hasGenerated: (imageKey: string) => boolean
  onToggleOptIn: (imageKey: string) => void
  onTextChange: (imageKey: string, text: string) => void
  onAcceptSuggestion: (imageKey: string) => void
  onGenerate: () => void
  onApply: () => void
}

export function MainPanel({
  visibleImages,
  selectedImages,
  generating,
  applying,
  currentJob,
  applyResults,
  hasProposals,
  getDisplayText,
  hasDraft,
  hasGenerated,
  onToggleOptIn,
  onTextChange,
  onAcceptSuggestion,
  onGenerate,
  onApply,
}: MainPanelProps) {
  return (
    <main className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Header with actions */}
      <header className="h-12 flex items-center justify-between px-4 shadow-sm shrink-0" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: 'var(--text-muted)' }}>#</span>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-header)' }}>
            Image Optimizer
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGenerate}
            disabled={generating || selectedImages.size === 0}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all"
            style={{
              backgroundColor: generating || selectedImages.size === 0 ? '#404249' : '#23A559',
              color: 'white',
              cursor: generating || selectedImages.size === 0 ? 'not-allowed' : 'pointer',
              opacity: generating || selectedImages.size === 0 ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!generating && selectedImages.size > 0) {
                e.currentTarget.style.backgroundColor = '#1a8044'
              }
            }}
            onMouseLeave={(e) => {
              if (!generating && selectedImages.size > 0) {
                e.currentTarget.style.backgroundColor = '#23A559'
              }
            }}
          >
            {generating ? (
              <>
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>Generate Alt Text ({selectedImages.size})</>
            )}
          </button>

          {hasProposals && (
            <button
              onClick={onApply}
              disabled={applying || selectedImages.size === 0}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold text-white transition-all shadow-lg"
              style={{
                backgroundColor: applying || selectedImages.size === 0 ? '#404249' : 'var(--accent-primary)',
                cursor: applying || selectedImages.size === 0 ? 'not-allowed' : 'pointer',
                opacity: applying || selectedImages.size === 0 ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!applying && selectedImages.size > 0) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)'
                }
              }}
              onMouseLeave={(e) => {
                if (!applying && selectedImages.size > 0) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary)'
                }
              }}
            >
              {applying ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Sync to Webflow
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {currentJob && (
        <div className="px-4 py-2">
          <ProgressBar job={currentJob} />
        </div>
      )}

      {/* Apply results */}
      {applyResults && applyResults.failure_count > 0 && (
        <div className="px-4 py-2">
          <div
            className="p-3 rounded text-sm"
            style={{ backgroundColor: 'rgba(240, 178, 50, 0.1)', color: 'var(--warning)' }}
          >
            <p className="font-medium mb-1">
              Applied {applyResults.success_count} / {applyResults.success_count + applyResults.failure_count} updates
            </p>
            {applyResults.results
              .filter((r) => !r.success)
              .map((result, idx) => (
                <p key={idx} className="text-xs">
                  Item {result.item_id}: {result.error}
                </p>
              ))}
          </div>
        </div>
      )}

      {applyResults && applyResults.failure_count === 0 && (
        <div className="px-4 py-2">
          <div
            className="p-3 rounded text-sm"
            style={{ backgroundColor: 'rgba(35, 165, 89, 0.1)', color: 'var(--success)' }}
          >
            Successfully applied {applyResults.success_count} alt text updates!
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {visibleImages.length > 0 ? (
          <>
            {/* Info bar */}
            <div className="px-4 py-3 border-b" style={{ backgroundColor: 'rgba(43, 45, 49, 0.3)', borderColor: 'var(--bg-muted)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Showing <span className="font-bold" style={{ color: 'var(--text-header)' }}>{visibleImages.length} images</span> from selected collections.
              </p>
            </div>

            {/* Image rows */}
            <div className="divide-y" style={{ '--tw-divide-opacity': '1', borderColor: 'var(--bg-muted)' } as React.CSSProperties}>
              {visibleImages.map((image) => (
                <ImageRow
                  key={image.imageKey}
                  imageKey={image.imageKey}
                  imageUrl={image.image_url || ''}
                  fieldName={image.field_name}
                  itemName={image.itemName}
                  currentAltText={image.current_alt_text || ''}
                  displayText={getDisplayText(image.imageKey)}
                  hasDraft={hasDraft(image.imageKey)}
                  hasGenerated={hasGenerated(image.imageKey)}
                  isOptedIn={selectedImages.has(image.imageKey)}
                  onToggleOptIn={() => onToggleOptIn(image.imageKey)}
                  onTextChange={(text) => onTextChange(image.imageKey, text)}
                  onAcceptSuggestion={() => onAcceptSuggestion(image.imageKey)}
                />
              ))}
            </div>

            {/* End marker */}
            <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              You've reached the end of the collection.
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-48 h-48 mb-6 relative">
              <div className="absolute inset-0 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(88, 101, 242, 0.05)' }} />
              <img
                src="https://picsum.photos/id/160/400/400"
                alt="Empty"
                className="w-full h-full object-cover rounded-full grayscale opacity-20 border-4"
                style={{ borderColor: 'var(--bg-muted)' }}
              />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-header)' }}>
              Ready to optimize?
            </h3>
            <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Select one or more collections from the sidebar to load and edit image alt text for SEO.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

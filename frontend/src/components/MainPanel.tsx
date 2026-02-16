import { ImageGrid } from './ImageGrid'
import { ActionBar } from './ActionBar'
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
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Action bar + progress */}
      <div className="p-4 space-y-3">
        <ActionBar
          selectedImageCount={selectedImages.size}
          generating={generating}
          applying={applying}
          hasProposals={hasProposals}
          onGenerate={onGenerate}
          onApply={onApply}
        />

        {currentJob && <ProgressBar job={currentJob} />}

        {/* Apply results */}
        {applyResults && applyResults.failure_count > 0 && (
          <div
            className="p-3 rounded-lg text-sm"
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
        )}

        {applyResults && applyResults.failure_count === 0 && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{ backgroundColor: 'rgba(35, 165, 89, 0.1)', color: 'var(--success)' }}
          >
            Successfully applied {applyResults.success_count} alt text updates!
          </div>
        )}
      </div>

      {/* Image grid */}
      <div className="flex-1 overflow-y-auto p-4 pt-0">
        <ImageGrid
          images={visibleImages}
          selectedImages={selectedImages}
          getDisplayText={getDisplayText}
          hasDraft={hasDraft}
          hasGenerated={hasGenerated}
          onToggleOptIn={onToggleOptIn}
          onTextChange={onTextChange}
          onAcceptSuggestion={onAcceptSuggestion}
        />
      </div>
    </main>
  )
}

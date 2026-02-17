import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <main className="flex-1 flex flex-col min-w-0 bg-background">
      {/* Header with actions */}
      <header className="h-12 flex items-center justify-between px-4 shadow-sm shrink-0 border-b">
        <h2 className="text-base font-bold text-foreground">
          Image Optimizer
        </h2>

        <div className="flex items-center gap-2">
          <Button
            onClick={onGenerate}
            disabled={generating || selectedImages.size === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            {generating ? (
              <>
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>Generate Alt Text ({selectedImages.size})</>
            )}
          </Button>

          {hasProposals && (
            <Button
              onClick={onApply}
              disabled={applying || selectedImages.size === 0}
              size="sm"
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
            </Button>
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
          <div className="p-3 rounded text-sm bg-destructive/10 text-destructive">
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
          <div className="p-3 rounded text-sm bg-green-500/10 text-green-500">
            Successfully applied {applyResults.success_count} alt text updates!
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {visibleImages.length > 0 ? (
          <>
            {/* Info bar */}
            <div className="px-4 py-3 border-b bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-bold text-foreground">{visibleImages.length} images</span> from selected collections.
              </p>
            </div>

            {/* Image rows */}
            <div className="divide-y">
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
            <div className="p-8 text-center text-xs text-muted-foreground">
              You've reached the end of the collection.
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-48 h-48 mb-6 relative">
              <div className="absolute inset-0 rounded-full animate-pulse bg-primary/5" />
              <img
                src="https://picsum.photos/id/160/400/400"
                alt="Empty"
                className="w-full h-full object-cover rounded-full grayscale opacity-20 border-4 border-muted"
              />
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">
              Ready to optimize?
            </h3>
            <p className="text-sm max-w-sm leading-relaxed text-muted-foreground">
              Select one or more collections from the sidebar to load and edit image alt text for SEO.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

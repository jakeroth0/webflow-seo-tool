import { ImageCard } from './ImageCard'
import type { ImageWithAltText } from '../types'

interface VisibleImage extends ImageWithAltText {
  itemId: string
  itemName: string
  imageKey: string
}

interface ImageGridProps {
  images: VisibleImage[]
  selectedImages: Set<string>
  getDisplayText: (imageKey: string) => string
  hasDraft: (imageKey: string) => boolean
  hasGenerated: (imageKey: string) => boolean
  onToggleOptIn: (imageKey: string) => void
  onTextChange: (imageKey: string, text: string) => void
  onAcceptSuggestion: (imageKey: string) => void
}

export function ImageGrid({
  images,
  selectedImages,
  getDisplayText,
  hasDraft,
  hasGenerated,
  onToggleOptIn,
  onTextChange,
  onAcceptSuggestion,
}: ImageGridProps) {
  if (images.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md space-y-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-foreground">No images selected</h3>
          <p className="text-xs text-muted-foreground">
            Select projects from the sidebar to view and manage their images
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {images.map((img) => (
        <ImageCard
          key={img.imageKey}
          imageKey={img.imageKey}
          imageUrl={img.image_url}
          fieldName={img.field_name}
          itemName={img.itemName}
          currentAltText={img.current_alt_text}
          displayText={getDisplayText(img.imageKey)}
          hasDraft={hasDraft(img.imageKey)}
          hasGenerated={hasGenerated(img.imageKey)}
          isOptedIn={selectedImages.has(img.imageKey)}
          onToggleOptIn={() => onToggleOptIn(img.imageKey)}
          onTextChange={(text) => onTextChange(img.imageKey, text)}
          onAcceptSuggestion={() => onAcceptSuggestion(img.imageKey)}
        />
      ))}
    </div>
  )
}

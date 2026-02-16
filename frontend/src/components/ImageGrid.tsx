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
      <div
        className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        <p className="text-sm">Select projects from the sidebar to view images</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

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
    <Card className={`overflow-hidden transition-all duration-200 ${isOptedIn ? 'ring-1 ring-primary/30' : ''}`}>
      {/* Thumbnail */}
      <div className="relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={currentAltText || 'No alt text'}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-muted/30">
            <p className="text-xs text-muted-foreground">No image</p>
          </div>
        )}

        {/* Opt-in badge overlay */}
        <div className="absolute top-2 right-2">
          <label className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md cursor-pointer hover:bg-background transition-colors">
            <span className="text-[11px] font-medium text-muted-foreground">Include</span>
            <Checkbox
              checked={isOptedIn}
              onCheckedChange={onToggleOptIn}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </label>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div>
          <p className="text-sm font-medium text-foreground">{fieldName}</p>
          <p className="text-[11px] text-muted-foreground truncate font-mono">{itemName}</p>
        </div>

        <Separator className="bg-border/40" />

        {/* Current Alt Text */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">Current Alt Text</p>
          {currentAltText ? (
            <div className="bg-muted/30 rounded-md p-2 text-xs text-foreground leading-relaxed max-h-20 overflow-y-auto">
              {currentAltText}
            </div>
          ) : (
            <div className="bg-destructive/10 rounded-md p-2 text-xs text-destructive italic">
              No alt text set
            </div>
          )}
        </div>

        {/* New Alt Text Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-muted-foreground">New Alt Text</p>
            <div className="flex items-center gap-1.5">
              {/* Draft + Generated badges */}
              {hasDraft && hasGenerated && (
                <Button
                  onClick={onAcceptSuggestion}
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-[10px] hover:bg-primary/10 hover:text-primary"
                >
                  Accept AI
                </Button>
              )}
              {hasDraft && (
                <Badge variant="outline" className="h-5 text-[10px] border-yellow-500/30 text-yellow-500 bg-yellow-500/10">
                  Draft
                </Badge>
              )}
              {hasGenerated && !hasDraft && (
                <Badge variant="outline" className="h-5 text-[10px] border-green-500/30 text-green-500 bg-green-500/10">
                  AI
                </Badge>
              )}
            </div>
          </div>

          <Textarea
            value={displayText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={isOptedIn ? 'Type alt text or generate with AI...' : 'Check "Include" to enable'}
            disabled={!isOptedIn}
            className="resize-none text-xs min-h-[72px] disabled:opacity-40 disabled:cursor-not-allowed"
            maxLength={125}
          />

          <div className="flex items-center justify-end">
            <span className={`text-[10px] font-mono ${isOverLimit ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
              {charCount}/125
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

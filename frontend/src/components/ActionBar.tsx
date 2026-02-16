import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
    <div className="flex items-center gap-3 p-4 bg-card/50 rounded-lg border border-border/40">
      <Button
        onClick={onGenerate}
        disabled={generating || selectedImageCount === 0}
        className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
      >
        {generating ? 'Generating...' : 'Generate Alt Text'}
        {!generating && selectedImageCount > 0 && (
          <Badge variant="secondary" className="ml-2 bg-white/20">
            {selectedImageCount}
          </Badge>
        )}
      </Button>

      {hasProposals && (
        <Button
          onClick={onApply}
          disabled={applying || selectedImageCount === 0}
          className="disabled:opacity-40"
        >
          {applying ? 'Applying...' : 'Apply to Webflow'}
          {!applying && selectedImageCount > 0 && (
            <Badge variant="secondary" className="ml-2 bg-white/20">
              {selectedImageCount}
            </Badge>
          )}
        </Button>
      )}

      {selectedImageCount === 0 && (
        <p className="text-xs text-muted-foreground">
          Check "Include" on images to enable actions
        </p>
      )}
    </div>
  )
}

import { useCallback, useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MainPanel } from './MainPanel'
import { SettingsPage } from '../pages/SettingsPage'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '../contexts/AuthContext'
import { useItems } from '../hooks/useItems'
import { useJobs } from '../hooks/useJobs'
import { useApply } from '../hooks/useApply'

export function AppLayout() {
  const { error, isLoading } = useAuth()
  const [view, setView] = useState<'main' | 'settings'>('main')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const {
    items,
    loading,
    selectedItems,
    selectedImages,
    visibleImages,
    loadItems,
    toggleItemSelection,
    toggleImageOptIn,
  } = useItems()

  const {
    generating,
    currentJob,
    proposals,
    generateAltText,
    updateDraftText,
    acceptSuggestion,
    getDisplayText,
    hasDraft,
    hasGenerated,
    clearJob,
  } = useJobs()

  const { applying, applyResults, applyProposals, clearResults } = useApply()

  const handleGenerate = useCallback(() => {
    generateAltText(selectedImages)
  }, [generateAltText, selectedImages])

  const handleApply = useCallback(() => {
    const updates: Array<{ item_id: string; field_name: string; alt_text: string }> = []

    for (const imageKey of selectedImages) {
      const text = getDisplayText(imageKey)
      if (text) {
        const [itemId, fieldName] = imageKey.split(':')
        updates.push({
          item_id: itemId,
          field_name: `${fieldName}-alt-text`,
          alt_text: text,
        })
      }
    }

    if (updates.length === 0) return

    applyProposals(updates, () => {
      clearJob()
      clearResults()
      loadItems()
    })
  }, [selectedImages, getDisplayText, applyProposals, clearJob, clearResults, loadItems])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Connecting to API...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium mb-2 text-destructive">
              Cannot connect to backend
            </p>
            <p className="text-xs text-muted-foreground">
              {error}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        onSettings={() => setView(view === 'settings' ? 'main' : 'settings')}
        sidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen((o) => !o)}
      />
      {view === 'settings' ? (
        <SettingsPage onBack={() => setView('main')} />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            items={items}
            loading={loading}
            selectedItems={selectedItems}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onLoadItems={loadItems}
            onToggleItem={toggleItemSelection}
          />
          <MainPanel
            visibleImages={visibleImages}
            selectedImages={selectedImages}
            generating={generating}
            applying={applying}
            currentJob={currentJob}
            applyResults={applyResults}
            hasProposals={proposals.length > 0}
            getDisplayText={getDisplayText}
            hasDraft={hasDraft}
            hasGenerated={hasGenerated}
            onToggleOptIn={toggleImageOptIn}
            onTextChange={updateDraftText}
            onAcceptSuggestion={acceptSuggestion}
            onGenerate={handleGenerate}
            onApply={handleApply}
          />
        </div>
      )}
    </div>
  )
}

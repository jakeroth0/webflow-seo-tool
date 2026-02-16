import { useCallback } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MainPanel } from './MainPanel'
import { useAuth } from '../contexts/AuthContext'
import { useItems } from '../hooks/useItems'
import { useJobs } from '../hooks/useJobs'
import { useApply } from '../hooks/useApply'

export function AppLayout() {
  const { error, isLoading } = useAuth()

  const {
    items,
    loading,
    selectedItems,
    selectedImages,
    visibleImages,
    loadItems,
    toggleItemSelection,
    toggleSelectAll,
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
    // Build updates from opted-in images that have text
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mx-auto mb-3"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Connecting to API...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="p-6 rounded-lg max-w-md text-center"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--danger)' }}>
            Cannot connect to backend
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          items={items}
          loading={loading}
          selectedItems={selectedItems}
          onLoadItems={loadItems}
          onToggleItem={toggleItemSelection}
          onToggleSelectAll={toggleSelectAll}
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
    </div>
  )
}

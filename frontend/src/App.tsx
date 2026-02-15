import { useEffect, useState } from 'react'

interface HealthStatus {
  status: string
  version: string
  environment: string
  service: string
}

interface ImageWithAltText {
  field_name: string
  image_url: string | null
  current_alt_text: string | null
  file_id: string | null
}

interface CMSItem {
  id: string
  name: string
  slug: string
  images: ImageWithAltText[]
}

interface CMSItemsResponse {
  items: CMSItem[]
  total: number
  has_more: boolean
}

interface JobResponse {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: {
    processed: number
    total: number
    percentage: number
  }
  estimated_duration_seconds?: number
}

interface Proposal {
  proposal_id: string
  job_id: string
  item_id: string
  field_name: string
  proposed_alt_text: string
  confidence_score: number
  model_used: string
  generated_at: string
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<CMSItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [currentJob, setCurrentJob] = useState<JobResponse | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [editedProposals, setEditedProposals] = useState<Map<string, string>>(new Map())
  const [applying, setApplying] = useState(false)
  const [applyResults, setApplyResults] = useState<any>(null)

  useEffect(() => {
    fetch('/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch(() =>
        setError(
          'Backend not reachable. Start it with: uvicorn app.main:app --reload'
        )
      )
  }, [])

  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/items?limit=5')
      const data: CMSItemsResponse = await res.json()
      setItems(data.items)
    } catch (err) {
      console.error('Failed to load items:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      newSelection.add(itemId)
    }
    setSelectedItems(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map((item) => item.id)))
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60 // Poll for up to 5 minutes
    let attempts = 0

    const poll = async () => {
      try {
        const res = await fetch(`/api/v1/jobs/${jobId}`)
        const job: JobResponse = await res.json()
        setCurrentJob(job)

        if (job.status === 'completed') {
          // Fetch proposals
          const proposalsRes = await fetch(`/api/v1/jobs/${jobId}/proposals`)
          const proposalsData = await proposalsRes.json()
          setProposals(proposalsData.proposals)
          setGenerating(false)
          return
        } else if (job.status === 'failed') {
          setGenerating(false)
          alert('Job failed. Please check the logs.')
          return
        }

        // Continue polling if still processing
        if (attempts < maxAttempts && (job.status === 'queued' || job.status === 'processing')) {
          attempts++
          setTimeout(poll, 5000) // Poll every 5 seconds
        } else {
          setGenerating(false)
        }
      } catch (err) {
        console.error('Failed to poll job status:', err)
        setGenerating(false)
      }
    }

    poll()
  }

  const generateAltText = async () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one project')
      return
    }

    setGenerating(true)
    setCurrentJob(null)
    setProposals([])
    setEditedProposals(new Map())

    try {
      const res = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_ids: Array.from(selectedItems),
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create job')
      }

      const job: JobResponse = await res.json()
      setCurrentJob(job)
      pollJobStatus(job.job_id)
    } catch (err) {
      console.error('Failed to generate alt text:', err)
      setGenerating(false)
      alert('Failed to start generation. Please try again.')
    }
  }

  const updateProposal = (proposalId: string, newText: string) => {
    const newEdited = new Map(editedProposals)
    newEdited.set(proposalId, newText)
    setEditedProposals(newEdited)
  }

  const getProposalText = (proposal: Proposal) => {
    return editedProposals.get(proposal.proposal_id) ?? proposal.proposed_alt_text
  }

  const applyProposals = async () => {
    if (proposals.length === 0) {
      alert('No proposals to apply')
      return
    }

    // Build updates array with edited text where available
    const updates = proposals.map((proposal) => ({
      item_id: proposal.item_id,
      field_name: proposal.field_name,
      alt_text: getProposalText(proposal),
    }))

    setApplying(true)
    setApplyResults(null)

    try {
      const res = await fetch('/api/v1/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      })

      if (!res.ok) {
        throw new Error('Failed to apply proposals')
      }

      const results = await res.json()
      setApplyResults(results)

      if (results.failure_count === 0) {
        alert(`Successfully applied ${results.success_count} alt text updates!`)
        // Clear proposals and selections after successful apply
        setProposals([])
        setEditedProposals(new Map())
        setSelectedItems(new Set())
        setCurrentJob(null)
        // Reload items to show updated alt text
        loadItems()
      } else {
        alert(
          `Applied ${results.success_count} updates with ${results.failure_count} failures. Check details below.`
        )
      }
    } catch (err) {
      console.error('Failed to apply proposals:', err)
      alert('Failed to apply proposals. Please try again.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Webflow SEO Alt Text Tool
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Generate and apply SEO-friendly alt text for your CMS images
              </p>
            </div>
            {health && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                API {health.status}
              </span>
            )}
            {error && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
                API offline
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-6">
            <h3 className="text-sm font-medium text-red-800">
              Cannot connect to backend
            </h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        ) : !health ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Connecting to API...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                System Status
              </h2>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-sm text-gray-500">Service</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {health.service}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Version</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {health.version}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Environment</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {health.environment}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd className="text-sm font-medium text-green-600">
                    {health.status}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Webflow CMS Projects
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={loadItems}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Loading...' : 'Load Projects'}
                  </button>
                  {items.length > 0 && (
                    <>
                      <button
                        onClick={generateAltText}
                        disabled={generating || selectedItems.size === 0}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {generating
                          ? 'Generating...'
                          : `Generate Alt Text (${selectedItems.size})`}
                      </button>
                      {proposals.length > 0 && (
                        <button
                          onClick={applyProposals}
                          disabled={applying}
                          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {applying ? 'Applying...' : `Apply All (${proposals.length})`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Job Progress */}
              {currentJob && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-blue-900">
                      {currentJob.status === 'completed'
                        ? '✓ Generation Complete'
                        : currentJob.status === 'processing'
                        ? '⏳ Processing...'
                        : '📝 Queued'}
                    </h3>
                    <span className="text-xs text-blue-700">
                      {currentJob.progress.processed} / {currentJob.progress.total} items
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentJob.progress.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Apply Results */}
              {applyResults && applyResults.failure_count > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-900 mb-2">
                    Apply Results: {applyResults.success_count} succeeded,{' '}
                    {applyResults.failure_count} failed
                  </h3>
                  <div className="space-y-2">
                    {applyResults.results
                      .filter((r: any) => !r.success)
                      .map((result: any, idx: number) => (
                        <div key={idx} className="text-xs text-yellow-800">
                          <span className="font-medium">Item {result.item_id}:</span> {result.error}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {items.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                  <p className="text-gray-400">
                    No projects loaded yet. Click "Load Projects" to fetch from
                    Webflow.
                  </p>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={selectedItems.size === items.length && items.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                      Select All ({items.length} projects)
                    </label>
                  </div>

                  <div className="space-y-6">
                    {items.map((item) => {
                      const itemProposals = proposals.filter((p) => p.item_id === item.id)
                      return (
                        <div
                          key={item.id}
                          className={`border rounded-lg p-6 transition-colors ${
                            selectedItems.has(item.id)
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="mb-4 flex items-start gap-3">
                            <input
                              type="checkbox"
                              id={`item-${item.id}`}
                              checked={selectedItems.has(item.id)}
                              onChange={() => toggleItemSelection(item.id)}
                              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`item-${item.id}`}
                                className="text-lg font-semibold text-gray-900 cursor-pointer"
                              >
                                {item.name}
                              </label>
                              <p className="text-sm text-gray-500 mt-1">
                                {item.slug} • {item.images.length} images
                                {itemProposals.length > 0 && (
                                  <span className="ml-2 text-green-600 font-medium">
                                    • {itemProposals.length} proposals ready
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {item.images.map((image) => {
                              // Find proposal for this specific image
                              // image.field_name is like '1-after', proposal.field_name is like '1-after-alt-text'
                              const proposal = itemProposals.find((p) => p.field_name === `${image.field_name}-alt-text`)
                              return (
                                <div
                                  key={image.field_name}
                                  className="border border-gray-200 rounded-lg overflow-hidden"
                                >
                                  {image.image_url && (
                                    <img
                                      src={image.image_url}
                                      alt={image.current_alt_text || 'No alt text'}
                                      className="w-full h-48 object-cover"
                                    />
                                  )}
                                  <div className="p-3 bg-white space-y-2">
                                    <p className="text-xs font-medium text-gray-700">
                                      {image.field_name}
                                    </p>

                                    {/* Current alt text */}
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 mb-1">
                                        Current:
                                      </p>
                                      {image.current_alt_text ? (
                                        <div className="text-xs text-gray-600 line-clamp-2">
                                          {image.current_alt_text}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-red-500 italic">
                                          ⚠️ No alt text
                                        </div>
                                      )}
                                    </div>

                                    {/* Proposed alt text */}
                                    {proposal && (
                                      <div className="pt-2 border-t border-gray-200">
                                        <div className="flex items-center justify-between mb-1">
                                          <p className="text-xs font-medium text-green-700">
                                            Proposed:
                                          </p>
                                          {editedProposals.has(proposal.proposal_id) && (
                                            <span className="text-xs text-orange-600 italic">
                                              edited
                                            </span>
                                          )}
                                        </div>
                                        <textarea
                                          value={getProposalText(proposal)}
                                          onChange={(e) => updateProposal(proposal.proposal_id, e.target.value)}
                                          className="w-full text-xs text-gray-900 bg-green-50 p-2 rounded border border-green-200 focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none resize-none"
                                          rows={3}
                                          maxLength={150}
                                        />
                                        <div className="flex items-center justify-between mt-1">
                                          <p className="text-xs text-gray-400">
                                            by {proposal.model_used}
                                          </p>
                                          <p className="text-xs text-gray-400">
                                            {getProposalText(proposal).length}/150
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

import { useState, useCallback, useRef, useEffect } from 'react'
import type { JobResponse, Proposal } from '../types'
import { api } from '../api/client'

export function useJobs() {
  const [generating, setGenerating] = useState(false)
  const [currentJob, setCurrentJob] = useState<JobResponse | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [draftTexts, setDraftTexts] = useState<Map<string, string>>(new Map())
  const [generatedTexts, setGeneratedTexts] = useState<Map<string, string>>(new Map())
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [])

  const pollJobStatus = useCallback(async (jobId: string) => {
    const maxAttempts = 60
    let attempts = 0

    const poll = async () => {
      try {
        const job = await api.get<JobResponse>(`/api/v1/jobs/${jobId}`)
        setCurrentJob(job)

        if (job.status === 'completed') {
          const data = await api.get<{ proposals: Proposal[] }>(
            `/api/v1/jobs/${jobId}/proposals`
          )
          setProposals(data.proposals)

          // Populate generatedTexts but never overwrite draftTexts
          setGeneratedTexts((prev) => {
            const next = new Map(prev)
            for (const p of data.proposals) {
              const key = `${p.item_id}:${p.field_name.replace('-alt-text', '')}`
              next.set(key, p.proposed_alt_text)
            }
            return next
          })

          setGenerating(false)
          return
        }

        if (job.status === 'failed') {
          setGenerating(false)
          return
        }

        if (attempts < maxAttempts) {
          attempts++
          pollRef.current = setTimeout(poll, 5000)
        } else {
          setGenerating(false)
        }
      } catch (err) {
        console.error('Failed to poll job status:', err)
        setGenerating(false)
      }
    }

    poll()
  }, [])

  const generateAltText = useCallback(
    async (selectedImages: Set<string>) => {
      if (selectedImages.size === 0) return

      // Extract unique item IDs from selected images
      const itemIds = [...new Set([...selectedImages].map((key) => key.split(':')[0]))]

      setGenerating(true)
      setCurrentJob(null)
      setProposals([])
      // Don't clear draftTexts — they persist across generations
      // Don't clear generatedTexts — only replace on new generation results

      try {
        const job = await api.post<JobResponse>('/api/v1/generate', {
          item_ids: itemIds,
        })
        setCurrentJob(job)
        pollJobStatus(job.job_id)
      } catch (err) {
        console.error('Failed to generate alt text:', err)
        setGenerating(false)
      }
    },
    [pollJobStatus]
  )

  // Update user-typed draft text for a specific image
  const updateDraftText = useCallback((imageKey: string, text: string) => {
    setDraftTexts((prev) => {
      const next = new Map(prev)
      if (text === '') {
        next.delete(imageKey)
      } else {
        next.set(imageKey, text)
      }
      return next
    })
  }, [])

  // Accept AI suggestion — copy generated text into draft
  const acceptSuggestion = useCallback((imageKey: string) => {
    setGeneratedTexts((prev) => {
      const generated = prev.get(imageKey)
      if (generated) {
        setDraftTexts((drafts) => {
          const next = new Map(drafts)
          next.set(imageKey, generated)
          return next
        })
      }
      return prev
    })
  }, [])

  // Get the display text for an image: draft > generated > empty
  const getDisplayText = useCallback(
    (imageKey: string): string => {
      return draftTexts.get(imageKey) ?? generatedTexts.get(imageKey) ?? ''
    },
    [draftTexts, generatedTexts]
  )

  // Check if an image has a user draft
  const hasDraft = useCallback(
    (imageKey: string): boolean => draftTexts.has(imageKey),
    [draftTexts]
  )

  // Check if an image has an AI-generated suggestion
  const hasGenerated = useCallback(
    (imageKey: string): boolean => generatedTexts.has(imageKey),
    [generatedTexts]
  )

  const clearJob = useCallback(() => {
    setCurrentJob(null)
    setProposals([])
    setGeneratedTexts(new Map())
  }, [])

  return {
    generating,
    currentJob,
    proposals,
    draftTexts,
    generatedTexts,
    generateAltText,
    updateDraftText,
    acceptSuggestion,
    getDisplayText,
    hasDraft,
    hasGenerated,
    clearJob,
  }
}

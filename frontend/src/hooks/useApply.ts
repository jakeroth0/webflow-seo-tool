import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { ApplyResult } from '../types'
import { api } from '../api/client'

export function useApply() {
  const [applying, setApplying] = useState(false)
  const [applyResults, setApplyResults] = useState<ApplyResult | null>(null)

  const applyProposals = useCallback(
    async (
      updates: Array<{ item_id: string; field_name: string; alt_text: string }>,
      onSuccess?: () => void
    ) => {
      if (updates.length === 0) return

      setApplying(true)
      setApplyResults(null)

      try {
        const results = await api.post<ApplyResult>('/api/v1/apply', { updates })
        setApplyResults(results)

        if (results.failure_count === 0) {
          toast.success(`Successfully synced ${results.success_count} alt text update${results.success_count === 1 ? '' : 's'} to Webflow`)
          onSuccess?.()
        } else {
          toast.error(`${results.failure_count} update${results.failure_count === 1 ? '' : 's'} failed — see details below`)
        }
      } catch (err) {
        console.error('Failed to apply proposals:', err)
      } finally {
        setApplying(false)
      }
    },
    []
  )

  const clearResults = useCallback(() => {
    setApplyResults(null)
  }, [])

  return {
    applying,
    applyResults,
    applyProposals,
    clearResults,
  }
}

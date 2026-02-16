import { useState, useCallback } from 'react'
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

        if (results.failure_count === 0 && onSuccess) {
          onSuccess()
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

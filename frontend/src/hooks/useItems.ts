import { useState, useCallback } from 'react'
import type { CMSItem, CMSItemsResponse } from '../types'
import { api } from '../api/client'

export function useItems() {
  const [items, setItems] = useState<CMSItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<CMSItemsResponse>('/api/v1/items?limit=50')
      setItems(data.items)
      // Clear selections when reloading
      setSelectedItems(new Set())
      setSelectedImages(new Set())
    } catch (err) {
      console.error('Failed to load items:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedItems((prev) => {
      if (prev.size === items.length) {
        return new Set()
      }
      return new Set(items.map((item) => item.id))
    })
  }, [items])

  // Per-image opt-in (key = "itemId:fieldName")
  const toggleImageOptIn = useCallback((imageKey: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev)
      if (next.has(imageKey)) {
        next.delete(imageKey)
      } else {
        next.add(imageKey)
      }
      return next
    })
  }, [])

  const toggleAllImagesForProject = useCallback(
    (itemId: string, images: { field_name: string }[]) => {
      setSelectedImages((prev) => {
        const next = new Set(prev)
        const keys = images.map((img) => `${itemId}:${img.field_name}`)
        const allSelected = keys.every((k) => next.has(k))
        if (allSelected) {
          keys.forEach((k) => next.delete(k))
        } else {
          keys.forEach((k) => next.add(k))
        }
        return next
      })
    },
    []
  )

  // Get images visible in main panel (from selected projects)
  const visibleImages = items
    .filter((item) => selectedItems.has(item.id))
    .flatMap((item) =>
      item.images.map((img) => ({
        ...img,
        itemId: item.id,
        itemName: item.name,
        imageKey: `${item.id}:${img.field_name}`,
      }))
    )

  return {
    items,
    loading,
    selectedItems,
    selectedImages,
    visibleImages,
    loadItems,
    toggleItemSelection,
    toggleSelectAll,
    toggleImageOptIn,
    toggleAllImagesForProject,
    setSelectedImages,
  }
}

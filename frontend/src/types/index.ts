export interface HealthStatus {
  status: string
  version: string
  environment: string
  service: string
}

export interface ImageWithAltText {
  field_name: string
  image_url: string | null
  current_alt_text: string | null
  file_id: string | null
}

export interface CMSItem {
  id: string
  name: string
  slug: string
  images: ImageWithAltText[]
}

export interface CMSItemsResponse {
  items: CMSItem[]
  total: number
  has_more: boolean
}

export interface JobResponse {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: {
    processed: number
    total: number
    percentage: number
  }
  estimated_duration_seconds?: number
}

export interface Proposal {
  proposal_id: string
  job_id: string
  item_id: string
  field_name: string
  proposed_alt_text: string
  confidence_score: number
  model_used: string
  generated_at: string
}

export interface ApplyResult {
  success_count: number
  failure_count: number
  results: Array<{
    item_id: string
    success: boolean
    error?: string
  }>
}

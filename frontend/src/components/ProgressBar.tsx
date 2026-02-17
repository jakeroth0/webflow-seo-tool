import type { JobResponse } from '../types'

interface ProgressBarProps {
  job: JobResponse
}

export function ProgressBar({ job }: ProgressBarProps) {
  const statusLabel =
    job.status === 'completed'
      ? 'Generation Complete'
      : job.status === 'processing'
        ? 'Processing...'
        : job.status === 'failed'
          ? 'Job Failed'
          : 'Queued'

  const statusClass =
    job.status === 'completed'
      ? 'text-green-500'
      : job.status === 'failed'
        ? 'text-destructive'
        : 'text-primary'

  const barClass =
    job.status === 'completed'
      ? 'bg-green-500'
      : job.status === 'failed'
        ? 'bg-destructive'
        : 'bg-primary'

  return (
    <div className="p-3 rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${statusClass}`}>
          {statusLabel}
        </span>
        <span className="text-xs text-muted-foreground">
          {job.progress.processed} / {job.progress.total} items
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden bg-input">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barClass}`}
          style={{ width: `${job.progress.percentage}%` }}
        />
      </div>
    </div>
  )
}

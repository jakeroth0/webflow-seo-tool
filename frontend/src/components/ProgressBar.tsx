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

  const statusColor =
    job.status === 'completed'
      ? 'var(--success)'
      : job.status === 'failed'
        ? 'var(--danger)'
        : 'var(--accent)'

  return (
    <div
      className="p-3 rounded-lg"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: statusColor }}>
          {statusLabel}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {job.progress.processed} / {job.progress.total} items
        </span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-input)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${job.progress.percentage}%`,
            backgroundColor: statusColor,
          }}
        />
      </div>
    </div>
  )
}

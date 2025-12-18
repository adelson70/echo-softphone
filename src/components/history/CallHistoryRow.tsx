import type { CallHistoryEntry } from '../../services/historyService'

type CallHistoryRowProps = {
  entry: CallHistoryEntry
  onCall: (number: string) => void
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds < 0) return '-'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`
  }
  if (hours > 0) {
    return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  }
  if (minutes > 0) {
    return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
  }
  return 'agora'
}

function formatFullDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusBadge(status: CallHistoryEntry['status']) {
  const badges = {
    answered: {
      label: 'Atendida',
      className: 'bg-success/20 text-success border-success/30',
    },
    completed: {
      label: 'Completa',
      className: 'bg-success/20 text-success border-success/30',
    },
    missed: {
      label: 'Perdida',
      className: 'bg-danger/20 text-danger border-danger/30',
    },
    rejected: {
      label: 'Rejeitada',
      className: 'bg-danger/20 text-danger border-danger/30',
    },
    failed: {
      label: 'Falhou',
      className: 'bg-muted/20 text-muted border-muted/30',
    },
  }
  
  return badges[status] || badges.failed
}

function IncomingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 15l-4-4m0 0l-4-4m4 4V3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function OutgoingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 9l4-4m0 0l4 4m-4-4v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CallHistoryRow({ entry, onCall }: CallHistoryRowProps) {
  const statusBadge = getStatusBadge(entry.status)
  const displayText = entry.displayName || entry.number
  
  return (
    <div
      className="group flex items-center gap-4 rounded-xl border border-white/5 bg-card/50 p-4 transition-all hover:border-white/10 hover:bg-card"
      title={formatFullDateTime(entry.startTime)}
    >
      {/* Ícone de direção */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          entry.direction === 'incoming'
            ? 'bg-primary/20 text-primary'
            : 'bg-success/20 text-success'
        }`}
      >
        {entry.direction === 'incoming' ? <IncomingIcon /> : <OutgoingIcon />}
      </div>

      {/* Informações principais */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-text">{displayText}</p>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted">
          <span>{formatRelativeTime(entry.startTime)}</span>
          {entry.duration !== undefined && (
            <>
              <span>•</span>
              <span>{formatDuration(entry.duration)}</span>
            </>
          )}
        </div>
      </div>

      {/* Botão de ação */}
      <button
        type="button"
        onClick={() => onCall(entry.number)}
        className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2.5 text-text transition-colors hover:bg-primary hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Ligar para ${entry.number}`}
        title={`Ligar para ${entry.number}`}
      >
        <PhoneIcon />
      </button>
    </div>
  )
}


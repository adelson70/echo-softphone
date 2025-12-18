import { useState } from 'react'
import type { CallHistoryEntry } from '../../services/historyService'
import { ContextMenu } from './ContextMenu'

type CallHistoryTableProps = {
  entries: CallHistoryEntry[]
  onCall?: (number: string) => void
  onAddContact?: (number: string, name?: string) => void
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

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function getStatusInfo(status: CallHistoryEntry['status']): string {
  const statusMap = {
    answered: 'Chamada encerrada',
    completed: 'Chamada encerrada',
    missed: 'Chamada perdida',
    rejected: 'Chamada rejeitada',
    failed: 'Chamada falhou',
  }
  return statusMap[status] || 'Chamada encerrada'
}

function OutgoingCallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function IncomingCallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function FailedCallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 18L18 6M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getCallIcon(entry: CallHistoryEntry) {
  const isFailed = entry.status === 'failed' || entry.status === 'rejected' || entry.status === 'missed'
  
  if (isFailed && entry.direction === 'outgoing') {
    return <FailedCallIcon />
  }
  
  if (entry.direction === 'incoming') {
    return <IncomingCallIcon />
  }
  
  return <OutgoingCallIcon />
}

function getCallIconColor(entry: CallHistoryEntry): string {
  const isFailed = entry.status === 'failed' || entry.status === 'rejected' || entry.status === 'missed'
  
  if (isFailed) {
    return 'text-danger'
  }
  
  if (entry.direction === 'incoming') {
    return 'text-primary'
  }
  
  return 'text-success'
}

function truncateName(name: string, maxLength: number = 9): string {
  if (name.length <= maxLength) {
    return name
  }
  return name.slice(0, maxLength) + '...'
}

function getTooltipContent(entry: CallHistoryEntry): string {
  const lines: string[] = []
  
  // Nome completo se disponível
  if (entry.displayName) {
    lines.push(`Nome: ${entry.displayName}`)
  }
  
  // Número
  lines.push(`Número: ${entry.number}`)
  
  // Direção
  lines.push(`Direção: ${entry.direction === 'incoming' ? 'Entrante' : 'Saída'}`)
  
  // Status
  lines.push(`Status: ${getStatusInfo(entry.status)}`)
  
  // Duração
  if (entry.duration !== undefined && entry.duration > 0) {
    lines.push(`Duração: ${formatDuration(entry.duration)}`)
  } else {
    lines.push('Duração: -')
  }
  
  // Data e hora completa
  lines.push(`Horário: ${formatDateTime(entry.startTime)}`)
  
  return lines.join('\n')
}

export function CallHistoryTable({ entries, onCall, onAddContact }: CallHistoryTableProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    number: string
    name?: string
  } | null>(null)

  function handleContextMenu(event: React.MouseEvent, entry: CallHistoryEntry) {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      number: entry.number,
      name: entry.displayName,
    })
  }

  function handleCloseContextMenu() {
    setContextMenu(null)
  }

  function handleAddContact() {
    if (contextMenu && onAddContact) {
      onAddContact(contextMenu.number, contextMenu.name)
    }
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-xs text-muted">Nenhuma chamada encontrada</p>
      </div>
    )
  }

  return (
    <>
      <div className="w-full">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-white/10">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">Nome</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">Número</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">Horário</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const displayName = entry.displayName || entry.number
              const iconColor = getCallIconColor(entry)
              const tooltipContent = getTooltipContent(entry)
              
              return (
                <tr
                  key={entry.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/5 cursor-pointer"
                  title={tooltipContent}
                  onContextMenu={(e) => handleContextMenu(e, entry)}
                  onClick={() => {
                    if (onCall) {
                      onCall(entry.number)
                    }
                  }}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`${iconColor} shrink-0`} title={tooltipContent}>
                        {getCallIcon(entry)}
                      </span>
                      <span className="text-xs text-text truncate max-w-[200px]" title={tooltipContent}>
                        {truncateName(displayName)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-text" title={tooltipContent}>{entry.number}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-muted whitespace-nowrap" title={tooltipContent}>
                      {formatDateTime(entry.startTime)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onAddContact={handleAddContact}
        />
      )}
    </>
  )
}


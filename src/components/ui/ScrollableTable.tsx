import type { ReactNode } from 'react'

type ScrollableTableProps<T> = {
  data: T[]
  renderRow: (item: T, index: number) => ReactNode
  maxHeight?: string
  className?: string
  emptyMessage?: string
}

export function ScrollableTable<T>({
  data,
  renderRow,
  maxHeight = 'calc(100vh - 300px)',
  className = '',
  emptyMessage = 'Nenhum item encontrado',
}: ScrollableTableProps<T>) {
  return (
    <div
      className={`scrollable-table-container ${className}`}
      style={{ maxHeight }}
    >
      <style>{`
        .scrollable-table-container {
          overflow-y: auto;
          overflow-x: hidden;
          border-radius: 1rem;
        }
        
        .scrollable-table-container::-webkit-scrollbar {
          width: 8px;
        }
        
        .scrollable-table-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        .scrollable-table-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        
        .scrollable-table-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        /* Firefox */
        .scrollable-table-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
        }
      `}</style>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-center">
          <p className="text-sm text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-1">{data.map((item, index) => renderRow(item, index))}</div>
      )}
    </div>
  )
}


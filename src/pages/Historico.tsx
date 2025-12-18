import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/ui/TopBar'
import { Card } from '../components/ui/Card'
import { useSip } from '../sip/react/useSip'
import { clearStorage } from '../services/storageService'
import { getCallHistory, clearCallHistory, type CallHistoryEntry } from '../services/historyService'
import { CallHistoryTable } from '../components/history/CallHistoryTable'
import { addContact } from '../services/contactService'
import { AddContactModal } from '../components/contacts/AddContactModal'

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Historico() {
  const navigate = useNavigate()
  const sip = useSip()
  const [history, setHistory] = useState<CallHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const isFirstLoadRef = useRef(true)
  const [addContactModalOpen, setAddContactModalOpen] = useState(false)
  const [contactToAdd, setContactToAdd] = useState<{ number: string; name?: string } | null>(null)

  function handleCall(number: string) {
    // Se não houver chamada ativa, navega para o discador com o número pré-preenchido
    if (sip.snapshot.callStatus === 'idle') {
      navigate(`/caller?number=${encodeURIComponent(number)}`)
    } else {
      // Se houver chamada ativa, apenas navega (usuário pode encerrar e ligar depois)
      navigate('/caller')
    }
  }

  async function handleClearHistory() {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de chamadas?')) {
      await clearCallHistory()
      setHistory([])
      setSearchQuery('')
    }
  }

  function handleAddContact(number: string, name?: string) {
    setContactToAdd({ number, name })
    setAddContactModalOpen(true)
  }

  async function handleSaveContact(contactName: string, contactNumber: string) {
    await addContact(contactName, contactNumber)
  }

  // Filtro de pesquisa
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) {
      return history
    }

    const query = searchQuery.toLowerCase().trim()
    return history.filter((entry) => {
      const name = (entry.displayName || entry.number).toLowerCase()
      const number = entry.number.toLowerCase()
      return name.includes(query) || number.includes(query)
    })
  }, [history, searchQuery])

  useEffect(() => {
    async function loadHistory() {
      // Só mostra loading na primeira carga
      if (isFirstLoadRef.current) {
        setLoading(true)
      }
      try {
        const entries = await getCallHistory()
        setHistory(entries)
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
      } finally {
        if (isFirstLoadRef.current) {
          setLoading(false)
          isFirstLoadRef.current = false
        }
      }
    }
    void loadHistory()

    // Atualiza o histórico periodicamente (a cada 5 segundos) para pegar novas chamadas
    const interval = setInterval(() => {
      void loadHistory()
    }, 5000)

    return () => clearInterval(interval)
  }, [])


  return (
    <div className="h-screen overflow-hidden bg-background text-text">
      <TopBar
        active="history"
        onDialerClick={() => navigate('/caller')}
        onHistoryClick={() => navigate('/historico')}
        onContactsClick={() => navigate('/contatos')}
        onLogout={() => {
          void clearStorage().catch(() => {})
          void sip.unregisterAndDisconnect().catch(() => {})
          navigate('/')
        }}
      />

      <main className="mx-auto h-full max-w-6xl px-4 pb-6 pt-16">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Histórico</h1>
            <p className="text-xs text-muted">
              {history.length === 0
                ? 'Nenhuma chamada registrada'
                : searchQuery
                  ? `${filteredHistory.length} de ${history.length} ${history.length === 1 ? 'chamada' : 'chamadas'}`
                  : `${history.length} ${history.length === 1 ? 'chamada' : 'chamadas'} registrada${history.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/20 hover:border-danger/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Limpar histórico"
              title="Limpar histórico"
            >
              <TrashIcon />
              <span>Limpar</span>
            </button>
          )}
        </div>

        {/* Campo de pesquisa */}
        {history.length > 0 && (
          <div className="mt-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por nome, número..."
                className="w-full rounded-xl border border-white/10 bg-background py-2 pl-10 pr-10 text-xs text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-text transition-colors"
                  aria-label="Limpar pesquisa"
                >
                  <ClearIcon />
                </button>
              )}
            </div>
          </div>
        )}

        <Card className="mt-4 border border-white/5 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-xs text-muted">Carregando histórico...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              <h2 className="text-xs font-semibold text-text">Sem chamadas</h2>
              <p className="text-xs text-muted">
                O histórico de chamadas aparecerá aqui quando você fizer ou receber chamadas.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-center">
              <p className="text-xs text-muted">Nenhuma chamada encontrada para "{searchQuery}"</p>
            </div>
          ) : (
            <div
              className="scrollable-table-container"
              style={{ maxHeight: 'calc(100vh - 320px)' }}
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
                
                .scrollable-table-container {
                  scrollbar-width: thin;
                  scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
                }
              `}</style>
              <CallHistoryTable 
                entries={filteredHistory} 
                onCall={handleCall}
                onAddContact={handleAddContact}
              />
            </div>
          )}
        </Card>
      </main>

      <AddContactModal
        isOpen={addContactModalOpen}
        onClose={() => {
          setAddContactModalOpen(false)
          setContactToAdd(null)
        }}
        onSave={handleSaveContact}
        initialName={contactToAdd?.name || ''}
        initialNumber={contactToAdd?.number || ''}
      />
    </div>
  )
}
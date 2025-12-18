import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/ui/TopBar'
import { Card } from '../components/ui/Card'
import { useSip } from '../sip/react/useSip'
import { clearStorage } from '../services/storageService'
import { getContacts, addContact, deleteContact, type Contact } from '../services/contactService'
import { AddContactModal } from '../components/contacts/AddContactModal'

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

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

export default function Contatos() {
  const navigate = useNavigate()
  const sip = useSip()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [addContactModalOpen, setAddContactModalOpen] = useState(false)

  // Filtro de pesquisa
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts
    }

    const query = searchQuery.toLowerCase().trim()
    return contacts.filter((contact) => {
      const name = contact.name.toLowerCase()
      const number = contact.number.toLowerCase()
      return name.includes(query) || number.includes(query)
    })
  }, [contacts, searchQuery])

  useEffect(() => {
    async function loadContacts() {
      setLoading(true)
      try {
        const loadedContacts = await getContacts()
        setContacts(loadedContacts)
      } catch (error) {
        console.error('Erro ao carregar contatos:', error)
      } finally {
        setLoading(false)
      }
    }
    void loadContacts()
  }, [])

  async function handleSaveContact(name: string, number: string) {
    await addContact(name, number)
    const updatedContacts = await getContacts()
    setContacts(updatedContacts)
  }

  async function handleDeleteContact(id: string) {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      await deleteContact(id)
      const updatedContacts = await getContacts()
      setContacts(updatedContacts)
    }
  }

  function handleCall(number: string) {
    if (sip.snapshot.callStatus === 'idle') {
      navigate(`/caller?number=${encodeURIComponent(number)}`)
    } else {
      navigate('/caller')
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-text">
      <TopBar
        active="contacts"
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
            <h1 className="text-xl font-semibold tracking-tight">Contatos</h1>
            <p className="text-xs text-muted">
              {contacts.length === 0
                ? 'Nenhum contato registrado'
                : searchQuery
                  ? `${filteredContacts.length} de ${contacts.length} ${contacts.length === 1 ? 'contato' : 'contatos'}`
                  : `${contacts.length} ${contacts.length === 1 ? 'contato' : 'contatos'} registrado${contacts.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        {/* Campo de pesquisa */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
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
            <button
              type="button"
              onClick={() => setAddContactModalOpen(true)}
              className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-lg bg-success text-background transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/40"
              aria-label="Adicionar contato"
              title="Adicionar contato"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        <Card className="mt-4 border border-white/5 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-xs text-muted">Carregando contatos...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              <h2 className="text-xs font-semibold text-text">Sem contatos</h2>
              <p className="text-xs text-muted">
                Adicione contatos clicando no botão + ao lado do campo de pesquisa.
              </p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-center">
              <p className="text-xs text-muted">Nenhum contato encontrado para "{searchQuery}"</p>
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
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">Nome</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted">Número</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="border-b border-white/5 transition-colors hover:bg-white/5 cursor-pointer"
                      onClick={() => handleCall(contact.number)}
                    >
                      <td className="px-3 py-2">
                        <span className="text-xs text-text">{contact.name}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs text-text">{contact.number}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleDeleteContact(contact.id)
                            }}
                            className="rounded-lg p-1.5 text-danger transition-colors hover:bg-danger/10"
                            aria-label="Excluir contato"
                            title="Excluir contato"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      <AddContactModal
        isOpen={addContactModalOpen}
        onClose={() => setAddContactModalOpen(false)}
        onSave={handleSaveContact}
      />
    </div>
  )
}

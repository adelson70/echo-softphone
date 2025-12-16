import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/ui/TopBar'
import { Card } from '../components/ui/Card'

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18l-6-6 6-6"
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

  function handleBackToDialer() {
    navigate('/caller')
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleBackToDialer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-background text-text">
      <TopBar
        active="contacts"
        onHistoryClick={() => navigate('/historico')}
        onContactsClick={() => navigate('/contatos')}
        onLogout={() => navigate('/')}
      />

      <main className="mx-auto min-h-screen max-w-2xl px-4 pb-10 pt-20">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Contatos</h1>
            <p className="text-sm text-muted">Agenda do softphone (UI apenas).</p>
          </div>

          <button
            type="button"
            onClick={handleBackToDialer}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-text hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Voltar ao discador"
          >
            <ArrowLeftIcon />
            <span>Discador</span>
          </button>
        </div>

        <Card className="mt-6 border border-white/5 p-5">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-text">Sem contatos</h2>
            <p className="text-sm text-muted">
              Esta página é dedicada à agenda. A integração real (SIP/CRM) não está implementada.
            </p>
          </div>
        </Card>
      </main>
    </div>
  )
}



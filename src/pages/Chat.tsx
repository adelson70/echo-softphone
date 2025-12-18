import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/ui/TopBar'
import { Card } from '../components/ui/Card'
import { useSip } from '../sip/react/useSip'
import { clearStorage } from '../services/storageService'

export default function Chat() {
  const navigate = useNavigate()
  const sip = useSip()

  return (
    <div className="h-screen overflow-hidden bg-background text-text">
      <TopBar
        active="chat"
        onDialerClick={() => navigate('/caller')}
        onHistoryClick={() => navigate('/historico')}
        onContactsClick={() => navigate('/contatos')}
        onChatClick={() => navigate('/chat')}
        onLogout={() => {
          void clearStorage().catch(() => {})
          void sip.unregisterAndDisconnect().catch(() => {})
          navigate('/')
        }}
      />

      <main className="mx-auto h-full max-w-2xl px-4 pb-6 pt-16">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Chat</h1>
          <p className="text-sm text-muted">Mensagens do softphone (UI apenas).</p>
        </div>

        <Card className="mt-6 border border-white/5 p-5">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-text">Sem mensagens</h2>
            <p className="text-sm text-muted">
              Esta página é dedicada ao chat. A integração real (SIP/CRM) não está implementada.
            </p>
          </div>
        </Card>
      </main>
    </div>
  )
}


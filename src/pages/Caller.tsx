import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/ui/TopBar'
import { useSip } from '../sip/react/useSip'
import { clearStorage } from '../services/storageService'
import { IdleState } from '../components/caller/IdleState'
import { EstablishedState } from '../components/caller/EstablishedState'
import { IncomingState } from '../components/caller/IncomingState'
import { OutgoingState } from '../components/caller/OutgoingState'

export default function Caller() {
  const navigate = useNavigate()
  const sip = useSip()

  const [dialValue, setDialValue] = useState('')
  const [showKeypad, setShowKeypad] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferType, setTransferType] = useState<'assisted' | 'blind' | null>(null)
  const [transferTarget, setTransferTarget] = useState('')

  const canCall = useMemo(() => dialValue.trim().length > 0, [dialValue])
  const inCall = sip.snapshot.callStatus !== 'idle'
  const isEstablished = sip.snapshot.callStatus === 'established'
  const isIncoming = sip.snapshot.callStatus === 'incoming'
  const isOutgoing = sip.snapshot.callStatus === 'dialing' || sip.snapshot.callStatus === 'ringing'

  const establishedContactNumber = useMemo(() => {
    if (!isEstablished) return null
    if (sip.snapshot.callDirection === 'incoming') {
      return sip.snapshot.incoming?.user ?? sip.snapshot.incoming?.uri ?? ''
    }
    return dialValue || ''
  }, [isEstablished, sip.snapshot.callDirection, sip.snapshot.incoming, dialValue])

  const establishedContactName = useMemo(() => {
    if (!isEstablished) return undefined
    if (sip.snapshot.callDirection === 'incoming') {
      return sip.snapshot.incoming?.displayName ?? undefined
    }
    return undefined
  }, [isEstablished, sip.snapshot.callDirection, sip.snapshot.incoming])

  function appendKey(key: string) {
    setDialValue((prev) => (prev + key).slice(0, 128))
  }

  function handleDialChange(next: string) {
    setDialValue(next.slice(0, 128))
  }

  async function handleCall() {
    if (!canCall) return
    await sip.startCall(dialValue)
  }

  async function handleHangup() {
    try {
      await sip.hangup()
    } catch (error) {
      console.error('Erro ao encerrar chamada:', error)
    }
  }

  function handleToggleMute() {
    try {
      sip.toggleMute()
    } catch (error) {
      console.error('Erro ao alternar mudo:', error)
    }
  }

  function handleToggleKeypad() {
    setShowKeypad((prev) => !prev)
  }

  function handleHistoryClick() {
    navigate('/historico')
  }

  function handleContactsClick() {
    navigate('/contatos')
  }

  function handleTransferOpen() {
    setTransferType(null)
    setTransferTarget('')
    setTransferModalOpen(true)
  }

  function handleTransferClose() {
    setTransferModalOpen(false)
    setTransferType(null)
    setTransferTarget('')
  }

  async function handleTransferConfirm() {
    if (!transferType || !transferTarget.trim()) return

    try {
      if (transferType === 'assisted') {
        await sip.transferAttended(transferTarget.trim())
      } else {
        await sip.transferBlind(transferTarget.trim())
      }
      handleTransferClose()
    } catch (error) {
      console.error('Erro ao transferir chamada:', error)
    }
  }

  async function handleLogout() {
    // Limpa credenciais/config no store para não auto-reconectar
    await clearStorage().catch(() => {})

    // Não bloqueia a navegação caso o SIP demore/trave ao desconectar (ex.: durante chamada)
    if (sip.snapshot.callStatus !== 'idle') {
      void sip.hangup().catch(() => {})
    }
    void sip.unregisterAndDisconnect().catch(() => {})
    navigate('/')
  }


  const connectedAs = sip.snapshot.identity
    ? `${sip.snapshot.identity.username}@${sip.snapshot.identity.domain}`
    : ''

  return (
    <div className="h-screen overflow-hidden bg-background text-text">
      {/* Modal de Transferência */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-background p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-text">Transferir Chamada</h3>

            {!transferType ? (
              <>
                <p className="mb-4 text-sm text-muted">
                  Escolha o tipo de transferência:
                </p>
                <div className="mb-4 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setTransferType('assisted')}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-white/10"
                  >
                    Transferência Assistida
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferType('blind')}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-white/10"
                  >
                    Transferência Cega
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleTransferClose}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-white/10"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted">
                  {transferType === 'assisted'
                    ? 'Digite o número ou extensão para transferência assistida:'
                    : 'Digite o número ou extensão para transferência cega:'}
                </p>
                <input
                  type="text"
                  value={transferTarget}
                  onChange={(e) => setTransferTarget(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleTransferConfirm()
                    } else if (e.key === 'Escape') {
                      handleTransferClose()
                    }
                  }}
                  placeholder="Número destino"
                  autoFocus
                  className="mb-4 h-12 w-full rounded-xl border border-white/10 bg-background px-4 text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTransferType(null)
                      setTransferTarget('')
                    }}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-white/10"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleTransferConfirm()}
                    disabled={!transferTarget.trim()}
                    className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Transferir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <TopBar
        onHistoryClick={handleHistoryClick}
        onContactsClick={handleContactsClick}
        onLogout={handleLogout}
      />

      <main className="mx-auto flex h-full min-h-0 max-w-2xl flex-col overflow-hidden px-4 pb-6 pt-24">
        {/* Status centralizado no topo (não atrapalha o input) */}
        {!inCall ? (
          <div className="fixed top-16 left-1/2 z-30 -translate-x-1/2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/80 px-3 py-2 text-xs text-text backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-success" aria-hidden="true" />
              <span className="font-semibold">{connectedAs || 'Conectado'}</span>
            </div>
          </div>
        ) : null}

        {/* Renderização dinâmica dos estados */}
        {/* {isEstablished ? (
          <EstablishedState
            callDurationSec={sip.callDurationSec}
            contactNumber={establishedContactNumber || ''}
            onTransferOpen={handleTransferOpen}
            onToggleMute={handleToggleMute}
            onSendDtmf={(k) => sip.sendDtmf(k, { playLocal: true, sendRemote: true })}
            onHangup={() => void handleHangup()}
            isMuted={sip.snapshot.muted ?? false}
          />
        ) : isIncoming ? (
          <IncomingState
            incomingCall={sip.snapshot.incoming ?? null}
            onAnswer={() => void sip.answer()}
            onReject={() => void sip.reject()}
          />
        ) : isOutgoing ? (
          <OutgoingState
            dialValue={dialValue}
            callStatus={sip.snapshot.callStatus === 'dialing' ? 'dialing' : 'ringing'}
            onHangup={() => void sip.hangup()}
          />
        ) : (
          <IdleState
            dialValue={dialValue}
            onDialChange={handleDialChange}
            onKeyPress={(k) => {
              appendKey(k)
              sip.sendDtmf(k, { playLocal: true, sendRemote: false })
            }}
            onCall={handleCall}
            onHangup={handleHangup}
            canCall={canCall}
            inCall={inCall}
            isRegistered={sip.snapshot.connection === 'registered'}
            showKeypad={showKeypad}
          />
        )} */}
        <EstablishedState
          callDurationSec={sip.callDurationSec}
          contactNumber={establishedContactNumber || ''}
          contactName={establishedContactName}
          speakerOn={sip.speakerOn}
          onToggleSpeaker={sip.toggleSpeaker}
          showKeypad={showKeypad}
          onToggleKeypad={handleToggleKeypad}
          onTransferOpen={handleTransferOpen}
          onToggleMute={handleToggleMute}
          onSendDtmf={(k) => sip.sendDtmf(k, { playLocal: true, sendRemote: true })}
          onHangup={() => void handleHangup()}
          isMuted={sip.snapshot.muted ?? false}
        />
      </main>
    </div>
  )
}
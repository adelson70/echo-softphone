import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Keyboard,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Clock,
  BellOff,
  X,
  Video,
  UserPlus,
  Users,
  Repeat,
} from 'lucide-react'
import { TopBar } from '../components/ui/TopBar'
import { DialInput } from '../components/ui/DialInput'
import { DialPad } from '../components/ui/DialPad'
import { ActionButton } from '../components/ui/ActionButton'
import { Avatar } from '../components/ui/Avatar'
import { useSip } from '../sip/react/useSip'
import { clearStorage } from '../services/storageService'

export default function Caller() {
  const navigate = useNavigate()
  const sip = useSip()

  const [dialValue, setDialValue] = useState('')
  const [showKeypad, setShowKeypad] = useState(true)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferType, setTransferType] = useState<'assisted' | 'blind' | null>(null)
  const [transferTarget, setTransferTarget] = useState('')

  const canCall = useMemo(() => dialValue.trim().length > 0, [dialValue])
  const inCall = sip.snapshot.callStatus !== 'idle'
  const isEstablished = sip.snapshot.callStatus === 'established'
  const isIncoming = sip.snapshot.callStatus === 'incoming'
  const isOutgoing = sip.snapshot.callStatus === 'dialing' || sip.snapshot.callStatus === 'ringing'

  // Informações do contato na chamada estabelecida
  const establishedContactName = useMemo(() => {
    if (!isEstablished) return null
    if (sip.snapshot.callDirection === 'incoming') {
      return (
        sip.snapshot.incoming?.displayName ??
        sip.snapshot.incoming?.user ??
        'Desconhecido'
      )
    }
    return dialValue || 'Desconhecido'
  }, [isEstablished, sip.snapshot.callDirection, sip.snapshot.incoming, dialValue])

  const establishedContactNumber = useMemo(() => {
    if (!isEstablished) return null
    if (sip.snapshot.callDirection === 'incoming') {
      return sip.snapshot.incoming?.user ?? sip.snapshot.incoming?.uri ?? ''
    }
    return dialValue || ''
  }, [isEstablished, sip.snapshot.callDirection, sip.snapshot.incoming, dialValue])

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

  function handleHistoryClick() {
    navigate('/historico')
  }

  function handleContactsClick() {
    navigate('/contatos')
  }

  function handleTransferOpen(type: 'assisted' | 'blind') {
    setTransferType(type)
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

  function formatDuration(totalSec: number) {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const connectedAs = sip.snapshot.identity
    ? `${sip.snapshot.identity.username}@${sip.snapshot.identity.domain}`
    : ''

  return (
    <div className="h-screen overflow-hidden bg-background text-text">
      {/* Modal de Transferência */}
      {transferModalOpen && transferType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-background p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-text">
              {transferType === 'assisted' ? 'Transferir Assistido' : 'Transferir Cega'}
            </h3>
            <p className="mb-4 text-sm text-muted">
              Digite o número ou extensão para transferir a chamada:
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
                onClick={handleTransferClose}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-white/10"
              >
                Cancelar
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
          </div>
        </div>
      )}
      <TopBar
        onHistoryClick={handleHistoryClick}
        onContactsClick={handleContactsClick}
        onLogout={handleLogout}
      />

      <main className="mx-auto flex h-full max-w-2xl flex-col px-4 pb-6 pt-24">
        {/* Status centralizado no topo (não atrapalha o input) */}
        {!inCall ? (
          <div className="fixed top-16 left-1/2 z-30 -translate-x-1/2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/80 px-3 py-2 text-xs text-text backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-success" aria-hidden="true" />
              <span className="font-semibold">{connectedAs || 'Conectado'}</span>
            </div>
          </div>
        ) : null}

        {/* Estado Established - Chamada Ativa */}
        {isEstablished ? (
          <div className="flex h-full flex-col items-center px-4">
            {/* Tempo no topo */}
            <div className="flex items-center gap-2 text-primary">
              <PhoneCall size={16} />
              <span className="text-sm font-medium">{formatDuration(sip.callDurationSec)}</span>
            </div>

            {/* Número da ligação */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold text-text">{establishedContactNumber}</h2>
            </div>


            {/* Opções de controle - Transferir assistido, Transferir cega, Deixar mudo */}
            <div className="mb-8 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => handleTransferOpen('assisted')}
                className="flex flex-col items-center gap-2 text-muted transition-colors hover:text-text"
                aria-label="Transferir assistido"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background">
                  <Repeat size={20} />
                </div>
                <span className="text-xs font-medium">Transferir assistido</span>
              </button>
              <button
                type="button"
                onClick={() => handleTransferOpen('blind')}
                className="flex flex-col items-center gap-2 text-muted transition-colors hover:text-text"
                aria-label="Transferir cega"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background">
                  <Repeat size={20} />
                </div>
                <span className="text-xs font-medium">Transferir cega</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleToggleMute()
                }}
                className="flex flex-col items-center gap-2 text-muted transition-colors hover:text-text"
                aria-label="Deixar mudo"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background">
                  {sip.snapshot.muted ? <MicOff size={20} /> : <Mic size={20} />}
                </div>
                <span className="text-xs font-medium">Deixar mudo</span>
              </button>
            </div>

            {/* Dialpad - formato igual ao estado neutro */}
            <div className="mb-8 flex flex-1 items-center justify-center">
              <DialPad
                className="mx-auto w-full max-w-sm"
                onKeyPress={(k) => {
                  // Sempre toca o som local do DTMF.
                  // Só envia DTMF remoto quando a chamada estiver estabelecida.
                  sip.sendDtmf(k, { playLocal: true, sendRemote: true })
                }}
                disabled={false}
              />
            </div>

            {/* Botão de terminar ligação */}
            <div className="mt-auto pb-6">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void handleHangup()
                }}
                className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-danger text-background transition-colors hover:bg-danger/90"
                aria-label="Terminar ligação"
              >
                <PhoneOff size={28} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ) : null}

        {/* Estado Incoming - Recebendo Chamada */}
        {sip.snapshot.callStatus === 'incoming' ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-8">
            {/* Foto de perfil com animação */}
            <div className="mb-8">
              <Avatar
                size="xl"
                name={
                  sip.snapshot.incoming?.displayName ??
                  sip.snapshot.incoming?.user ??
                  'Desconhecido'
                }
                showRipple={true}
              />
            </div>

            {/* Nome e número */}
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-semibold text-text">
                {sip.snapshot.incoming?.displayName ??
                  sip.snapshot.incoming?.user ??
                  'Desconhecido'}
              </h2>
              <p className="text-lg text-primary">
                {sip.snapshot.incoming?.user ?? sip.snapshot.incoming?.uri ?? ''}
              </p>
            </div>

            {/* Botões de ação no topo */}
            <div className="mb-12 flex items-center gap-8">
              <button
                type="button"
                className="flex flex-col items-center gap-2 text-muted transition-colors hover:text-text"
                aria-label="Mensagem"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background">
                  <MessageSquare size={20} />
                </div>
                <span className="text-xs font-medium">Mensagem</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center gap-2 text-muted transition-colors hover:text-text"
                aria-label="Lembrete"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background">
                  <Clock size={20} />
                </div>
                <span className="text-xs font-medium">Lembrete</span>
              </button>
            </div>

            {/* Botões principais de ação */}
            <div className="mb-8 flex items-center gap-8">
              <button
                type="button"
                onClick={() => void sip.reject()}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-text transition-colors hover:bg-white/20"
                aria-label="Recusar"
              >
                <X size={28} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => void sip.answer()}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-background transition-colors hover:bg-success/90"
                aria-label="Atender"
              >
                <PhoneCall size={28} strokeWidth={2.5} />
              </button>
            </div>

            {/* Indicador de modo silencioso */}
            <div className="flex items-center gap-2 text-muted">
              <BellOff size={16} />
              <span className="text-xs font-medium">Silencioso</span>
            </div>
          </div>
        ) : null}

        {/* Estado Outgoing - Chamando */}
        {(sip.snapshot.callStatus === 'dialing' || sip.snapshot.callStatus === 'ringing') ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-8">
            {/* Foto de perfil com animação */}
            <div className="mb-8">
              <Avatar size="xl" name={dialValue} showRipple={true} />
            </div>

            {/* Nome e número */}
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-semibold text-text">{dialValue || 'Chamando...'}</h2>
              <p className="text-lg text-muted">
                {sip.snapshot.callStatus === 'dialing' ? 'Chamando...' : 'Tocando...'}
              </p>
            </div>

            {/* Botão de cancelar */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => void sip.hangup()}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-background transition-colors hover:bg-danger/90"
                aria-label="Cancelar"
              >
                <PhoneOff size={28} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ) : null}

        {/* Discador - apenas quando idle */}
        {!inCall ? (
          <>
            <section className="mx-auto mt-[12vh] w-full max-w-sm flex-none md:mt-10">
              <DialInput value={dialValue} onChange={handleDialChange} autoFocus disabled={inCall} />
            </section>

            <section className="mt-8 flex min-h-0 flex-1 w-full flex-col items-stretch justify-end gap-10">
              {showKeypad ? (
                <DialPad
                  className="mx-auto w-full max-w-sm"
                  onKeyPress={(k) => {
                    appendKey(k)
                    // Toca o som do DTMF localmente (sem enviar remotamente quando não há chamada)
                    sip.sendDtmf(k, { playLocal: true, sendRemote: false })
                  }}
                  disabled={false}
                />
              ) : null}

              <div className="flex items-center justify-center gap-6">
                <ActionButton
                  variant="success"
                  icon={<PhoneCall size={28} strokeWidth={2} aria-hidden="true" />}
                  onClick={handleCall}
                  ariaLabel="Chamar"
                  disabled={!canCall || inCall || sip.snapshot.connection !== 'registered'}
                />
                <ActionButton
                  variant="danger"
                  icon={<PhoneOff size={28} strokeWidth={2} aria-hidden="true" />}
                  onClick={handleHangup}
                  ariaLabel="Encerrar"
                  disabled={!inCall}
                />
              </div>
            </section>
          </>
        ) : null}

      </main>
    </div>
  )
}
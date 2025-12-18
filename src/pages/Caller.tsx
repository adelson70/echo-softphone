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
    await sip.hangup()
  }

  function handleHistoryClick() {
    navigate('/historico')
  }

  function handleContactsClick() {
    navigate('/contatos')
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
          <div className="flex h-full flex-col items-center justify-center px-4 py-8">
            {/* Duração no topo */}
            <div className="mb-4 flex items-center gap-2 text-primary">
              <PhoneCall size={16} />
              <span className="text-sm font-medium">{formatDuration(sip.callDurationSec)}</span>
            </div>

            {/* Nome e número */}
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-semibold text-text">{establishedContactName}</h2>
              <p className="text-lg text-primary">{establishedContactNumber}</p>
            </div>

            {/* Foto de perfil */}
            <div className="mb-8">
              <Avatar size="xl" name={establishedContactName || undefined} />
            </div>

            {/* Opções de controle - Primeira linha */}
            <div className="mb-6 grid grid-cols-3 gap-6">
              <button
                type="button"
                onClick={() => void sip.toggleMute()}
                className="flex flex-col items-center gap-2 text-muted transition-colors hover:text-text"
                aria-label="Mudo"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background">
                  {sip.snapshot.muted ? <MicOff size={20} /> : <Mic size={20} />}
                </div>
                <span className="text-xs font-medium">Mudo</span>
              </button>
              <button
                type="button"
                onClick={() => setShowKeypad((p) => !p)}
                className="flex flex-col items-center gap-2 text-muted transition-colors hover:text-text"
                aria-label="Teclado"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background">
                  <Keyboard size={20} />
                </div>
                <span className="text-xs font-medium">Teclado</span>
              </button>
              <button
                type="button"
                onClick={() => sip.toggleSpeaker()}
                className="flex flex-col items-center gap-2 text-muted transition-colors hover:text-text"
                aria-label="Viva voz"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background">
                  {sip.speakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </div>
                <span className="text-xs font-medium">Viva voz</span>
              </button>
            </div>

            {/* Opções de controle - Segunda linha */}
            <div className="mb-8 grid grid-cols-3 gap-6">
              <button
                type="button"
                className="flex flex-col items-center gap-2 text-muted transition-colors hover:text-text"
                aria-label="Video chamada"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background">
                  <Video size={20} />
                </div>
                <span className="text-xs font-medium">Video chamada</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center gap-2 text-muted transition-colors hover:text-text"
                aria-label="Adicionar chamada"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background">
                  <UserPlus size={20} />
                </div>
                <span className="text-xs font-medium">Adicionar chamada</span>
              </button>
              <button
                type="button"
                onClick={handleContactsClick}
                className="flex flex-col items-center gap-2 text-muted transition-colors hover:text-text"
                aria-label="Contatos"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background">
                  <Users size={20} />
                </div>
                <span className="text-xs font-medium">Contatos</span>
              </button>
            </div>

            {/* Botão de encerrar */}
            <button
              type="button"
              onClick={() => void sip.hangup()}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-background transition-colors hover:bg-danger/90"
              aria-label="Encerrar chamada"
            >
              <PhoneOff size={28} strokeWidth={2.5} />
            </button>
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
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-text transition-colors hover:bg-white/20"
                aria-label="Cancelar"
              >
                <X size={28} strokeWidth={2.5} />
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

        {/* Keypad durante chamada estabelecida (se habilitado) */}
        {isEstablished && showKeypad ? (
          <div className="fixed bottom-24 left-1/2 z-20 -translate-x-1/2">
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
        ) : null}
      </main>
    </div>
  )
}
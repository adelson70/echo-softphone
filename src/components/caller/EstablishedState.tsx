import { ArrowRight, Grid3x3, Mic, MicOff, PhoneCall, Repeat, Volume2 } from 'lucide-react'
import { DialPad } from '../ui/DialPad'
import { Avatar } from '../ui/Avatar'
import { HangupButton } from './HangupButton'

type EstablishedStateProps = {
  callDurationSec: number
  contactNumber: string
  contactName?: string
  speakerOn: boolean
  onToggleSpeaker: () => void
  showKeypad: boolean
  onToggleKeypad: () => void
  onTransferOpen: () => void
  onToggleMute: () => void
  onSendDtmf: (key: string) => void
  onHangup: () => void
  isMuted: boolean
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

export function EstablishedState({
  callDurationSec,
  contactNumber,
  contactName,
  speakerOn,
  onToggleSpeaker,
  showKeypad,
  onToggleKeypad,
  onTransferOpen,
  onToggleMute,
  onSendDtmf,
  onHangup,
  isMuted,
}: EstablishedStateProps) {
  const displayName = contactName || contactNumber

  return (
    <div className="flex h-full min-h-0 flex-col items-center overflow-hidden">
      {/* Tempo no topo com ícone de seta */}
      <div className="flex shrink-0 items-center gap-2 pt-2 pb-2 text-primary">
        <PhoneCall size={16} />
        <ArrowRight size={14} />
        <span className="text-sm font-medium">{formatDuration(callDurationSec)}</span>
      </div>

      {/* Nome do contato */}
      {contactName && (
        <div className="shrink-0 px-4 text-center">
          <h2 className="truncate text-lg font-semibold text-text sm:text-xl">{contactName}</h2>
        </div>
      )}

      {/* Número do contato */}
      <div className="shrink-0 px-4 text-center">
        <p className="truncate text-sm text-primary sm:text-base">{contactNumber}</p>
      </div>

      {/* Avatar */}
      <div className="mb-3 shrink-0 sm:mb-4">
        <Avatar name={displayName} />
      </div>

      {/* Espaço flexível para empurrar o painel para baixo */}
      <div className="flex-1" />

      {/* Container com painel e botão de cancelar na parte inferior */}
      <div className="mt-auto flex shrink-0 flex-col items-center">
        {/* Painel escuro arredondado com controles */}
        <div className={`mb-3 flex flex-col overflow-hidden rounded-3xl bg-card/80 px-6 py-6 shadow-2xl sm:mb-4 ${showKeypad ? 'w-full' : ''}`}>
          {showKeypad ? (
            <>
              {/* Dialpad dentro do painel */}
              <div className="flex max-h-64 items-start justify-center overflow-y-auto pb-4">
                <div className="w-full max-w-sm">
                  <DialPad
                    className="w-full"
                    onKeyPress={(k) => {
                      onSendDtmf(k)
                    }}
                    disabled={false}
                  />
                </div>
              </div>

              {/* Botões de controle abaixo do dialpad em linha */}
              <div className="flex shrink-0 items-center justify-center gap-6 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onToggleSpeaker()
                  }}
                  className="flex flex-col items-center gap-2 text-text transition-colors hover:text-primary"
                  aria-label={speakerOn ? 'Desativar viva-voz' : 'Ativar viva-voz'}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background/50 sm:h-14 sm:w-14 ${
                      speakerOn ? 'bg-primary/20 border-primary/30' : ''
                    }`}
                  >
                    <Volume2 size={20} />
                  </div>
                  <span className="text-xs font-medium">Viva-voz</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onToggleMute()
                  }}
                  className="flex flex-col items-center gap-2 text-text transition-colors hover:text-primary"
                  aria-label={isMuted ? 'Ativar microfone' : 'Desativar microfone'}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background/50 sm:h-14 sm:w-14 ${
                      isMuted ? 'bg-primary/20 border-primary/30' : ''
                    }`}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </div>
                  <span className="text-xs font-medium">Mudo</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onToggleKeypad()
                  }}
                  className="flex flex-col items-center gap-2 text-text transition-colors hover:text-primary"
                  aria-label="Ocultar teclado"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background/50 sm:h-14 sm:w-14">
                    <Grid3x3 size={20} />
                  </div>
                  <span className="text-xs font-medium">Ocultar</span>
                </button>
              </div>
            </>
          ) : (
            /* Botões em linha quando keypad está oculto */
            <div className="flex shrink-0 items-center justify-center gap-8">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleMute()
                }}
                className="flex flex-col items-center gap-2 text-text transition-colors hover:text-primary"
                aria-label={isMuted ? 'Ativar microfone' : 'Desativar microfone'}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background/50 sm:h-14 sm:w-14 ${
                    isMuted ? 'bg-primary/20 border-primary/30' : ''
                  }`}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </div>
                <span className="text-xs font-medium">Mudo</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleKeypad()
                }}
                className="flex flex-col items-center gap-2 text-text transition-colors hover:text-primary"
                aria-label="Mostrar teclado"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background/50 sm:h-14 sm:w-14">
                  <Grid3x3 size={20} />
                </div>
                <span className="text-xs font-medium">Teclado</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleSpeaker()
                }}
                className="flex flex-col items-center gap-2 text-text transition-colors hover:text-primary"
                aria-label={speakerOn ? 'Desativar viva-voz' : 'Ativar viva-voz'}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background/50 sm:h-14 sm:w-14 ${
                    speakerOn ? 'bg-primary/20 border-primary/30' : ''
                  }`}
                >
                  <Volume2 size={20} />
                </div>
                <span className="text-xs font-medium">Viva-voz</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onTransferOpen()
                }}
                className="flex flex-col items-center gap-2 text-text transition-colors hover:text-primary"
                aria-label="Transferir chamada"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-background/50 sm:h-14 sm:w-14">
                  <Repeat size={20} />
                </div>
                <span className="text-xs font-medium">Transferir</span>
              </button>
            </div>
          )}
        </div>

        {/* Botão de terminar ligação */}
        <div className="shrink-0 sm:pb-6">
          <HangupButton
            onClick={(e) => {
              e?.preventDefault()
              e?.stopPropagation()
              onHangup()
            }}
            ariaLabel="Terminar ligação"
            className="relative z-10"
          />
        </div>
      </div>
    </div>
  )
}


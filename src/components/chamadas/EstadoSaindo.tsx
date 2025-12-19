import { Avatar } from '../ui/Avatar'
import { HangupButton } from './BotaoDesligar'

type PropsEstadoSaindo = {
  dialValue: string
  callStatus: 'dialing' | 'ringing'
  onHangup: () => void
}

export function OutgoingState({ dialValue, callStatus, onHangup }: PropsEstadoSaindo) {
  const statusText = callStatus === 'dialing' ? 'Chamando...' : 'Tocando...'

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8">
      {/* Foto de perfil com animação */}
      <div className="mb-8">
        <Avatar size="xl" name={dialValue} showRipple={true} />
      </div>

      {/* Nome e número */}
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-semibold text-text">{dialValue || 'Chamando...'}</h2>
        <p className="text-lg text-muted">{statusText}</p>
      </div>

      {/* Botão de cancelar */}
      <div className="mb-8">
        <HangupButton onClick={onHangup} ariaLabel="Cancelar" />
      </div>
    </div>
  )
}


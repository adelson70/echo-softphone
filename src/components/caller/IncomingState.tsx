import { Avatar } from '../ui/Avatar'
import { AnswerButton } from './AnswerButton'
import { HangupButton } from './HangupButton'

type IncomingCallInfo = {
  displayName?: string
  user?: string
  uri?: string
}

type IncomingStateProps = {
  incomingCall: IncomingCallInfo | null
  onAnswer: () => void
  onReject: () => void
}

export function IncomingState({ incomingCall, onAnswer, onReject }: IncomingStateProps) {
  const displayName =
    incomingCall?.displayName ?? incomingCall?.user ?? 'Desconhecido'
  const number = incomingCall?.user ?? incomingCall?.uri ?? ''

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8">
      {/* Foto de perfil com animação */}
      <div className="mb-8">
        <Avatar size="xl" name={displayName} showRipple={true} />
      </div>

      {/* Nome e número */}
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-semibold text-text">{displayName}</h2>
        <p className="text-lg text-primary">{number}</p>
      </div>

      {/* Botões principais de ação */}
      <div className="mb-8 flex items-center gap-8">
        <HangupButton onClick={onReject} ariaLabel="Recusar" />
        <AnswerButton onClick={onAnswer} ariaLabel="Atender" />
      </div>

    </div>
  )
}


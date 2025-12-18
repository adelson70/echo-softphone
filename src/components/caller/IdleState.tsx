import { PhoneCall, PhoneOff } from 'lucide-react'
import { DialInput } from '../ui/DialInput'
import { DialPad } from '../ui/DialPad'
import { ActionButton } from '../ui/ActionButton'

type IdleStateProps = {
  dialValue: string
  onDialChange: (value: string) => void
  onKeyPress: (key: string) => void
  onCall: () => void
  onHangup: () => void
  canCall: boolean
  inCall: boolean
  isRegistered: boolean
  showKeypad?: boolean
}

export function IdleState({
  dialValue,
  onDialChange,
  onKeyPress,
  onCall,
  onHangup,
  canCall,
  inCall,
  isRegistered,
  showKeypad = true,
}: IdleStateProps) {
  return (
    <section className="mt-8 flex min-h-0 flex-1 w-full flex-col items-stretch justify-end gap-6">
      <DialInput value={dialValue} onChange={onDialChange} autoFocus disabled={inCall} />

      {showKeypad ? (
        <DialPad
          className="mx-auto w-full max-w-sm"
          onKeyPress={onKeyPress}
          disabled={false}
        />
      ) : null}

      <div className="flex items-center justify-center gap-6">
        <ActionButton
          variant="success"
          icon={<PhoneCall size={28} strokeWidth={2} aria-hidden="true" />}
          onClick={onCall}
          ariaLabel="Chamar"
          disabled={!canCall || inCall || !isRegistered}
        />
        <ActionButton
          variant="danger"
          icon={<PhoneOff size={28} strokeWidth={2} aria-hidden="true" />}
          onClick={onHangup}
          ariaLabel="Encerrar"
          disabled={!inCall}
        />
      </div>
    </section>
  )
}


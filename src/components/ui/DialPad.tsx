import { DialButton } from './DialButton'

type DialPadProps = {
  onKeyPress: (key: string) => void
  className?: string
  disabled?: boolean
}

const KEYS: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export function DialPad({ onKeyPress, className, disabled }: DialPadProps) {
  return (
    <div className={cx('grid grid-cols-3 gap-3', className)} role="group" aria-label="Discador numérico">
      {KEYS.map((k) => (
        <DialButton key={k} label={k} disabled={disabled} onClick={() => onKeyPress(k)} />
      ))}
    </div>
  )
}



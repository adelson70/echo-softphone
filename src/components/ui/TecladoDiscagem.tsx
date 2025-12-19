import { DialButton } from './BotaoDiscar'

type DialPadProps = {
  onKeyPress: (key: string) => void
  className?: string
  disabled?: boolean
  size?: 'default' | 'small'
}

const KEYPAD_KEYS: Array<{ key: string; letters?: string }> = [
  { key: '1' },
  { key: '2', letters: 'ABC' },
  { key: '3', letters: 'DEF' },
  { key: '4', letters: 'GHI' },
  { key: '5', letters: 'JKL' },
  { key: '6', letters: 'MNO' },
  { key: '7', letters: 'PQRS' },
  { key: '8', letters: 'TUV' },
  { key: '9', letters: 'WXYZ' },
  { key: '*' },
  { key: '0', letters: '+' },
  { key: '#' },
]

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export function DialPad({ onKeyPress, className, disabled, size = 'default' }: DialPadProps) {
  return (
    <div className={cx('grid w-full grid-cols-3 gap-4', className)} role="group" aria-label="Discador numérico">
      {KEYPAD_KEYS.map(({ key, letters }) => (
        <DialButton 
          key={key} 
          label={key} 
          letters={letters} 
          disabled={disabled} 
          onClick={() => onKeyPress(key)}
          size={size}
        />
      ))}
    </div>
  )
}



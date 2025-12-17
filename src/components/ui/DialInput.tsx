import { useRef } from 'react'
import { Delete } from 'lucide-react'

type DialInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
  autoFocus?: boolean
  disabled?: boolean
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export function DialInput({
  value,
  onChange,
  placeholder = 'Digite o número do contato',
  className,
  ariaLabel,
  autoFocus,
  disabled,
}: DialInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const showClear = !disabled && value.length > 0

  function handleClear() {
    onChange('')
    // Devolve o foco para o input após o clique no botão.
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className={cx('relative w-full text-center', className)}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        type="text"
        inputMode="text"
        className={cx(
          'h-14 w-full rounded-2xl border bg-background px-14 text-text text-center',
          'border-[#1E293B]',
          'text-[18px] leading-none tracking-wide',
          'placeholder:text-muted',
          'transition',
          'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      />

      {showClear ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar"
          className={cx(
            'absolute inset-y-0 right-0 flex items-center justify-center',
            'w-12 text-muted transition-colors',
            'hover:text-text',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
          )}
        >
          <Delete size={28} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}



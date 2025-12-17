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
  placeholder = 'Número, SIP URI ou contato',
  className,
  ariaLabel,
  autoFocus,
  disabled,
}: DialInputProps) {
  return (
    <div className={cx('w-full', className)}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        type="text"
        inputMode="text"
        className={cx(
          'h-14 w-full rounded-2xl border bg-background px-5 text-text',
          'border-[#1E293B]',
          'text-[22px] leading-none tracking-wide',
          'placeholder:text-muted',
          'transition',
          'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      />
    </div>
  )
}



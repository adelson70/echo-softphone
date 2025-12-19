import type { ReactNode } from 'react'

type InputTextProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon?: ReactNode
  className?: string
  name?: string
  autoComplete?: string
  disabled?: boolean
  ariaLabel?: string
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export function InputText({
  value,
  onChange,
  placeholder,
  icon,
  className,
  name,
  autoComplete,
  disabled,
  ariaLabel,
}: InputTextProps) {
  const hasIcon = Boolean(icon)

  return (
    <div className={cx('relative', className)}>
      {hasIcon ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted">
          {icon}
        </div>
      ) : null}

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        name={name}
        autoComplete={autoComplete}
        disabled={disabled}
        type="text"
        className={cx(
          'h-12 w-full rounded-xl border bg-background px-4 text-sm text-text placeholder:text-muted',
          'border-[#1E293B]',
          'transition',
          'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30',
          'disabled:cursor-not-allowed disabled:opacity-60',
          hasIcon ? 'pl-12' : undefined
        )}
      />
    </div>
  )
}



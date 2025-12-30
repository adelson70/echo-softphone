import type { ReactNode } from 'react'

type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  icon?: ReactNode
  className?: string
  name?: string
  disabled?: boolean
  ariaLabel?: string
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  icon,
  className,
  name,
  disabled,
  ariaLabel,
}: SelectProps) {
  const hasIcon = Boolean(icon)

  return (
    <div className={cx('relative', className)}>
      {hasIcon ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted">
          {icon}
        </div>
      ) : null}

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel ?? placeholder}
        name={name}
        disabled={disabled}
        className={cx(
          'h-12 w-full rounded-xl border bg-background px-4 text-sm text-text',
          'border-[#1E293B]',
          'transition',
          'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%239CA3AF\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")] bg-no-repeat bg-[length:12px] bg-[right_1rem_center] pr-10',
          hasIcon ? 'pl-12' : undefined
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}


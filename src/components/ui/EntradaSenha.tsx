import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type InputPasswordProps = {
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

function EyeIcon({ open }: { open: boolean }) {
  // Ícones inline (sem libs externas)
  if (open) {
    // eye-off
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 3l18 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10.58 10.58A3 3 0 0 0 13.42 13.42"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M9.88 5.1A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a18.55 18.55 0 0 1-3.1 4.37"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M6.11 6.11A18.53 18.53 0 0 0 2 12s3 8 10 8a10.87 10.87 0 0 0 5.05-1.23"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  // eye
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function InputPassword({
  value,
  onChange,
  placeholder,
  icon,
  className,
  name,
  autoComplete,
  disabled,
  ariaLabel,
}: InputPasswordProps) {
  const [visible, setVisible] = useState(false)
  const hasIcon = Boolean(icon)

  const inputType = useMemo(() => (visible ? 'text' : 'password'), [visible])

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
        type={inputType}
        className={cx(
          'h-12 w-full rounded-xl border bg-background px-4 text-sm text-text placeholder:text-muted',
          'border-[#1E293B]',
          'transition',
          'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30',
          'disabled:cursor-not-allowed disabled:opacity-60',
          hasIcon ? 'pl-12' : undefined,
          'pr-12'
        )}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        className={cx(
          'absolute inset-y-0 right-0 flex items-center justify-center px-4 text-muted',
          'transition-colors hover:text-text',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          disabled ? 'pointer-events-none' : undefined
        )}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  )
}



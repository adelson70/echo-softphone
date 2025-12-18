import type React from 'react'
import { PhoneOff } from 'lucide-react'

type HangupButtonProps = {
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  ariaLabel?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
}

const iconSizes = {
  sm: 20,
  md: 28,
  lg: 32,
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export function HangupButton({
  onClick,
  disabled = false,
  ariaLabel = 'Encerrar',
  className,
  size = 'md',
}: HangupButtonProps) {
  const sizeClass = sizeClasses[size]
  const iconSize = iconSizes[size]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cx(
        'flex items-center justify-center rounded-full bg-danger text-background transition-colors',
        'hover:bg-danger/90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        sizeClass,
        className
      )}
    >
      <PhoneOff size={iconSize} strokeWidth={2.5} />
    </button>
  )
}


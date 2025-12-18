import type React from 'react'
import { PhoneCall } from 'lucide-react'

type AnswerButtonProps = {
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

export function AnswerButton({
  onClick,
  disabled = false,
  ariaLabel = 'Atender',
  className,
  size = 'md',
}: AnswerButtonProps) {
  const sizeClass = sizeClasses[size]
  const iconSize = iconSizes[size]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cx(
        'flex items-center justify-center rounded-full bg-success text-background transition-colors',
        'hover:bg-success/90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        sizeClass,
        className
      )}
    >
      <PhoneCall size={iconSize} strokeWidth={2.5} />
    </button>
  )
}


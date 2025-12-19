import type { ReactNode } from 'react'

type ActionButtonVariant = 'success' | 'danger'

type ActionButtonProps = {
  variant: ActionButtonVariant
  icon: ReactNode
  onClick: () => void
  ariaLabel?: string
  disabled?: boolean
  className?: string
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

const variantClass: Record<ActionButtonVariant, string> = {
  success: 'bg-success text-background hover:bg-success/90 active:bg-success/80',
  danger: 'bg-danger text-background hover:bg-danger/90 active:bg-danger/80',
}

export function ActionButton({
  variant,
  icon,
  onClick,
  ariaLabel,
  disabled,
  className,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex h-16 w-16 items-center justify-center rounded-full transition',
        'shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClass[variant],
        className
      )}
    >
      {icon}
    </button>
  )
}



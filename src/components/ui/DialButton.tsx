type DialButtonProps = {
  label: string
  onClick: () => void
  className?: string
  disabled?: boolean
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export function DialButton({ label, onClick, className, disabled }: DialButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Tecla ${label}`}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex w-full aspect-square h-16 items-center justify-center rounded-2xl',
        'bg-card text-text',
        'border border-white/5',
        'text-2xl font-semibold',
        'transition',
        'hover:bg-white/5 active:bg-white/10 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      {label}
    </button>
  )
}



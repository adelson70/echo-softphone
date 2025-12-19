type DialButtonProps = {
  label: string
  letters?: string
  onClick: () => void
  className?: string
  disabled?: boolean
  size?: 'default' | 'small'
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export function DialButton({ label, letters, onClick, className, disabled, size = 'default' }: DialButtonProps) {
  const sizeClasses = size === 'small' 
    ? 'h-8 text-base' 
    : 'h-16 text-2xl'
  
  return (
    <button
      type="button"
      aria-label={`Tecla ${label}${letters ? ` ${letters}` : ''}`}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex w-full aspect-square flex-col items-center justify-center rounded-xl',
        sizeClasses,
        'bg-card text-text',
        'border border-white/5',
        'transition',
        'hover:bg-white/5 active:bg-white/10 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      <span className={`${size === 'small' ? 'text-base leading-none' : 'text-2xl'} font-semibold`}>{label}</span>
      {letters && <span className={`${size === 'small' ? 'text-[9px] leading-tight mt-0.5' : 'text-xs'} font-normal text-muted`}>{letters}</span>}
    </button>
  )
}



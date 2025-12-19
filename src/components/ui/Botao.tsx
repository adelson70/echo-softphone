import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'success' | 'danger'

type ButtonProps = {
  children: ReactNode
  variant: ButtonVariant
  className?: string
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type' | 'disabled'>

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-background hover:bg-primary/90 active:bg-primary/80',
  success: 'bg-success text-background hover:bg-success/90 active:bg-success/80',
  danger: 'bg-danger text-background hover:bg-danger/90 active:bg-danger/80',
}

export function Button({
  children,
  onClick,
  variant,
  className,
  type = 'button',
  disabled,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-60',
        variantClass[variant],
        className
      )}
    >
      {children}
    </button>
  )
}



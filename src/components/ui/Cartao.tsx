import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-2xl bg-card p-6 shadow-2xl sm:p-8',
        className
      )}
    >
      {children}
    </div>
  )
}



import type { ReactNode } from 'react'

type TopBarActive = 'dialer' | 'history' | 'contacts'

type TopBarProps = {
  onDialerClick: () => void
  onHistoryClick: () => void
  onContactsClick: () => void
  onLogout: () => void
  active?: TopBarActive | null
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

function HistoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12a9 9 0 1 0 3-6.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3v6h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ContactsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17 21v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 21v-1a3.5 3.5 0 0 0-2.5-3.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 4.6a4 4 0 0 1 0 7.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DialerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 17l5-5-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12H3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 3v18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

type IconButtonProps = {
  active?: boolean
  ariaLabel: string
  title?: string
  onClick: () => void
  children: ReactNode
}

function IconButton({ active, ariaLabel, title, onClick, children }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title || ariaLabel}
      onClick={onClick}
      className={cx(
        'inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
        active ? 'text-primary' : 'text-muted',
        'hover:text-text active:bg-white/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      {children}
    </button>
  )
}

export function TopBar({ onDialerClick, onHistoryClick, onContactsClick, onLogout, active }: TopBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-white/5 bg-background/80 backdrop-blur">
      <div className="mx-auto grid h-14 w-full max-w-2xl grid-cols-4 items-center px-4">
        <div className="flex items-center justify-start">
          <IconButton
            ariaLabel="Discador"
            title="Discador - Fazer e receber chamadas"
            onClick={onDialerClick}
            active={active === 'dialer'}
          >
            <DialerIcon />
          </IconButton>
        </div>

        <div className="flex items-center justify-center">
          <IconButton
            ariaLabel="Histórico de chamadas"
            title="Histórico - Ver histórico de chamadas"
            onClick={onHistoryClick}
            active={active === 'history'}
          >
            <HistoryIcon />
          </IconButton>
        </div>

        <div className="flex items-center justify-center">
          <IconButton
            ariaLabel="Agenda e contatos"
            title="Contatos - Ver agenda e contatos"
            onClick={onContactsClick}
            active={active === 'contacts'}
          >
            <ContactsIcon />
          </IconButton>
        </div>

        <div className="flex items-center justify-end">
          <IconButton
            ariaLabel="Sair"
            title="Sair - Desconectar e sair do sistema"
            onClick={onLogout}
          >
            <LogoutIcon />
          </IconButton>
        </div>
      </div>
    </header>
  )
}



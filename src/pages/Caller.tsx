import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/ui/TopBar'
import { DialInput } from '../components/ui/DialInput'
import { DialPad } from '../components/ui/DialPad'
import { ActionButton } from '../components/ui/ActionButton'

function PhoneIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.51a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.57-1.06a2 2 0 0 1 2.11-.45c.81.24 1.65.42 2.51.54A2 2 0 0 1 22 16.92Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HangupIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 13.5a15 15 0 0 1 3 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M2 16.9c.5-1.6 2.4-4.9 10-4.9s9.5 3.3 10 4.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 20l1.2-3.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 20l-1.2-3.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Caller() {
  const navigate = useNavigate()

  const [dialValue, setDialValue] = useState('')
  const [inCall, setInCall] = useState(false)

  const canCall = useMemo(() => dialValue.trim().length > 0, [dialValue])

  function appendKey(key: string) {
    setDialValue((prev) => (prev + key).slice(0, 128))
  }

  function handleDialChange(next: string) {
    setDialValue(next.slice(0, 128))
  }

  function handleCall() {
    if (!canCall) return
    setInCall(true)
    console.log('[UI] Chamando:', dialValue)
  }

  function handleHangup() {
    setInCall(false)
    console.log('[UI] Encerrar chamada')
  }

  function handleHistoryClick() {
    navigate('/historico')
  }

  function handleContactsClick() {
    navigate('/contatos')
  }

  function handleLogout() {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <TopBar
        onHistoryClick={handleHistoryClick}
        onContactsClick={handleContactsClick}
        onLogout={handleLogout}
      />

      <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-10 pt-20">
        <section className="flex flex-1 flex-col items-center justify-center gap-4">
          <DialInput value={dialValue} onChange={handleDialChange} autoFocus />
        </section>

        <section className="mt-6 flex flex-col items-center gap-5">
          <DialPad onKeyPress={appendKey} />

          <div className="flex items-center justify-center gap-6">
            <ActionButton
              variant="success"
              icon={<PhoneIcon />}
              onClick={handleCall}
              ariaLabel="Chamar"
              disabled={!canCall || inCall}
            />
            <ActionButton
              variant="danger"
              icon={<HangupIcon />}
              onClick={handleHangup}
              ariaLabel="Encerrar"
              disabled={!inCall}
            />
          </div>
        </section>
      </main>
    </div>
  )
}
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneCall, PhoneOff } from 'lucide-react'
import { TopBar } from '../components/ui/TopBar'
import { DialInput } from '../components/ui/DialInput'
import { DialPad } from '../components/ui/DialPad'
import { ActionButton } from '../components/ui/ActionButton'

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
    <div className="h-screen overflow-hidden bg-background text-text">
      <TopBar
        onHistoryClick={handleHistoryClick}
        onContactsClick={handleContactsClick}
        onLogout={handleLogout}
      />

      <main className="mx-auto flex h-full max-w-2xl flex-col px-4 pb-6 pt-24">
        <section className="flex-none">
          <DialInput value={dialValue} onChange={handleDialChange} autoFocus disabled={inCall} />
        </section>

        <section className="mt-8 flex min-h-0 flex-1 w-full flex-col items-stretch justify-end gap-10">
          <DialPad className="mx-auto w-full max-w-sm" onKeyPress={appendKey} disabled={inCall} />

          <div className="flex items-center justify-center gap-6">
            <ActionButton
              variant="success"
              icon={<PhoneCall size={28} strokeWidth={2} aria-hidden="true" />}
              onClick={handleCall}
              ariaLabel="Chamar"
              disabled={!canCall || inCall}
            />
            <ActionButton
              variant="danger"
              icon={<PhoneOff size={28} strokeWidth={2} aria-hidden="true" />}
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
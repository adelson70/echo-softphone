import { useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { InputText } from '../components/ui/InputText'
import { InputPassword } from '../components/ui/InputPassword'
import { Link } from 'react-router-dom'

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 21a8 8 0 1 0-16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 11h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12h20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Login() {
  const [sipUser, setSipUser] = useState('')
  const [sipPassword, setSipPassword] = useState('')
  const [sipDomain, setSipDomain] = useState('')

  const canSubmit = useMemo(() => {
    return sipUser.trim().length > 0 && sipPassword.length > 0 && sipDomain.trim().length > 0
  }, [sipUser, sipPassword, sipDomain])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // UI only (sem lógica SIP)
  }

  return (
    <div className="relative h-screen overflow-hidden bg-background text-text">
      <Link to="/caller" className="absolute right-4 top-4">
        <Button type="button" variant="primary">
          tela caller
        </Button>
      </Link>
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md border border-white/5">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Registrar conta SIP</h1>
            <p className="text-sm text-muted">
              Informe suas credenciais SIP para registrar no softphone.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <InputText
              value={sipUser}
              onChange={setSipUser}
              placeholder="Usuário SIP"
              icon={<UserIcon />}
              name="sipUser"
              autoComplete="username"
            />

            <InputPassword
              value={sipPassword}
              onChange={setSipPassword}
              placeholder="Senha SIP"
              icon={<LockIcon />}
              name="sipPassword"
              autoComplete="current-password"
            />

            <InputText
              value={sipDomain}
              onChange={setSipDomain}
              placeholder="Domínio SIP"
              icon={<GlobeIcon />}
              name="sipDomain"
              autoComplete="off"
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" disabled={!canSubmit}>
                Registrar
              </Button>
              <p className="mt-3 text-xs text-muted text-center">
                Dica: use o domínio do seu provedor/servidor 
                <br />
                (ex.: <span className="text-text">sip.suaempresa.com</span>).
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}



import { useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSipConfig } from '../config/sipConfigStore'
import { useSip } from './useSip'

export function RequireRegistered({ children }: PropsWithChildren) {
  const sip = useSip()
  const navigate = useNavigate()
  const startedRef = useRef(false)
  const [label, setLabel] = useState<string>('')

  const isRegistered = sip.snapshot.connection === 'registered'

  const isConnecting = useMemo(() => {
    return sip.snapshot.connection === 'connecting' || sip.snapshot.connection === 'connected'
  }, [sip.snapshot.connection])

  useEffect(() => {
    if (isRegistered) return
    if (startedRef.current) return
    startedRef.current = true

    ;(async () => {
      const cfg = await loadSipConfig()
      if (!cfg?.username || !cfg?.password || !cfg?.server) {
        navigate('/')
        return
      }

      setLabel(`${cfg.username}@${cfg.server}`)

      try {
        await sip.connectAndRegister({
          username: cfg.username,
          password: cfg.password,
          server: cfg.server,
          port: cfg.port,
          protocol: cfg.protocol,
        })
      } catch {
        navigate('/')
      }
    })()
  }, [isRegistered, navigate, sip])

  if (isRegistered) return <>{children}</>

  // Tela simples de “conectando”; evita renderizar páginas protegidas antes do registro.
  return (
    <div className="h-screen overflow-hidden bg-background text-text">
      <main className="mx-auto flex h-full max-w-2xl items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/5 bg-card p-6">
          <h1 className="text-lg font-semibold">Conectando...</h1>
          <p className="mt-2 text-sm text-muted">
            {label ? <>Registrando como <span className="text-text font-semibold">{label}</span>.</> : 'Carregando credenciais salvas...'}
          </p>
          <div className="mt-4 text-xs text-muted">
            {isConnecting ? 'Abrindo conexão WebSocket…' : 'Iniciando…'}
          </div>
          <button
            type="button"
            className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-background px-4 text-sm font-semibold text-text transition hover:bg-white/5"
            onClick={() => navigate('/')}
          >
            Voltar para o login
          </button>
        </div>
      </main>
    </div>
  )
}



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

  // Verificar se há chamada ativa (deve mostrar a UI mesmo se não estiver registrado ainda)
  const hasActiveCall = useMemo(() => {
    const status = sip.snapshot.callStatus
    return status === 'dialing' || 
           status === 'ringing' || 
           status === 'incoming' || 
           status === 'established'
  }, [sip.snapshot.callStatus])

  // Permitir renderização se estiver registrado OU se houver chamada ativa
  // Lógica simples e direta - sem otimizações que podem causar problemas
  const shouldRenderChildren = isRegistered || hasActiveCall

  useEffect(() => {
    if (shouldRenderChildren) return
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
  }, [shouldRenderChildren, navigate, sip])

  // Polling para verificar estado quando estiver conectando (fallback caso eventos não cheguem)
  useEffect(() => {
    if (shouldRenderChildren) return
    if (!isConnecting) return

    const interval = setInterval(async () => {
      // Se estiver usando backend nativo, tentar buscar snapshot diretamente
      if (sip.isNativeBackend && window.sipNative) {
        try {
          const nativeSnap = await window.sipNative.getSnapshot()
          // Se o módulo nativo diz que está registrado, o snapshot será atualizado pelo evento
          // Não forçar atualização aqui para evitar loops
        } catch {
          // Ignorar erros no polling
        }
      }
    }, 2000) // Verificar a cada 2 segundos (menos frequente para evitar spam)

    return () => clearInterval(interval)
  }, [shouldRenderChildren, isConnecting, sip])

  // Navegar para /discador quando uma chamada é iniciada (apenas uma vez)
  const hasNavigatedRef = useRef(false)
  useEffect(() => {
    if (hasActiveCall) {
      const currentPath = window.location.hash.replace('#', '')
      if (currentPath !== '/discador' && currentPath !== '/' && !hasNavigatedRef.current) {
        hasNavigatedRef.current = true
        navigate('/discador')
      }
    } else {
      // Reset quando não há chamada ativa
      hasNavigatedRef.current = false
    }
  }, [hasActiveCall, navigate])

  // Log de decisão de renderização
  useEffect(() => {
    console.log('[RequireRegistered] Decisão de renderização:', {
      isRegistered,
      hasActiveCall,
      shouldRenderChildren,
      callStatus: sip.snapshot.callStatus,
      connection: sip.snapshot.connection,
      callDirection: sip.snapshot.callDirection,
      remoteUri: sip.snapshot.remoteUri || 'vazio',
      snapshot: { ...sip.snapshot },
      renderizando: shouldRenderChildren ? 'CHILDREN' : 'TELA_CONECTANDO',
      timestamp: new Date().toISOString()
    })
  }, [isRegistered, hasActiveCall, shouldRenderChildren, sip.snapshot])

  // Renderizar children se estiver registrado OU se houver chamada ativa
  if (shouldRenderChildren) return <>{children}</>

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



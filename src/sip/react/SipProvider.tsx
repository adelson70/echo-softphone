import { createContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { PropsWithChildren } from 'react'
import type { SipClientSnapshot, SipCredentials, SipTransportProtocol } from '../types'
import type { ISipClient } from '../core/sipClientInterface'
import { createSipClient, requiresNative } from '../core/sipClientFactory'
import { bindRemoteAudio } from '../media/audioBinding'
import { handleDtmf, playLocalDtmfTone } from '../media/dtmf'
import { useCallAudioFeedback } from './useCallAudioFeedback'
import { useCallHistory } from './useCallHistory'

export type SipContextValue = {
  snapshot: SipClientSnapshot
  isRegistered: boolean
  callDurationSec: number
  speakerOn: boolean
  /** Indica se está usando o backend nativo (PJSIP) */
  isNativeBackend: boolean

  connectAndRegister: (credentials: SipCredentials) => Promise<void>
  unregisterAndDisconnect: () => Promise<void>
  startCall: (target: string) => Promise<void>
  answer: () => Promise<void>
  reject: () => Promise<void>
  hangup: () => Promise<void>
  sendDtmf: (key: string, opts?: { playLocal?: boolean; sendRemote?: boolean }) => boolean
  toggleMute: () => boolean
  toggleSpeaker: () => void
  transferBlind: (target: string) => Promise<void>
  transferAttended: (target: string) => Promise<void>
}

export const SipContext = createContext<SipContextValue | null>(null)

export function SipProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<SipClientSnapshot>({ connection: 'idle', callStatus: 'idle' })
  const [callDurationSec, setCallDurationSec] = useState(0)
  const [speakerOn, setSpeakerOn] = useState(false)
  const [currentProtocol, setCurrentProtocol] = useState<SipTransportProtocol>('wss')

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const clientRef = useRef<ISipClient | null>(null)
  const timerRef = useRef<number | null>(null)

  // Verifica se está usando backend nativo
  const isNativeBackend = requiresNative(currentProtocol)

  // Função para criar/recriar o cliente baseado no protocolo
  const getOrCreateClient = useCallback((protocol: SipTransportProtocol): ISipClient => {
    // Se protocolo mudou ou cliente não existe, cria novo
    if (!clientRef.current || currentProtocol !== protocol) {
      // Limpar cliente anterior se existir
      if (clientRef.current) {
        clientRef.current.unregisterAndDisconnect().catch(() => {})
      }

      console.log(`[SipProvider] Criando cliente para protocolo: ${protocol}`)
      clientRef.current = createSipClient(protocol, {
        onSnapshot: (snap) => setSnapshot(snap),
      })
      setCurrentProtocol(protocol)
    }

    return clientRef.current
  }, [currentProtocol])

  // Timer simples (UI)
  useEffect(() => {
    if (snapshot.callStatus !== 'established') {
      setCallDurationSec(0)
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
      return
    }
    const started = Date.now()
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setCallDurationSec(Math.floor((Date.now() - started) / 1000))
    }, 1000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [snapshot.callStatus])

  // Bind do áudio remoto quando estabelece a sessão (apenas para WebSocket/WebRTC)
  useEffect(() => {
    const client = clientRef.current
    const audioEl = remoteAudioRef.current
    if (!client || !audioEl) return
    
    // Se a chamada foi cancelada/terminada, para o áudio imediatamente
    if (snapshot.callStatus === 'idle' || snapshot.callStatus === 'terminating' || snapshot.callStatus === 'terminated') {
      audioEl.pause()
      audioEl.srcObject = null
      return
    }
    
    if (snapshot.callStatus !== 'established') return
    
    // Bind de áudio apenas para WebSocket (WebRTC)
    // O backend nativo gerencia áudio internamente via PJSIP
    if (!isNativeBackend) {
      const session = client.getActiveSession()
      if (!session) return
      bindRemoteAudio(session, audioEl)
    }
  }, [snapshot.callStatus, snapshot.sipSessionState, isNativeBackend])

  // Viva-voz (primeira versão): controla volume do áudio remoto.
  useEffect(() => {
    const audioEl = remoteAudioRef.current
    if (!audioEl) return
    audioEl.volume = speakerOn ? 1.0 : 0.35
  }, [speakerOn])

  // Sons de feedback de chamada
  useCallAudioFeedback(snapshot)

  // Histórico de chamadas
  useCallHistory({ snapshot })

  // Restaura e foca a janela quando uma chamada entrante for recebida
  useEffect(() => {
    if (snapshot.callStatus === 'incoming' && window.ipcRenderer) {
      window.ipcRenderer.invoke('window:restoreAndFocus').catch((error) => {
        console.error('Erro ao restaurar janela:', error)
      })
    }
  }, [snapshot.callStatus])

  const value = useMemo<SipContextValue>(() => {
    return {
      snapshot,
      isRegistered: snapshot.connection === 'registered',
      callDurationSec,
      speakerOn,
      isNativeBackend,

      connectAndRegister: async (credentials) => {
        const protocol = credentials.protocol ?? 'wss'
        const client = getOrCreateClient(protocol)
        await client.connectAndRegister(credentials)
      },

      unregisterAndDisconnect: async () => {
        const client = clientRef.current
        if (client) {
          await client.unregisterAndDisconnect()
        }
      },

      startCall: async (target) => {
        const client = clientRef.current
        if (!client) throw new Error('Cliente não inicializado')
        await client.startCall(target)
      },

      answer: async () => {
        const client = clientRef.current
        if (!client) throw new Error('Cliente não inicializado')
        await client.answer()
      },

      reject: async () => {
        const client = clientRef.current
        if (!client) throw new Error('Cliente não inicializado')
        await client.reject()
      },

      hangup: async () => {
        const client = clientRef.current
        if (!client) throw new Error('Cliente não inicializado')
        await client.hangup()
      },

      sendDtmf: (key, opts) => {
        const client = clientRef.current
        const playLocal = opts?.playLocal ?? true
        const sendRemote = opts?.sendRemote ?? true

        // Sempre tocar som local se solicitado
        if (playLocal) {
          playLocalDtmfTone(key)
        }

        if (!client || !sendRemote) return playLocal

        // Para backend nativo, usar sendDtmf diretamente
        if (isNativeBackend) {
          return client.sendDtmf(key)
        }

        // Para WebSocket, usar handleDtmf que trabalha com a sessão
        const session = client.getActiveSession()
        return handleDtmf(session, key, {
          playLocal: false, // Já tocamos acima
          sendRemote: true,
        })
      },

      toggleMute: () => {
        const client = clientRef.current
        if (!client) return false
        return client.toggleMuted()
      },

      toggleSpeaker: () => setSpeakerOn((prev) => !prev),

      transferBlind: async (target) => {
        const client = clientRef.current
        if (!client) throw new Error('Cliente não inicializado')
        await client.transferBlind(target)
      },

      transferAttended: async (target) => {
        const client = clientRef.current
        if (!client) throw new Error('Cliente não inicializado')
        await client.transferAttended(target)
      },
    }
  }, [snapshot, callDurationSec, speakerOn, isNativeBackend, getOrCreateClient])

  return (
    <SipContext.Provider value={value}>
      {children}
      {/* Elemento de áudio apenas necessário para WebSocket/WebRTC */}
      {!isNativeBackend && (
        <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
      )}
    </SipContext.Provider>
  )
}
